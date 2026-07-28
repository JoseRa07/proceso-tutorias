using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ProcesoTutorias.Server.Models;
using ProcesoTutorias.Server.DTOs;
using System.Security.Claims;
using ProcesoTutorias.Server.Validation;
using ProcesoTutorias.Server.Services;

namespace ProcesoTutorias.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "ALUMNO,TUTOR")]
    public class TutoriaController : ControllerBase
    {
        private static readonly HashSet<string> MotivosPermitidos =
            new(StringComparer.Ordinal)
            {
                "REPROBACION",
                "AUSENTISMO",
                "PROBLEMAS_ECONOMICOS",
                "INDISCIPLINA",
                "PROBLEMAS_PERSONALES",
                "IMPUNTUALIDAD",
                "FALTA_COMPROMISO",
                "FALTA_ATENCION"
            };

        private readonly SistemaTutoriasContext _context;
        private readonly AuditLogService _auditLogService;

        public TutoriaController(
            SistemaTutoriasContext context,
            AuditLogService auditLogService)
        {
            _context = context;
            _auditLogService = auditLogService;
        }

        [HttpGet]
        public IActionResult ObtenerTutorias(
            int idUsuario,
            int idRol,
            string? estado = null,
            int? idAlumno = null,
            int pagina = 1,
            int tam = 5)
        {
            if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out idUsuario))
                return Unauthorized();
            if (pagina < 1 || tam is < 1 or > 100)
                return BadRequest(new { message = "[PAGINACION_INVALIDA] La página y el tamaño deben ser enteros positivos; el tamaño máximo es 100." });
            if (idAlumno.HasValue && !InputSanitizer.IsPositiveId(idAlumno.Value))
                return BadRequest(new { message = "[ALUMNO_INVALIDO] El alumno debe ser un entero mayor que cero." });

            idRol = User.IsInRole("ALUMNO") ? 2 : 3;
            IQueryable<SesionTutoriaDto> query;

            if (idRol == 2)
            {
                query = from a in _context.Alumnos
                        join u in _context.Usuarios on a.IdUsuario equals u.IdUsuario
                        join t in _context.Tutoria on a.IdAlumno equals t.IdAlumno
                        join s in _context.SesionTutoria on t.IdTutoria equals s.IdTutoria
                        where a.IdUsuario == idUsuario
                        && s.Estado != "INACTIVO"
                        select new SesionTutoriaDto
                        {
                            IdSesion = s.IdSesion,
                            Fecha = s.Fecha,
                            HoraIni = s.HoraIni.ToString("HH:mm"),
                            HoraFin = s.HoraFin.ToString("HH:mm"),
                            Motivo = s.Motivo,
                            Estado = s.Estado,
                            IdAlumno = a.IdAlumno,
                            NombreAlumno = u.Nombre + " " + u.Apellidos
                        };
            }
            else
            {
                query = from m in _context.Maestros
                        join tu in _context.Tutors on m.IdMaestro equals tu.IdMaestro
                        join g in _context.Grupos on tu.IdTutor equals g.IdTutor
                        join a in _context.Alumnos on g.IdGrupo equals a.IdGrupo
                        join u in _context.Usuarios on a.IdUsuario equals u.IdUsuario
                        join t in _context.Tutoria on a.IdAlumno equals t.IdAlumno
                        join s in _context.SesionTutoria on t.IdTutoria equals s.IdTutoria
                        where m.IdUsuario == idUsuario
                        && s.Estado != "INACTIVO"
                        select new SesionTutoriaDto
                        {
                            IdSesion = s.IdSesion,
                            Fecha = s.Fecha,
                            HoraIni = s.HoraIni.ToString("HH:mm"),
                            HoraFin = s.HoraFin.ToString("HH:mm"),
                            Motivo = s.Motivo,
                            Estado = s.Estado,
                            IdAlumno = a.IdAlumno,
                            NombreAlumno = u.Nombre + " " + u.Apellidos
                        };
            }

            if (idAlumno.HasValue)
                query = query.Where(x => x.IdAlumno == idAlumno.Value);

            if (!string.IsNullOrEmpty(estado))
                query = query.Where(x => x.Estado == estado);

            query = query.OrderByDescending(x => x.Fecha);

            var total = query.Count();

            var data = query
                .Skip((pagina - 1) * tam)
                .Take(tam)
                .ToList();

            return Ok(new { total, data });
        }

        [HttpGet("detalle")]
        public IActionResult ObtenerDetalle(int idSesion)
        {
            if (!InputSanitizer.IsPositiveId(idSesion))
                return BadRequest(new { message = "[TUTORIA_ID_INVALIDO] El identificador debe ser un entero mayor que cero." });

            var data = (from s in _context.SesionTutoria
                        join t in _context.Tutoria on s.IdTutoria equals t.IdTutoria
                        join a in _context.Alumnos on t.IdAlumno equals a.IdAlumno
                        join u in _context.Usuarios on a.IdUsuario equals u.IdUsuario
                        where s.IdSesion == idSesion
                        && s.Estado != "INACTIVO"
                        select new
                        {
                            idSesion = s.IdSesion,
                            fecha = s.Fecha,
                            horaIni = s.HoraIni,
                            horaFin = s.HoraFin,
                            motivo = s.Motivo,
                            ptsRelevantes = s.PtsRelevantes,
                            compromisos = s.CompromisosAcuerdos,
                            estado = s.Estado,
                            idSeguimiento = s.IdSeguimiento,
                            tituloSeguimiento = s.IdSeguimientoNavigation != null
                                ? s.IdSeguimientoNavigation.Titulo
                                : null,
                            idAlumno = a.IdAlumno,
                            nombreAlumno = u.Nombre + " " + u.Apellidos,
                            idUsuarioAlumno = u.IdUsuario
                        }).FirstOrDefault();

            if (data == null) return NotFound();

            return Ok(data);
        }

        [HttpGet("alumnos")]
        [Authorize(Roles = "TUTOR")]
        public IActionResult ObtenerTutorados(int idUsuario)
        {
            if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out idUsuario))
                return Unauthorized();

            var alumnos = from m in _context.Maestros
                          join t in _context.Tutors on m.IdMaestro equals t.IdMaestro
                          join g in _context.Grupos on t.IdTutor equals g.IdTutor
                          join a in _context.Alumnos on g.IdGrupo equals a.IdGrupo
                          join u in _context.Usuarios on a.IdUsuario equals u.IdUsuario
                          where m.IdUsuario == idUsuario
                          select new
                          {
                              id_alumno = a.IdAlumno,
                              nombre = u.Nombre + " " + u.Apellidos
                          };

            return Ok(alumnos.ToList());
        }

        [HttpPost]
        [Authorize(Roles = "TUTOR")]
        public IActionResult CrearTutoria(int idUsuario, [FromBody] SesionTutoriaDto? dto)
        {
            try
            {
                if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out idUsuario))
                    return Unauthorized();

                if (dto == null)
                    return BadRequest("DTO vacío");
                string? validationError = ValidarSesion(dto);
                if (validationError != null)
                    return BadRequest(new { message = validationError });

                Tutor? tutor = _context.Tutors
                    .First(t => t.IdMaestroNavigation.IdUsuario == idUsuario);

                var tutoria = new Tutorium
                {
                    IdAlumno = dto.IdAlumno,
                    IdTutor = tutor.IdTutor
                };

                _context.Tutoria.Add(tutoria);
                _context.SaveChanges();

                var sesion = new SesionTutorium
                {
                    IdTutoria = tutoria.IdTutoria,
                    Fecha = dto.Fecha,
                    HoraIni = TimeOnly.ParseExact(dto.HoraIni, "HH:mm"),
                    HoraFin = TimeOnly.ParseExact(dto.HoraFin, "HH:mm"),
                    Motivo = InputSanitizer.NormalizeSingleLine(dto.Motivo),
                    PtsRelevantes = InputSanitizer.NormalizeMultiline(dto.Pts),
                    CompromisosAcuerdos = InputSanitizer.NormalizeMultiline(dto.Acuerdos),
                    Estado = "PENDIENTE"
                };

                _context.SesionTutoria.Add(sesion);
                _context.SaveChanges();

                return Ok(new
                {
                    message = "Tutoría creada correctamente",
                    idSesion = sesion.IdSesion
                });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("{idSesion}")]
        [Authorize(Roles = "TUTOR")]
        public IActionResult EditarTutoria(int idSesion, [FromBody] SesionTutoriaDto? dto)
        {
            if (!InputSanitizer.IsPositiveId(idSesion))
                return BadRequest(new { message = "[TUTORIA_ID_INVALIDO] El identificador debe ser un entero mayor que cero." });
            if (dto == null)
                return BadRequest("DTO vacío");
            string? validationError = ValidarSesion(dto);
            if (validationError != null)
                return BadRequest(new { message = validationError });

            var sesion = _context.SesionTutoria.FirstOrDefault(x => x.IdSesion == idSesion);

            if (sesion == null)
                return NotFound();

            sesion.Fecha = dto.Fecha;
            sesion.HoraIni = TimeOnly.ParseExact(dto.HoraIni, "HH:mm");
            sesion.HoraFin = TimeOnly.ParseExact(dto.HoraFin, "HH:mm");
            sesion.Motivo = InputSanitizer.NormalizeSingleLine(dto.Motivo);
            sesion.PtsRelevantes = InputSanitizer.NormalizeMultiline(dto.Pts);
            sesion.CompromisosAcuerdos = InputSanitizer.NormalizeMultiline(dto.Acuerdos);

            sesion.Estado = "PENDIENTE";

            _context.SaveChanges();

            return Ok(new { message = "Tutoría actualizada" });
        }

        [HttpPut("eliminar/{idSesion}")]
        [Authorize(Roles = "TUTOR")]
        public IActionResult EliminarTutoria(int idSesion)
        {
            if (!InputSanitizer.IsPositiveId(idSesion))
                return BadRequest(new { message = "[TUTORIA_ID_INVALIDO] El identificador debe ser un entero mayor que cero." });

            var sesion = _context.SesionTutoria.FirstOrDefault(x => x.IdSesion == idSesion);
            if (sesion == null)
                return NotFound();

            string previousState = sesion.Estado;
            sesion.Estado = "INACTIVO";
            _auditLogService.Record(
                "TUTORIA_ELIMINADA",
                "SesionTutoria",
                idSesion,
                $"Estado cambiado de {previousState} a INACTIVO.");

            _context.SaveChanges();

            return Ok(new { message = "Tutoría eliminada" });
        }

        [HttpPut("aceptar/{idSesion}")]
        [Authorize(Roles = "ALUMNO")]
        public IActionResult AceptarTutoria(int idSesion)
        {
            if (!InputSanitizer.IsPositiveId(idSesion))
                return BadRequest(new { message = "[TUTORIA_ID_INVALIDO] El identificador debe ser un entero mayor que cero." });

            var sesion = _context.SesionTutoria.FirstOrDefault(x => x.IdSesion == idSesion);
            if (sesion == null)
                return NotFound();

            string previousState = sesion.Estado;
            sesion.Estado = "COMPLETADA";
            _auditLogService.Record(
                "TUTORIA_ACEPTADA",
                "SesionTutoria",
                idSesion,
                $"Estado cambiado de {previousState} a COMPLETADA.");

            _context.SaveChanges();

            return Ok(new { message = "Tutoría aceptada" });
        }

        [HttpPut("solicitar-edicion/{idSesion}")]
        [Authorize(Roles = "ALUMNO")]
        public IActionResult SolicitarEdicion(int idSesion)
        {
            if (!InputSanitizer.IsPositiveId(idSesion))
                return BadRequest(new { message = "[TUTORIA_ID_INVALIDO] El identificador debe ser un entero mayor que cero." });

            var sesion = _context.SesionTutoria.FirstOrDefault(x => x.IdSesion == idSesion);
            if (sesion == null)
                return NotFound();

            sesion.Estado = "EDICION";

            _context.SaveChanges();

            return Ok(new { message = "Tutoría en edición" });
        }

        private static string? ValidarSesion(SesionTutoriaDto dto)
        {
            if (!InputSanitizer.IsPositiveId(dto.IdAlumno))
                return "[TUTORIA_ALUMNO_INVALIDO] Selecciona un alumno válido.";
            if (dto.Fecha == default)
                return "[TUTORIA_FECHA_INVALIDA] Selecciona una fecha válida.";
            if (!InputSanitizer.TryParseTime(dto.HoraIni, out TimeOnly horaInicio) ||
                !InputSanitizer.TryParseTime(dto.HoraFin, out TimeOnly horaFin))
            {
                return "[TUTORIA_HORA_INVALIDA] Las horas deben tener el formato HH:mm.";
            }
            if (horaFin <= horaInicio)
                return "[TUTORIA_RANGO_HORA_INVALIDO] La hora de salida debe ser posterior a la hora de inicio.";

            string[] motivos = (dto.Motivo ?? string.Empty)
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            if (motivos.Length == 0 || motivos.Any(motivo => !MotivosPermitidos.Contains(motivo)))
                return "[TUTORIA_MOTIVO_INVALIDO] Selecciona al menos un motivo válido.";

            string? pointsError = InputSanitizer.ValidateFreeText(dto.Pts, "Los puntos relevantes", 2000);
            if (pointsError != null)
                return pointsError;

            return InputSanitizer.ValidateFreeText(dto.Acuerdos, "Los compromisos y acuerdos", 2000);
        }
    }
}
