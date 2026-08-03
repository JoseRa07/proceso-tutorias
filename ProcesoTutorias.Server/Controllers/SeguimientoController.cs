using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProcesoTutorias.Server.DTOs;
using ProcesoTutorias.Server.Models;
using ProcesoTutorias.Server.Validation;

namespace ProcesoTutorias.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "TUTOR,ALUMNO")]
public class SeguimientoController : ControllerBase
{
    private static readonly HashSet<string> EstadosPermitidos =
        new(StringComparer.OrdinalIgnoreCase) { "ACTIVO", "FINALIZADO", "CANCELADO" };

    private readonly SistemaTutoriasContext _context;

    public SeguimientoController(SistemaTutoriasContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<SeguimientoAlumnoResumenDto>>> ObtenerAlumnos(string? estado = null)
    {
        IQueryable<Seguimiento> query = _context.Seguimientos.AsNoTracking();

        if (User.IsInRole("ALUMNO"))
        {
            var alumno = await ObtenerAlumnoActual();
            if (alumno == null)
                return Forbid();

            query = query.Where(seguimiento => seguimiento.IdAlumno == alumno.IdAlumno);
        }
        else
        {
            var tutor = await ObtenerTutorActual();
            if (tutor == null)
                return Forbid();

            query = query.Where(seguimiento => seguimiento.IdTutor == tutor.IdTutor);
        }

        if (!string.IsNullOrWhiteSpace(estado))
        {
            var estadoNormalizado = estado.Trim().ToUpperInvariant();
            if (!EstadosPermitidos.Contains(estadoNormalizado))
                return BadRequest(new { message = "El estado indicado no es válido." });

            query = query.Where(seguimiento => seguimiento.Estado == estadoNormalizado);
        }

        var alumnos = await query
            .GroupBy(seguimiento => new
            {
                seguimiento.IdAlumno,
                seguimiento.IdAlumnoNavigation.Matricula,
                seguimiento.IdAlumnoNavigation.IdUsuarioNavigation.Nombre,
                seguimiento.IdAlumnoNavigation.IdUsuarioNavigation.Apellidos,
                seguimiento.IdAlumnoNavigation.IdGrupoNavigation.NombreGrupo
            })
            .Select(grupo => new SeguimientoAlumnoResumenDto
            {
                IdAlumno = grupo.Key.IdAlumno,
                NombreAlumno = grupo.Key.Nombre + " " + grupo.Key.Apellidos,
                Matricula = grupo.Key.Matricula,
                Grupo = grupo.Key.NombreGrupo,
                TotalSeguimientos = grupo.Count(),
                SeguimientosActivos = grupo.Count(seguimiento => seguimiento.Estado == "ACTIVO"),
                UltimaActividad = grupo.Max(seguimiento => seguimiento.FechaActualizacion)
            })
            .OrderByDescending(alumno => alumno.UltimaActividad)
            .ThenBy(alumno => alumno.NombreAlumno)
            .ToListAsync();

        return Ok(alumnos);
    }

    [HttpGet("alumno/{idAlumno:int}")]
    public async Task<ActionResult<IEnumerable<SeguimientoResumenDto>>> ObtenerPorAlumno(
        int idAlumno,
        bool soloActivos = false)
    {
        if (!InputSanitizer.IsPositiveId(idAlumno))
            return BadRequest(new { message = "[ALUMNO_INVALIDO] El alumno debe ser un entero mayor que cero." });

        IQueryable<Seguimiento> query = _context.Seguimientos.AsNoTracking();

        if (User.IsInRole("ALUMNO"))
        {
            var alumno = await ObtenerAlumnoActual();
            if (alumno == null)
                return Forbid();
            if (alumno.IdAlumno != idAlumno)
                return NotFound();

            query = query.Where(seguimiento => seguimiento.IdAlumno == alumno.IdAlumno);
        }
        else
        {
            var tutor = await ObtenerTutorActual();
            if (tutor == null)
                return Forbid();

            query = query.Where(seguimiento =>
                seguimiento.IdTutor == tutor.IdTutor &&
                seguimiento.IdAlumno == idAlumno);
        }

        if (soloActivos)
            query = query.Where(seguimiento => seguimiento.Estado == "ACTIVO");

        var seguimientos = await query
            .Select(seguimiento => new SeguimientoResumenDto
            {
                IdSeguimiento = seguimiento.IdSeguimiento,
                IdAlumno = seguimiento.IdAlumno,
                Titulo = seguimiento.Titulo,
                Descripcion = seguimiento.Descripcion,
                Estado = seguimiento.Estado,
                FechaCreacion = seguimiento.FechaCreacion,
                FechaActualizacion = seguimiento.FechaActualizacion,
                TotalTutorias = seguimiento.SesionTutoria.Count(sesion => sesion.Estado != "INACTIVO"),
                UltimaTutoria = seguimiento.SesionTutoria
                    .Where(sesion => sesion.Estado != "INACTIVO")
                    .Select(sesion => (DateOnly?)sesion.Fecha)
                    .Max()
            })
            .OrderByDescending(seguimiento => seguimiento.Estado == "ACTIVO")
            .ThenByDescending(seguimiento => seguimiento.FechaActualizacion)
            .ToListAsync();

        return Ok(seguimientos);
    }

    [HttpGet("{idSeguimiento:int}/sesiones")]
    public async Task<ActionResult<IEnumerable<SesionSeguimientoDto>>> ObtenerSesiones(int idSeguimiento)
    {
        if (!InputSanitizer.IsPositiveId(idSeguimiento))
            return BadRequest(new { message = "[SEGUIMIENTO_INVALIDO] El seguimiento debe ser un entero mayor que cero." });

        bool puedeConsultar;
        if (User.IsInRole("ALUMNO"))
        {
            var alumno = await ObtenerAlumnoActual();
            if (alumno == null)
                return Forbid();

            puedeConsultar = await _context.Seguimientos
                .AsNoTracking()
                .AnyAsync(seguimiento =>
                    seguimiento.IdSeguimiento == idSeguimiento &&
                    seguimiento.IdAlumno == alumno.IdAlumno);
        }
        else
        {
            var tutor = await ObtenerTutorActual();
            if (tutor == null)
                return Forbid();

            puedeConsultar = await _context.Seguimientos
                .AsNoTracking()
                .AnyAsync(seguimiento =>
                    seguimiento.IdSeguimiento == idSeguimiento &&
                    seguimiento.IdTutor == tutor.IdTutor);
        }

        if (!puedeConsultar)
            return NotFound();

        var sesiones = await _context.SesionTutoria
            .AsNoTracking()
            .Where(sesion =>
                sesion.IdSeguimiento == idSeguimiento &&
                sesion.Estado != "INACTIVO")
            .OrderBy(sesion => sesion.Fecha)
            .ThenBy(sesion => sesion.HoraIni)
            .Select(sesion => new SesionSeguimientoDto
            {
                IdSesion = sesion.IdSesion,
                Fecha = sesion.Fecha,
                Motivo = sesion.Motivo,
                Estado = sesion.Estado
            })
            .ToListAsync();

        return Ok(sesiones);
    }

    [HttpPut("{idSeguimiento:int}/estado")]
    [Authorize(Roles = "TUTOR")]
    public async Task<IActionResult> CambiarEstado(
        int idSeguimiento,
        [FromBody] SeguimientoEstadoRequest? request)
    {
        if (!InputSanitizer.IsPositiveId(idSeguimiento))
            return BadRequest(new { message = "[SEGUIMIENTO_INVALIDO] El seguimiento debe ser un entero mayor que cero." });

        if (request == null || string.IsNullOrWhiteSpace(request.Estado))
            return BadRequest(new { message = "El estado es obligatorio." });

        var estado = request.Estado.Trim().ToUpperInvariant();
        if (!EstadosPermitidos.Contains(estado))
            return BadRequest(new { message = "El estado indicado no es válido." });

        var tutor = await ObtenerTutorActual();
        if (tutor == null)
            return Forbid();

        var seguimiento = await _context.Seguimientos.FirstOrDefaultAsync(item =>
            item.IdSeguimiento == idSeguimiento &&
            item.IdTutor == tutor.IdTutor);

        if (seguimiento == null)
            return NotFound();

        seguimiento.Estado = estado;
        seguimiento.FechaActualizacion = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Estado actualizado.", estado });
    }

    [HttpPut("vincular-sesion/{idSesion:int}")]
    [Authorize(Roles = "TUTOR")]
    public async Task<IActionResult> VincularSesion(
        int idSesion,
        [FromBody] VincularSeguimientoRequest? request)
    {
        if (!InputSanitizer.IsPositiveId(idSesion))
            return BadRequest(new { message = "[TUTORIA_ID_INVALIDO] La tutoría debe ser un entero mayor que cero." });

        if (request == null)
            return BadRequest(new { message = "La solicitud está vacía." });

        var tutor = await ObtenerTutorActual();
        if (tutor == null)
            return Forbid();

        var sesion = await _context.SesionTutoria
            .Include(item => item.IdTutoriaNavigation)
            .FirstOrDefaultAsync(item =>
                item.IdSesion == idSesion &&
                item.Estado != "INACTIVO");

        if (sesion == null || sesion.IdTutoriaNavigation.IdTutor != tutor.IdTutor)
            return NotFound();

        var seguimientoAnterior = sesion.IdSeguimiento.HasValue
            ? await _context.Seguimientos.FindAsync(sesion.IdSeguimiento.Value)
            : null;

        if (request.Quitar)
        {
            sesion.IdSeguimiento = null;
            if (seguimientoAnterior != null)
                seguimientoAnterior.FechaActualizacion = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return Ok(new { message = "La tutoría ya no pertenece a un seguimiento." });
        }

        var alumnoPerteneceAlTutor = await _context.Alumnos
            .AsNoTracking()
            .AnyAsync(alumno =>
                alumno.IdAlumno == sesion.IdTutoriaNavigation.IdAlumno &&
                alumno.IdGrupoNavigation.IdTutor == tutor.IdTutor);

        if (!alumnoPerteneceAlTutor)
            return BadRequest(new { message = "El alumno ya no pertenece a un grupo asignado a este tutor." });

        Seguimiento seguimiento;

        if (request.IdSeguimiento.HasValue)
        {
            if (!InputSanitizer.IsPositiveId(request.IdSeguimiento.Value))
                return BadRequest(new { message = "[SEGUIMIENTO_INVALIDO] El seguimiento debe ser un entero mayor que cero." });

            var seguimientoExistente = await _context.Seguimientos.FirstOrDefaultAsync(item =>
                item.IdSeguimiento == request.IdSeguimiento.Value &&
                item.IdTutor == tutor.IdTutor &&
                item.IdAlumno == sesion.IdTutoriaNavigation.IdAlumno &&
                (item.Estado == "ACTIVO" || item.IdSeguimiento == sesion.IdSeguimiento));

            if (seguimientoExistente == null)
                return BadRequest(new { message = "El seguimiento no existe, no está activo o pertenece a otro alumno." });

            seguimiento = seguimientoExistente;
        }
        else
        {
            string? titleError = InputSanitizer.ValidateFreeText(request.Titulo, "El título", 150);
            if (titleError != null)
                return BadRequest(new { message = titleError });

            string? descriptionError = InputSanitizer.ValidateFreeText(
                request.Descripcion,
                "La descripción",
                500,
                required: false);
            if (descriptionError != null)
                return BadRequest(new { message = descriptionError });

            string titulo = InputSanitizer.NormalizeSingleLine(request.Titulo);

            seguimiento = new Seguimiento
            {
                IdAlumno = sesion.IdTutoriaNavigation.IdAlumno,
                IdTutor = tutor.IdTutor,
                Titulo = titulo,
                Descripcion = string.IsNullOrWhiteSpace(request.Descripcion)
                    ? null
                    : InputSanitizer.NormalizeMultiline(request.Descripcion),
                Estado = "ACTIVO",
                FechaCreacion = DateTime.UtcNow,
                FechaActualizacion = DateTime.UtcNow
            };

            _context.Seguimientos.Add(seguimiento);
        }

        sesion.IdSeguimientoNavigation = seguimiento;
        seguimiento.FechaActualizacion = DateTime.UtcNow;

        if (seguimientoAnterior != null && seguimientoAnterior.IdSeguimiento != seguimiento.IdSeguimiento)
            seguimientoAnterior.FechaActualizacion = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Tutoría vinculada al seguimiento.",
            idSeguimiento = seguimiento.IdSeguimiento,
            titulo = seguimiento.Titulo
        });
    }

    private async Task<Tutor?> ObtenerTutorActual()
    {
        var idUsuarioClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(idUsuarioClaim, out var idUsuario))
            return null;

        return await _context.Tutors
            .AsNoTracking()
            .FirstOrDefaultAsync(tutor => tutor.IdMaestroNavigation.IdUsuario == idUsuario);
    }

    private async Task<Alumno?> ObtenerAlumnoActual()
    {
        var idUsuarioClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(idUsuarioClaim, out var idUsuario))
            return null;

        return await _context.Alumnos
            .AsNoTracking()
            .FirstOrDefaultAsync(alumno => alumno.IdUsuario == idUsuario);
    }
}
