using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProcesoTutorias.Server.DTOs;
using ProcesoTutorias.Server.Models;

namespace ProcesoTutorias.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "ADMIN")]
public class RolesController : ControllerBase
{
    private readonly SistemaTutoriasContext _context;

    public RolesController(SistemaTutoriasContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<RolAdminDto>>> ObtenerRoles()
    {
        var roles = await _context.Rols
            .AsNoTracking()
            .OrderBy(r => r.IdRol)
            .Select(r => new RolAdminDto
            {
                IdRol = r.IdRol,
                Nombre = r.Nombre,
                TotalUsuarios = r.Usuarios.Count
            })
            .ToListAsync();

        return Ok(roles);
    }

    [HttpPost]
    public async Task<ActionResult<RolAdminDto>> CrearRol([FromBody] RolGuardarDto dto)
    {
        string nombre = NormalizarNombre(dto.Nombre);

        if (string.IsNullOrWhiteSpace(nombre))
            return BadRequest(new { message = "[ROL_NOMBRE_REQUERIDO] El nombre del rol es obligatorio." });

        bool existe = await _context.Rols.AnyAsync(r => r.Nombre == nombre);
        if (existe)
            return Conflict(new { message = "[ROL_DUPLICADO] Ya existe un rol con ese nombre." });

        var rol = new Rol { Nombre = nombre };
        _context.Rols.Add(rol);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(ObtenerRoles), new { id = rol.IdRol }, new RolAdminDto
        {
            IdRol = rol.IdRol,
            Nombre = rol.Nombre,
            TotalUsuarios = 0
        });
    }

    [HttpPut("{idRol:int}")]
    public async Task<IActionResult> ActualizarRol(int idRol, [FromBody] RolGuardarDto dto)
    {
        string nombre = NormalizarNombre(dto.Nombre);

        if (string.IsNullOrWhiteSpace(nombre))
            return BadRequest(new { message = "[ROL_NOMBRE_REQUERIDO] El nombre del rol es obligatorio." });

        var rol = await _context.Rols.FindAsync(idRol);
        if (rol == null)
            return NotFound(new { message = "[ROL_NO_ENCONTRADO] Rol no encontrado." });

        bool existe = await _context.Rols.AnyAsync(r => r.IdRol != idRol && r.Nombre == nombre);
        if (existe)
            return Conflict(new { message = "[ROL_DUPLICADO] Ya existe un rol con ese nombre." });

        rol.Nombre = nombre;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Rol actualizado correctamente." });
    }

    [HttpDelete("{idRol:int}")]
    public async Task<IActionResult> EliminarRol(int idRol)
    {
        var rol = await _context.Rols.Include(r => r.Usuarios).FirstOrDefaultAsync(r => r.IdRol == idRol);
        if (rol == null)
            return NotFound(new { message = "[ROL_NO_ENCONTRADO] Rol no encontrado." });

        if (rol.Usuarios.Any())
            return Conflict(new { message = "[ROL_EN_USO] No se puede eliminar un rol con usuarios asignados." });

        _context.Rols.Remove(rol);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Rol eliminado correctamente." });
    }

    private static string NormalizarNombre(string? nombre)
    {
        return (nombre ?? string.Empty).Trim().ToUpperInvariant();
    }
}
