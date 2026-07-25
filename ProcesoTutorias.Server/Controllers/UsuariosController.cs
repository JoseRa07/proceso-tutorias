using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProcesoTutorias.Server.DTOs;
using ProcesoTutorias.Server.Models;

namespace ProcesoTutorias.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "ADMIN")]
public class UsuariosController : ControllerBase
{
    private readonly SistemaTutoriasContext _context;

    public UsuariosController(SistemaTutoriasContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<UsuarioAdminDto>>> ObtenerUsuarios(string? buscar = null, int? idRol = null)
    {
        string filtro = (buscar ?? string.Empty).Trim();

        var query = _context.Usuarios.AsNoTracking().Include(u => u.IdRolNavigation).AsQueryable();

        if (idRol.HasValue)
            query = query.Where(u => u.IdRol == idRol.Value);

        if (!string.IsNullOrWhiteSpace(filtro))
            query = query.Where(u => u.Nombre.Contains(filtro) || u.Apellidos.Contains(filtro) || u.Correo.Contains(filtro));

        var usuarios = await query
            .OrderBy(u => u.Nombre)
            .ThenBy(u => u.Apellidos)
            .Select(u => new UsuarioAdminDto
            {
                IdUsuario = u.IdUsuario,
                Nombre = u.Nombre,
                Apellidos = u.Apellidos,
                Correo = u.Correo,
                Telefono = u.Telefono,
                IdRol = u.IdRol,
                Rol = u.IdRolNavigation.Nombre,
                ReqCambioContra = u.ReqCambioContra
            })
            .ToListAsync();

        return Ok(usuarios);
    }

    [HttpPost]
    public async Task<ActionResult<UsuarioAdminDto>> CrearUsuario([FromBody] UsuarioGuardarDto dto)
    {
        string? error = await ValidarUsuario(dto, esNuevo: true);
        if (error != null)
            return BadRequest(new { message = error });

        bool correoExiste = await _context.Usuarios.AnyAsync(u => u.Correo == dto.Correo.Trim());
        if (correoExiste)
            return Conflict(new { message = "[USUARIO_CORREO_DUPLICADO] Ya existe un usuario con ese correo." });

        var usuario = new Usuario
        {
            Nombre = dto.Nombre.Trim(),
            Apellidos = dto.Apellidos.Trim(),
            Correo = dto.Correo.Trim(),
            Telefono = string.IsNullOrWhiteSpace(dto.Telefono) ? null : dto.Telefono.Trim(),
            IdRol = dto.IdRol,
            ContrasenaHash = dto.ContrasenaInicial!.Trim(),
            ReqCambioContra = true
        };

        _context.Usuarios.Add(usuario);
        await _context.SaveChangesAsync();

        var creado = await _context.Usuarios
            .AsNoTracking()
            .Include(u => u.IdRolNavigation)
            .Where(u => u.IdUsuario == usuario.IdUsuario)
            .Select(u => new UsuarioAdminDto
            {
                IdUsuario = u.IdUsuario,
                Nombre = u.Nombre,
                Apellidos = u.Apellidos,
                Correo = u.Correo,
                Telefono = u.Telefono,
                IdRol = u.IdRol,
                Rol = u.IdRolNavigation.Nombre,
                ReqCambioContra = u.ReqCambioContra
            })
            .FirstAsync();

        return CreatedAtAction(nameof(ObtenerUsuarios), new { id = creado.IdUsuario }, creado);
    }

    [HttpPut("{idUsuario:int}")]
    public async Task<IActionResult> ActualizarUsuario(int idUsuario, [FromBody] UsuarioGuardarDto dto)
    {
        string? error = await ValidarUsuario(dto, esNuevo: false);
        if (error != null)
            return BadRequest(new { message = error });

        var usuario = await _context.Usuarios.FindAsync(idUsuario);
        if (usuario == null)
            return NotFound(new { message = "[USUARIO_NO_ENCONTRADO] Usuario no encontrado." });

        bool correoExiste = await _context.Usuarios.AnyAsync(u => u.IdUsuario != idUsuario && u.Correo == dto.Correo.Trim());
        if (correoExiste)
            return Conflict(new { message = "[USUARIO_CORREO_DUPLICADO] Ya existe un usuario con ese correo." });

        usuario.Nombre = dto.Nombre.Trim();
        usuario.Apellidos = dto.Apellidos.Trim();
        usuario.Correo = dto.Correo.Trim();
        usuario.Telefono = string.IsNullOrWhiteSpace(dto.Telefono) ? null : dto.Telefono.Trim();
        usuario.IdRol = dto.IdRol;

        await _context.SaveChangesAsync();

        return Ok(new { message = "Usuario actualizado correctamente." });
    }

    [HttpPut("{idUsuario:int}/contrasena")]
    public async Task<IActionResult> RestablecerContrasena(int idUsuario, [FromBody] UsuarioContrasenaDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.ContrasenaInicial) || dto.ContrasenaInicial.Trim().Length < 6)
            return BadRequest(new { message = "[USUARIO_CONTRASENA_INVALIDA] La contraseña inicial debe tener al menos 6 caracteres." });

        var usuario = await _context.Usuarios.FindAsync(idUsuario);
        if (usuario == null)
            return NotFound(new { message = "[USUARIO_NO_ENCONTRADO] Usuario no encontrado." });

        usuario.ContrasenaHash = dto.ContrasenaInicial.Trim();
        usuario.ReqCambioContra = true;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Contraseña restablecida correctamente." });
    }

    [HttpDelete("{idUsuario:int}")]
    public async Task<IActionResult> EliminarUsuario(int idUsuario)
    {
        var usuario = await _context.Usuarios
            .Include(u => u.Alumnos)
            .Include(u => u.Maestros)
            .FirstOrDefaultAsync(u => u.IdUsuario == idUsuario);

        if (usuario == null)
            return NotFound(new { message = "[USUARIO_NO_ENCONTRADO] Usuario no encontrado." });

        if (usuario.Alumnos.Any() || usuario.Maestros.Any())
            return Conflict(new { message = "[USUARIO_CON_DEPENDENCIAS] No se puede eliminar un usuario vinculado a alumno o maestro." });

        _context.Usuarios.Remove(usuario);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Usuario eliminado correctamente." });
    }

    private async Task<string?> ValidarUsuario(UsuarioGuardarDto dto, bool esNuevo)
    {
        if (string.IsNullOrWhiteSpace(dto.Nombre))
            return "[USUARIO_NOMBRE_REQUERIDO] El nombre es obligatorio.";

        if (string.IsNullOrWhiteSpace(dto.Apellidos))
            return "[USUARIO_APELLIDOS_REQUERIDOS] Los apellidos son obligatorios.";

        if (string.IsNullOrWhiteSpace(dto.Correo))
            return "[USUARIO_CORREO_REQUERIDO] El correo es obligatorio.";

        if (!dto.Correo.Contains('@'))
            return "[USUARIO_CORREO_INVALIDO] El correo no tiene un formato válido.";

        bool rolExiste = await _context.Rols.AnyAsync(r => r.IdRol == dto.IdRol);
        if (!rolExiste)
            return "[USUARIO_ROL_INVALIDO] Selecciona un rol válido.";

        if (esNuevo && (string.IsNullOrWhiteSpace(dto.ContrasenaInicial) || dto.ContrasenaInicial.Trim().Length < 6))
            return "[USUARIO_CONTRASENA_INVALIDA] La contraseña inicial debe tener al menos 6 caracteres.";

        return null;
    }
}
