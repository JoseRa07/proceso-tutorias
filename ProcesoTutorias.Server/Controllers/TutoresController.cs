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
public class TutoresController : ControllerBase
{
    private const int RolTutor = 3;
    private const int RolMaestro = 4;

    private readonly SistemaTutoriasContext _context;
    private readonly SessionTokenService _sessionTokenService;

    public TutoresController(
        SistemaTutoriasContext context,
        SessionTokenService sessionTokenService)
    {
        _context = context;
        _sessionTokenService = sessionTokenService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<TutorAdminDto>>> ObtenerTutores(string? buscar = null)
    {
        string filtro = InputSanitizer.NormalizeSingleLine(buscar);
        string? filterError = InputSanitizer.ValidateFreeText(filtro, "La búsqueda", 100, required: false);
        if (filterError != null)
            return BadRequest(new { message = filterError });

        var query = _context.Maestros
            .AsNoTracking()
            .Include(m => m.IdUsuarioNavigation)
            .Include(m => m.Tutors)
                .ThenInclude(t => t.Grupos)
            .Include(m => m.Tutors)
                .ThenInclude(t => t.Tutoria)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(filtro))
            query = query.Where(m =>
                m.CodEmpleado.Contains(filtro) ||
                m.IdUsuarioNavigation.Nombre.Contains(filtro) ||
                m.IdUsuarioNavigation.Apellidos.Contains(filtro) ||
                m.IdUsuarioNavigation.Correo.Contains(filtro));

        var maestros = await query
            .OrderBy(m => m.IdUsuarioNavigation.Nombre)
            .ThenBy(m => m.IdUsuarioNavigation.Apellidos)
            .Select(m => new TutorAdminDto
            {
                IdMaestro = m.IdMaestro,
                IdTutor = m.Tutors.Select(t => (int?)t.IdTutor).FirstOrDefault(),
                IdUsuario = m.IdUsuario,
                NombreCompleto = m.IdUsuarioNavigation.Nombre + " " + m.IdUsuarioNavigation.Apellidos,
                Correo = m.IdUsuarioNavigation.Correo,
                CodEmpleado = m.CodEmpleado,
                Vigencia = m.Vigencia,
                TotalGrupos = m.Tutors.SelectMany(t => t.Grupos).Count(),
                TotalTutorias = m.Tutors.SelectMany(t => t.Tutoria).Count(),
                EsTutor = m.Tutors.Any()
            })
            .ToListAsync();

        return Ok(maestros);
    }

    [HttpGet("usuarios-candidatos")]
    public async Task<ActionResult<IEnumerable<UsuarioCandidatoTutorDto>>> ObtenerUsuariosCandidatos()
    {
        var usuarios = await _context.Usuarios
            .AsNoTracking()
            .Include(u => u.IdRolNavigation)
            .Where(u => !u.Maestros.Any() && (u.IdRol == RolMaestro || u.IdRol == RolTutor))
            .OrderBy(u => u.Nombre)
            .ThenBy(u => u.Apellidos)
            .Select(u => new UsuarioCandidatoTutorDto
            {
                IdUsuario = u.IdUsuario,
                NombreCompleto = u.Nombre + " " + u.Apellidos,
                Correo = u.Correo,
                IdRol = u.IdRol,
                Rol = u.IdRolNavigation.Nombre
            })
            .ToListAsync();

        return Ok(usuarios);
    }

    [HttpPost]
    public async Task<IActionResult> CrearMaestroTutor([FromBody] TutorGuardarDto dto)
    {
        string? error = await ValidarMaestro(dto.IdUsuario, dto.CodEmpleado, dto.Vigencia);
        if (error != null)
            return BadRequest(new { message = error });

        bool usuarioConMaestro = await _context.Maestros.AnyAsync(m => m.IdUsuario == dto.IdUsuario);
        if (usuarioConMaestro)
            return Conflict(new { message = "[TUTOR_USUARIO_DUPLICADO] Ese usuario ya tiene registro de maestro." });

        string codigo = InputSanitizer.NormalizeSingleLine(dto.CodEmpleado);
        bool codigoExiste = await _context.Maestros.AnyAsync(m => m.CodEmpleado == codigo);
        if (codigoExiste)
            return Conflict(new { message = "[TUTOR_CODIGO_DUPLICADO] Ya existe un maestro con ese código de empleado." });

        var usuario = await _context.Usuarios.FindAsync(dto.IdUsuario);
        if (usuario == null)
            return NotFound(new { message = "[TUTOR_USUARIO_NO_ENCONTRADO] Usuario no encontrado." });

        var maestro = new Maestro
        {
            IdUsuario = dto.IdUsuario,
            CodEmpleado = codigo,
            Vigencia = dto.Vigencia
        };

        _context.Maestros.Add(maestro);
        await _context.SaveChangesAsync();

        if (dto.ActivarComoTutor)
        {
            _context.Tutors.Add(new Tutor { IdMaestro = maestro.IdMaestro });
            if (usuario.IdRol != RolTutor)
                usuario.SessionVersion++;
            usuario.IdRol = RolTutor;
        }
        else if (usuario.IdRol == RolTutor)
        {
            usuario.IdRol = RolMaestro;
            usuario.SessionVersion++;
        }

        await _context.SaveChangesAsync();
        await _sessionTokenService.RevokeAllForUserAsync(usuario.IdUsuario);

        return Ok(new { message = "Registro de maestro/tutor guardado correctamente." });
    }

