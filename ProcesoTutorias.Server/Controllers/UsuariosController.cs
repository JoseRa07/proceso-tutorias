using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProcesoTutorias.Server.DTOs;
using ProcesoTutorias.Server.Models;
using ProcesoTutorias.Server.Validation;
using ProcesoTutorias.Server.Services;

namespace ProcesoTutorias.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "ADMIN")]
public class UsuariosController : ControllerBase
{
    private readonly SistemaTutoriasContext _context;
    private readonly SessionTokenService _sessionTokenService;
    private readonly AuditLogService _auditLogService;

    public UsuariosController(
        SistemaTutoriasContext context,
        SessionTokenService sessionTokenService,
        AuditLogService auditLogService)
    {
        _context = context;
        _sessionTokenService = sessionTokenService;
        _auditLogService = auditLogService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<UsuarioAdminDto>>> ObtenerUsuarios(string? buscar = null, int? idRol = null)
    {
        string filtro = InputSanitizer.NormalizeSingleLine(buscar);
        string? filterError = InputSanitizer.ValidateFreeText(filtro, "La búsqueda", 100, required: false);
        if (filterError != null)
            return BadRequest(new { message = filterError });
        if (idRol.HasValue && !InputSanitizer.IsPositiveId(idRol.Value))
            return BadRequest(new { message = "[USUARIO_ROL_INVALIDO] El rol debe ser un entero mayor que cero." });

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

        string correo = InputSanitizer.NormalizeSingleLine(dto.Correo).ToLowerInvariant();
        bool correoExiste = await _context.Usuarios.AnyAsync(u => u.Correo == correo);
        if (correoExiste)
            return Conflict(new { message = "[USUARIO_CORREO_DUPLICADO] Ya existe un usuario con ese correo." });

        var usuario = new Usuario
        {
            Nombre = InputSanitizer.NormalizeSingleLine(dto.Nombre),
            Apellidos = InputSanitizer.NormalizeSingleLine(dto.Apellidos),
            Correo = correo,
            Telefono = string.IsNullOrWhiteSpace(dto.Telefono) ? null : InputSanitizer.NormalizeSingleLine(dto.Telefono),
            IdRol = dto.IdRol,
            ContrasenaHash = BCrypt.Net.BCrypt.HashPassword(dto.ContrasenaInicial!),
            ReqCambioContra = true,
            SessionVersion = 1
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

        string correo = InputSanitizer.NormalizeSingleLine(dto.Correo).ToLowerInvariant();
        bool correoExiste = await _context.Usuarios.AnyAsync(u => u.IdUsuario != idUsuario && u.Correo == correo);
        if (correoExiste)
            return Conflict(new { message = "[USUARIO_CORREO_DUPLICADO] Ya existe un usuario con ese correo." });

        usuario.Nombre = InputSanitizer.NormalizeSingleLine(dto.Nombre);
        usuario.Apellidos = InputSanitizer.NormalizeSingleLine(dto.Apellidos);
        usuario.Correo = correo;
        usuario.Telefono = string.IsNullOrWhiteSpace(dto.Telefono) ? null : InputSanitizer.NormalizeSingleLine(dto.Telefono);
        bool roleChanged = usuario.IdRol != dto.IdRol;
        usuario.IdRol = dto.IdRol;
        if (roleChanged)
            usuario.SessionVersion++;

        await _context.SaveChangesAsync();
        if (roleChanged)
            await _sessionTokenService.RevokeAllForUserAsync(usuario.IdUsuario);

        return Ok(new { message = "Usuario actualizado correctamente." });
    }

    [HttpPut("{idUsuario:int}/contrasena")]
    public async Task<IActionResult> RestablecerContrasena(int idUsuario, [FromBody] UsuarioContrasenaDto dto)
    {
        string? passwordError = InputSanitizer.ValidatePassword(dto.ContrasenaInicial);
        if (passwordError != null)
            return BadRequest(new { message = passwordError });

        var usuario = await _context.Usuarios.FindAsync(idUsuario);
        if (usuario == null)
            return NotFound(new { message = "[USUARIO_NO_ENCONTRADO] Usuario no encontrado." });

        usuario.ContrasenaHash = BCrypt.Net.BCrypt.HashPassword(dto.ContrasenaInicial);
        usuario.ReqCambioContra = true;
        usuario.SessionVersion++;
        _auditLogService.Record(
            "USUARIO_CONTRASENA_RESTABLECIDA",
            "Usuario",
            idUsuario,
            "Un administrador restableció la contraseña del usuario.");
        await _context.SaveChangesAsync();
        await _sessionTokenService.RevokeAllForUserAsync(usuario.IdUsuario);

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

        _auditLogService.Record(
            "USUARIO_ELIMINADO",
            "Usuario",
            idUsuario,
            "Cuenta de usuario eliminada.");
        _context.Usuarios.Remove(usuario);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Usuario eliminado correctamente." });
    }

    private async Task<string?> ValidarUsuario(UsuarioGuardarDto dto, bool esNuevo)
    {
        string? nameError = InputSanitizer.ValidatePersonName(dto.Nombre, "El nombre");
        if (nameError != null)
            return nameError;

        string? lastNameError = InputSanitizer.ValidatePersonName(dto.Apellidos, "Los apellidos");
        if (lastNameError != null)
            return lastNameError;

        string? emailError = InputSanitizer.ValidateEmail(dto.Correo);
        if (emailError != null)
            return emailError;

        string? phoneError = InputSanitizer.ValidatePhone(dto.Telefono);
        if (phoneError != null)
            return phoneError;

        if (!InputSanitizer.IsPositiveId(dto.IdRol))
            return "[USUARIO_ROL_INVALIDO] Selecciona un rol válido.";

        bool rolExiste = await _context.Rols.AnyAsync(r => r.IdRol == dto.IdRol);
        if (!rolExiste)
            return "[USUARIO_ROL_INVALIDO] Selecciona un rol válido.";

        if (esNuevo)
        {
            string? passwordError = InputSanitizer.ValidatePassword(dto.ContrasenaInicial);
            if (passwordError != null)
                return passwordError;
        }

        return null;
    }
}
