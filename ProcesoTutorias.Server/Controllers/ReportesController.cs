using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProcesoTutorias.Server.Models;
using ProcesoTutorias.Server.DTOs;

namespace ProcesoTutorias.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReportesController : ControllerBase
    {
        private readonly SistemaTutoriasContext _context;

        public ReportesController(SistemaTutoriasContext context)
        {
            _context = context;
        }

        // =========================
        // ALUMNO
        // =========================
        [HttpGet("alumno/{idUsuario}")]
        public async Task<ActionResult<AlumnoReportDto>> ObtenerReporteAlumno(int idUsuario)
        {
            var alumno = await _context.Alumnos
                .Include(a => a.IdUsuarioNavigation)
                .Include(a => a.Justificantes)
                .Include(a => a.Tutoria)
                .FirstOrDefaultAsync(a => a.IdUsuario == idUsuario);

            if (alumno == null)
                return NotFound();

            var dto = new AlumnoReportDto
            {
                Nombre = alumno.IdUsuarioNavigation.Nombre + " " + alumno.IdUsuarioNavigation.Apellidos,
                Matricula = alumno.Matricula,
                TotalTutorias = alumno.Tutoria.Count,
                TotalJustificantes = alumno.Justificantes.Count
            };

            return Ok(dto);
        }

        // =========================
        // ADMIN
        // =========================
        [HttpGet("admin")]
        public async Task<ActionResult<AdminReportDto>> ObtenerReporteAdmin()
        {
            var totalUsuarios = await _context.Usuarios.CountAsync();
            var totalTutorias = await _context.Tutoria.CountAsync();
            var totalJustificantes = await _context.Justificantes.CountAsync();

            var grupos = await _context.Grupos
                .Include(g => g.Alumnos)
                .Select(g => new GrupoResumenDto
                {
                    Grupo = g.NombreGrupo,
                    TotalAlumnos = g.Alumnos.Count
                })
                .ToListAsync();

            var tutores = await _context.Tutors
                .Include(t => t.IdMaestroNavigation)
                    .ThenInclude(m => m.IdUsuarioNavigation)
                .Select(t => new TutorResumenDto
                {
                    NombreTutor =
                        t.IdMaestroNavigation.IdUsuarioNavigation.Nombre + " " +
                        t.IdMaestroNavigation.IdUsuarioNavigation.Apellidos,
                    TotalGrupos = t.Grupos.Count
                })
                .ToListAsync();

            return Ok(new AdminReportDto
            {
                TotalUsuarios = totalUsuarios,
                TotalTutorias = totalTutorias,
                TotalJustificantes = totalJustificantes,
                Grupos = grupos,
                Tutores = tutores
            });
        }

        // =========================
        // TUTOR
        // =========================
        [HttpGet("tutor/{idUsuario}")]
        public async Task<ActionResult<TutorReportDto>> ObtenerReporteTutor(int idUsuario)
        {
            // 1. Buscar maestro por usuario
            var maestro = await _context.Maestros
                .FirstOrDefaultAsync(m => m.IdUsuario == idUsuario);

            if (maestro == null)
                return NotFound("Maestro no encontrado");

            // 2. Buscar tutor por id_maestro
            var tutor = await _context.Tutors
                .Include(t => t.IdMaestroNavigation)
                    .ThenInclude(m => m.IdUsuarioNavigation)
                .FirstOrDefaultAsync(t => t.IdMaestro == maestro.IdMaestro);

            if (tutor == null)
                return NotFound("Tutor no asignado");

            // 3. Alumnos por tutor (usar IdMaestro o relación real)
            var alumnos = await _context.Tutoria
                .Where(t => t.IdTutor == tutor.IdTutor)
                .Include(t => t.IdAlumnoNavigation)
                    .ThenInclude(a => a.IdUsuarioNavigation)
                .GroupBy(t => t.IdAlumnoNavigation)
                .Select(g => new AlumnoResumenDto
                {
                    Matricula = g.Key.Matricula,
                    TotalTutorias = g.Count()
                })
                .ToListAsync();

            // 4. Justificantes (también por tutor indirecto o alumnos)
            var justificantes = await _context.Justificantes
                .Include(j => j.IdAlumnoNavigation)
                .GroupBy(j => j.IdAlumnoNavigation)
                .Select(g => new JustificanteResumenDto
                {
                    Matricula = g.Key.Matricula,
                    Total = g.Count()
                })
                .ToListAsync();

            // 5. Grupo por tutor real
            var grupo = await _context.Grupos
                .Where(g => g.IdTutor == tutor.IdTutor)
                .Select(g => g.NombreGrupo)
                .FirstOrDefaultAsync();

            return Ok(new TutorReportDto
            {
                NombreTutor =
                    tutor.IdMaestroNavigation.IdUsuarioNavigation.Nombre + " " +
                    tutor.IdMaestroNavigation.IdUsuarioNavigation.Apellidos,

                Grupo = grupo,
                Alumnos = alumnos,
                Justificantes = justificantes
            });
        }

        // =========================
        // MAESTRO
        // =========================
        [HttpGet("maestro/{idUsuario}")]
        public async Task<ActionResult<MaestroReportDto>> ObtenerReporteMaestro(int idUsuario)
        {
            // 1. Buscar maestro por usuario
            var maestro = await _context.Maestros
                .Include(m => m.IdUsuarioNavigation)
                .FirstOrDefaultAsync(m => m.IdUsuario == idUsuario);

            if (maestro == null)
                return NotFound("Maestro no encontrado");

            // 2. Saber si es tutor
            var tutor = await _context.Tutors
                .FirstOrDefaultAsync(t => t.IdMaestro == maestro.IdMaestro);

            bool esTutor = tutor != null;

            // 3. Si es tutor, puedes sacar info más real
            var totalTutorias = esTutor
                ? await _context.Tutoria.CountAsync(t => t.IdTutor == tutor.IdTutor)
                : 0;

            var totalGrupos = esTutor
                ? await _context.Grupos.CountAsync(g => g.IdTutor == tutor.IdTutor)
                : 0;

            return Ok(new MaestroReportDto
            {
                Nombre = maestro.IdUsuarioNavigation.Nombre + " " +
                         maestro.IdUsuarioNavigation.Apellidos,

                Mensaje = esTutor
                    ? "El usuario está asignado como tutor"
                    : "No asignado como tutor en el periodo actual",

                TotalTutorias = totalTutorias,
                TotalGrupos = totalGrupos
            });
        }
    }
}