    [HttpPut("{idMaestro:int}")]
    public async Task<IActionResult> ActualizarMaestro(int idMaestro, [FromBody] MaestroActualizarDto dto)
    {
        string? codeError = InputSanitizer.ValidateIdentifier(dto.CodEmpleado, "El código de empleado", 30);
        if (codeError != null)
            return BadRequest(new { message = codeError });
        if (dto.Vigencia == default || dto.Vigencia < DateOnly.FromDateTime(DateTime.Today))
            return BadRequest(new { message = "[TUTOR_VIGENCIA_INVALIDA] La vigencia no puede ser anterior al día de hoy." });

        var maestro = await _context.Maestros.FindAsync(idMaestro);
        if (maestro == null)
            return NotFound(new { message = "[TUTOR_MAESTRO_NO_ENCONTRADO] Maestro no encontrado." });

        string codigo = InputSanitizer.NormalizeSingleLine(dto.CodEmpleado);
        bool codigoExiste = await _context.Maestros.AnyAsync(m => m.IdMaestro != idMaestro && m.CodEmpleado == codigo);
        if (codigoExiste)
            return Conflict(new { message = "[TUTOR_CODIGO_DUPLICADO] Ya existe un maestro con ese código de empleado." });

        maestro.CodEmpleado = codigo;
        maestro.Vigencia = dto.Vigencia;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Datos de maestro actualizados correctamente." });
    }

    [HttpPut("{idMaestro:int}/activar")]
    public async Task<IActionResult> ActivarTutor(int idMaestro)
    {
        var maestro = await _context.Maestros.Include(m => m.Tutors).FirstOrDefaultAsync(m => m.IdMaestro == idMaestro);
        if (maestro == null)
            return NotFound(new { message = "[TUTOR_MAESTRO_NO_ENCONTRADO] Maestro no encontrado." });

        if (!maestro.Tutors.Any())
            _context.Tutors.Add(new Tutor { IdMaestro = idMaestro });

        var usuario = await _context.Usuarios.FindAsync(maestro.IdUsuario);
        if (usuario != null)
        {
            if (usuario.IdRol != RolTutor)
                usuario.SessionVersion++;
            usuario.IdRol = RolTutor;
        }

        await _context.SaveChangesAsync();
        if (usuario != null)
            await _sessionTokenService.RevokeAllForUserAsync(usuario.IdUsuario);

        return Ok(new { message = "Tutor activado correctamente." });
    }

    [HttpPut("{idTutor:int}/desactivar")]
    public async Task<IActionResult> DesactivarTutor(int idTutor)
    {
        var tutor = await _context.Tutors
            .Include(t => t.Grupos)
            .Include(t => t.Tutoria)
            .Include(t => t.IdMaestroNavigation)
            .FirstOrDefaultAsync(t => t.IdTutor == idTutor);

        if (tutor == null)
            return NotFound(new { message = "[TUTOR_NO_ENCONTRADO] Tutor no encontrado." });

        if (tutor.Grupos.Any() || tutor.Tutoria.Any())
            return Conflict(new { message = "[TUTOR_CON_DEPENDENCIAS] No se puede desactivar un tutor con grupos o tutorías asignadas." });

        var usuario = await _context.Usuarios.FindAsync(tutor.IdMaestroNavigation.IdUsuario);
        if (usuario != null)
        {
            usuario.IdRol = RolMaestro;
            usuario.SessionVersion++;
        }

        _context.Tutors.Remove(tutor);
        await _context.SaveChangesAsync();
        if (usuario != null)
            await _sessionTokenService.RevokeAllForUserAsync(usuario.IdUsuario);

        return Ok(new { message = "Tutor desactivado correctamente." });
    }

    private async Task<string?> ValidarMaestro(int idUsuario, string? codEmpleado, DateOnly vigencia)
    {
        if (!InputSanitizer.IsPositiveId(idUsuario))
            return "[TUTOR_USUARIO_REQUERIDO] Selecciona un usuario.";

        string? codeError = InputSanitizer.ValidateIdentifier(codEmpleado, "El código de empleado", 30);
        if (codeError != null)
            return codeError;

        bool usuarioExiste = await _context.Usuarios.AnyAsync(u => u.IdUsuario == idUsuario);
        if (!usuarioExiste)
            return "[TUTOR_USUARIO_NO_ENCONTRADO] Usuario no encontrado.";

        if (vigencia == default || vigencia < DateOnly.FromDateTime(DateTime.Today))
            return "[TUTOR_VIGENCIA_INVALIDA] La vigencia no puede ser anterior al día de hoy.";

        return null;
    }
}
