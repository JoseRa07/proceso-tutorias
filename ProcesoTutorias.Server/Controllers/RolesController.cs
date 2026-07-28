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
public class RolesController : ControllerBase
{
    private readonly SistemaTutoriasContext _context;
    private readonly SessionTokenService _sessionTokenService;
    private readonly AuditLogService _auditLogService;

    public RolesController(
        SistemaTutoriasContext context,
        SessionTokenService sessionTokenService,
        AuditLogService auditLogService)
    {
        _context = context;
        _sessionTokenService = sessionTokenService;
        _auditLogService = auditLogService;
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

        string? validationError = InputSanitizer.ValidateIdentifier(nombre, "El nombre del rol", 50, roleName: true);
        if (validationError != null)
            return BadRequest(new { message = validationError });

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

        string? validationError = InputSanitizer.ValidateIdentifier(nombre, "El nombre del rol", 50, roleName: true);
        if (validationError != null)
            return BadRequest(new { message = validationError });

        var rol = await _context.Rols
            .Include(item => item.Usuarios)
            .FirstOrDefaultAsync(item => item.IdRol == idRol);
        if (rol == null)
            return NotFound(new { message = "[ROL_NO_ENCONTRADO] Rol no encontrado." });

        bool existe = await _context.Rols.AnyAsync(r => r.IdRol != idRol && r.Nombre == nombre);
        if (existe)
            return Conflict(new { message = "[ROL_DUPLICADO] Ya existe un rol con ese nombre." });

        string previousName = rol.Nombre;
        rol.Nombre = nombre;
        foreach (var user in rol.Usuarios)
            user.SessionVersion++;
        _auditLogService.Record(
            "ROL_MODIFICADO",
            "Rol",
            idRol,
            $"Nombre cambiado de {previousName} a {nombre}.");
        await _context.SaveChangesAsync();
        foreach (var user in rol.Usuarios)
            await _sessionTokenService.RevokeAllForUserAsync(user.IdUsuario);

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

        _auditLogService.Record(
            "ROL_ELIMINADO",
            "Rol",
            idRol,
            $"Rol eliminado: {rol.Nombre}.");
        _context.Rols.Remove(rol);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Rol eliminado correctamente." });
    }

    private static string NormalizarNombre(string? nombre)
    {
        return InputSanitizer.NormalizeSingleLine(nombre).ToUpperInvariant();
    }
}
