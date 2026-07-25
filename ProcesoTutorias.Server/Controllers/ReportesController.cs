using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProcesoTutorias.Server.DTOs;
using ProcesoTutorias.Server.Models;

namespace ProcesoTutorias.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReportesController : ControllerBase
    {
        private const string Pendiente = "PENDIENTE";
        private const string Completada = "COMPLETADA";
        private const string Edicion = "EDICION";
        private const string Aprobado = "APROBADO";
        private const string Rechazado = "RECHAZADO";

        private readonly SistemaTutoriasContext _context;

        public ReportesController(SistemaTutoriasContext context)
        {
            _context = context;
        }

        [HttpGet("alumno/{idUsuario:int}")]
        public async Task<ActionResult<AlumnoReportDto>> ObtenerReporteAlumno(int idUsuario)
        {
            var alumno = await _context.Alumnos
                .AsNoTracking()
                .Include(a => a.IdUsuarioNavigation)
                .FirstOrDefaultAsync(a => a.IdUsuario == idUsuario);

            if (alumno == null)
                return NotFound();

            var sesiones = await _context.SesionTutoria
                .AsNoTracking()
                .Where(s => s.IdTutoriaNavigation.IdAlumno == alumno.IdAlumno && s.Estado != "INACTIVO")
                .OrderByDescending(s => s.Fecha)
                .ToListAsync();

            var justificantes = await _context.Justificantes
                .AsNoTracking()
                .Where(j => j.IdAlumno == alumno.IdAlumno)
                .ToListAsync();

            var recomendaciones = new List<string>();

            if (sesiones.Count(s => s.Estado == Pendiente) > 0)
                recomendaciones.Add("Revisar tutorías pendientes para evitar rezagos de seguimiento.");

            if (justificantes.Count(j => j.Estado == Pendiente) > 0)
                recomendaciones.Add("Dar seguimiento a justificantes pendientes de revisión.");

            if (!sesiones.Any())
                recomendaciones.Add("Solicitar o programar una tutoría inicial para contar con seguimiento académico.");

            return Ok(new AlumnoReportDto
            {
                Nombre = alumno.IdUsuarioNavigation.Nombre + " " + alumno.IdUsuarioNavigation.Apellidos,
                Matricula = alumno.Matricula,
                TotalTutorias = sesiones.Count,
                TutoriasPendientes = sesiones.Count(s => s.Estado == Pendiente),
                TutoriasCompletadas = sesiones.Count(s => s.Estado == Completada),
                TutoriasEnEdicion = sesiones.Count(s => s.Estado == Edicion),
                TotalJustificantes = justificantes.Count,
                JustificantesPendientes = justificantes.Count(j => j.Estado == Pendiente),
                JustificantesAprobados = justificantes.Count(j => j.Estado == Aprobado),
                JustificantesRechazados = justificantes.Count(j => j.Estado == Rechazado),
                UltimaTutoria = sesiones.FirstOrDefault()?.Fecha.ToString("yyyy-MM-dd"),
                Recomendaciones = recomendaciones
            });
        }

        [HttpGet("admin")]
        public async Task<ActionResult<AdminReportDto>> ObtenerReporteAdmin()
        {
            var sesiones = await _context.SesionTutoria
                .AsNoTracking()
                .Where(s => s.Estado != "INACTIVO")
                .ToListAsync();

            var justificantes = await _context.Justificantes
                .AsNoTracking()
                .ToListAsync();

            var grupos = await _context.Grupos
                .AsNoTracking()
                .OrderBy(g => g.NombreGrupo)
                .Select(g => new GrupoResumenDto
                {
                    Grupo = g.NombreGrupo,
                    TotalAlumnos = g.Alumnos.Count,
                    TotalTutorias = _context.Tutoria.Count(t => t.IdAlumnoNavigation.IdGrupo == g.IdGrupo),
                    TutoriasPendientes = _context.SesionTutoria.Count(s => s.Estado == Pendiente && s.IdTutoriaNavigation.IdAlumnoNavigation.IdGrupo == g.IdGrupo),
                    TotalJustificantes = _context.Justificantes.Count(j => j.IdAlumnoNavigation.IdGrupo == g.IdGrupo)
                })
                .ToListAsync();

            var tutores = await _context.Tutors
                .AsNoTracking()
                .OrderBy(t => t.IdMaestroNavigation.IdUsuarioNavigation.Nombre)
                .Select(t => new TutorResumenDto
                {
                    NombreTutor = t.IdMaestroNavigation.IdUsuarioNavigation.Nombre + " " + t.IdMaestroNavigation.IdUsuarioNavigation.Apellidos,
                    TotalGrupos = t.Grupos.Count,
                    TotalAlumnos = _context.Alumnos.Count(a => a.IdGrupoNavigation.IdTutor == t.IdTutor),
                    TotalTutorias = _context.Tutoria.Count(tu => tu.IdTutor == t.IdTutor),
                    TutoriasPendientes = _context.SesionTutoria.Count(s => s.Estado == Pendiente && s.IdTutoriaNavigation.IdTutor == t.IdTutor)
                })
                .ToListAsync();

            var recomendaciones = new List<string>();

            if (sesiones.Count(s => s.Estado == Pendiente) > 0)
                recomendaciones.Add("Priorizar tutorías pendientes para mejorar el cierre de seguimiento académico.");

            if (grupos.Any(g => g.TotalAlumnos > 0 && g.TotalTutorias == 0))
                recomendaciones.Add("Detectar grupos sin tutorías registradas y programar seguimiento inicial.");

            if (justificantes.Count(j => j.Estado == Pendiente) > 0)
                recomendaciones.Add("Revisar justificantes pendientes para evitar acumulación administrativa.");

            return Ok(new AdminReportDto
            {
                TotalUsuarios = await _context.Usuarios.CountAsync(),
                TotalAlumnos = await _context.Alumnos.CountAsync(),
                TotalTutores = await _context.Tutors.CountAsync(),
                TotalGrupos = await _context.Grupos.CountAsync(),
                TotalTutorias = sesiones.Count,
                TutoriasPendientes = sesiones.Count(s => s.Estado == Pendiente),
                TutoriasCompletadas = sesiones.Count(s => s.Estado == Completada),
                TutoriasEnEdicion = sesiones.Count(s => s.Estado == Edicion),
                TotalJustificantes = justificantes.Count,
                JustificantesPendientes = justificantes.Count(j => j.Estado == Pendiente),
                JustificantesAprobados = justificantes.Count(j => j.Estado == Aprobado),
                JustificantesRechazados = justificantes.Count(j => j.Estado == Rechazado),
                Grupos = grupos.OrderByDescending(g => g.TutoriasPendientes).ThenByDescending(g => g.TotalJustificantes).Take(8).ToList(),
                Tutores = tutores.OrderByDescending(t => t.TutoriasPendientes).ThenByDescending(t => t.TotalAlumnos).Take(8).ToList(),
                Recomendaciones = recomendaciones
            });
        }

        [HttpGet("tutor/{idUsuario:int}")]
        public async Task<ActionResult<TutorReportDto>> ObtenerReporteTutor(int idUsuario)
        {
            var maestro = await _context.Maestros
                .AsNoTracking()
                .FirstOrDefaultAsync(m => m.IdUsuario == idUsuario);

            if (maestro == null)
                return NotFound("Maestro no encontrado");

            var tutor = await _context.Tutors
                .AsNoTracking()
                .Include(t => t.IdMaestroNavigation)
                    .ThenInclude(m => m.IdUsuarioNavigation)
                .FirstOrDefaultAsync(t => t.IdMaestro == maestro.IdMaestro);

            if (tutor == null)
                return NotFound("Tutor no asignado");

            var alumnoIds = await _context.Alumnos
                .AsNoTracking()
                .Where(a => a.IdGrupoNavigation.IdTutor == tutor.IdTutor)
                .Select(a => a.IdAlumno)
                .ToListAsync();

            var sesiones = await _context.SesionTutoria
                .AsNoTracking()
                .Where(s => s.IdTutoriaNavigation.IdTutor == tutor.IdTutor && s.Estado != "INACTIVO")
                .ToListAsync();

            var justificantes = await _context.Justificantes
                .AsNoTracking()
                .Where(j => alumnoIds.Contains(j.IdAlumno))
                .ToListAsync();

            var alumnos = await _context.Alumnos
                .AsNoTracking()
                .Where(a => alumnoIds.Contains(a.IdAlumno))
                .OrderBy(a => a.IdUsuarioNavigation.Nombre)
                .Select(a => new AlumnoResumenDto
                {
                    Matricula = a.Matricula,
                    Nombre = a.IdUsuarioNavigation.Nombre + " " + a.IdUsuarioNavigation.Apellidos,
                    TotalTutorias = _context.Tutoria.Count(t => t.IdAlumno == a.IdAlumno && t.IdTutor == tutor.IdTutor),
                    TutoriasPendientes = _context.SesionTutoria.Count(s => s.Estado == Pendiente && s.IdTutoriaNavigation.IdAlumno == a.IdAlumno && s.IdTutoriaNavigation.IdTutor == tutor.IdTutor),
                    TutoriasCompletadas = _context.SesionTutoria.Count(s => s.Estado == Completada && s.IdTutoriaNavigation.IdAlumno == a.IdAlumno && s.IdTutoriaNavigation.IdTutor == tutor.IdTutor),
                    TotalJustificantes = _context.Justificantes.Count(j => j.IdAlumno == a.IdAlumno)
                })
                .ToListAsync();

            var justificantesPorAlumno = await _context.Alumnos
                .AsNoTracking()
                .Where(a => alumnoIds.Contains(a.IdAlumno))
                .Select(a => new JustificanteResumenDto
                {
                    Matricula = a.Matricula,
                    Nombre = a.IdUsuarioNavigation.Nombre + " " + a.IdUsuarioNavigation.Apellidos,
                    Total = _context.Justificantes.Count(j => j.IdAlumno == a.IdAlumno),
                    Pendientes = _context.Justificantes.Count(j => j.IdAlumno == a.IdAlumno && j.Estado == Pendiente),
                    Aprobados = _context.Justificantes.Count(j => j.IdAlumno == a.IdAlumno && j.Estado == Aprobado),
                    Rechazados = _context.Justificantes.Count(j => j.IdAlumno == a.IdAlumno && j.Estado == Rechazado)
                })
                .ToListAsync();

            var grupo = await _context.Grupos
                .AsNoTracking()
                .Where(g => g.IdTutor == tutor.IdTutor)
                .Select(g => g.NombreGrupo)
                .FirstOrDefaultAsync();

            var recomendaciones = new List<string>();

            if (alumnos.Any(a => a.TutoriasPendientes > 0))
                recomendaciones.Add("Atender alumnos con tutorías pendientes para cerrar acuerdos oportunamente.");

            if (alumnos.Any(a => a.TotalTutorias == 0))
                recomendaciones.Add("Programar tutorías iniciales para alumnos sin seguimiento registrado.");

            if (justificantes.Any(j => j.Estado == Pendiente))
                recomendaciones.Add("Revisar justificantes pendientes del grupo para identificar posibles ausencias recurrentes.");

            return Ok(new TutorReportDto
            {
                NombreTutor = tutor.IdMaestroNavigation.IdUsuarioNavigation.Nombre + " " + tutor.IdMaestroNavigation.IdUsuarioNavigation.Apellidos,
                Grupo = grupo,
                TotalAlumnos = alumnoIds.Count,
                TotalTutorias = sesiones.Count,
                TutoriasPendientes = sesiones.Count(s => s.Estado == Pendiente),
                TutoriasCompletadas = sesiones.Count(s => s.Estado == Completada),
                TutoriasEnEdicion = sesiones.Count(s => s.Estado == Edicion),
                TotalJustificantes = justificantes.Count,
                JustificantesPendientes = justificantes.Count(j => j.Estado == Pendiente),
                Alumnos = alumnos.OrderByDescending(a => a.TutoriasPendientes).ThenBy(a => a.TotalTutorias).Take(8).ToList(),
                Justificantes = justificantesPorAlumno.OrderByDescending(j => j.Pendientes).ThenByDescending(j => j.Total).Take(8).ToList(),
                Recomendaciones = recomendaciones
            });
        }

        [HttpGet("maestro/{idUsuario:int}")]
        public async Task<ActionResult<MaestroReportDto>> ObtenerReporteMaestro(int idUsuario)
        {
            var maestro = await _context.Maestros
                .AsNoTracking()
                .Include(m => m.IdUsuarioNavigation)
                .FirstOrDefaultAsync(m => m.IdUsuario == idUsuario);

            if (maestro == null)
                return NotFound("Maestro no encontrado");

            var tutor = await _context.Tutors
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.IdMaestro == maestro.IdMaestro);

            bool esTutor = tutor != null;
            var recomendaciones = new List<string>();

            if (!esTutor)
                recomendaciones.Add("Solicitar asignación como tutor si requiere dar seguimiento académico a un grupo.");

            int totalTutorias = esTutor
                ? await _context.SesionTutoria.CountAsync(s => s.IdTutoriaNavigation.IdTutor == tutor!.IdTutor && s.Estado != "INACTIVO")
                : 0;

            int pendientes = esTutor
                ? await _context.SesionTutoria.CountAsync(s => s.IdTutoriaNavigation.IdTutor == tutor!.IdTutor && s.Estado == Pendiente)
                : 0;

            int completadas = esTutor
                ? await _context.SesionTutoria.CountAsync(s => s.IdTutoriaNavigation.IdTutor == tutor!.IdTutor && s.Estado == Completada)
                : 0;

            int totalGrupos = esTutor
                ? await _context.Grupos.CountAsync(g => g.IdTutor == tutor!.IdTutor)
                : 0;

            int totalAlumnos = esTutor
                ? await _context.Alumnos.CountAsync(a => a.IdGrupoNavigation.IdTutor == tutor!.IdTutor)
                : 0;

            if (pendientes > 0)
                recomendaciones.Add("Cerrar tutorías pendientes para mejorar la trazabilidad del grupo.");

            return Ok(new MaestroReportDto
            {
                Nombre = maestro.IdUsuarioNavigation.Nombre + " " + maestro.IdUsuarioNavigation.Apellidos,
                Mensaje = esTutor
                    ? "El usuario está asignado como tutor"
                    : "No asignado como tutor en el periodo actual",
                EsTutor = esTutor,
                TotalAlumnos = totalAlumnos,
                TotalTutorias = totalTutorias,
                TutoriasPendientes = pendientes,
                TutoriasCompletadas = completadas,
                TotalGrupos = totalGrupos,
                Recomendaciones = recomendaciones
            });
        }
    }
}
