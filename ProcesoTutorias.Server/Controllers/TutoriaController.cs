using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ProcesoTutorias.Server.Models;
using ProcesoTutorias.Server.DTOs;

namespace ProcesoTutorias.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class TutoriaController : ControllerBase
    {
        private readonly SistemaTutoriasContext _context;

        public TutoriaController(SistemaTutoriasContext context)
        {
            _context = context;
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
                            idAlumno = a.IdAlumno,
                            nombreAlumno = u.Nombre + " " + u.Apellidos,
                            idUsuarioAlumno = u.IdUsuario
                        }).FirstOrDefault();

            if (data == null) return NotFound();

            return Ok(data);
        }

        [HttpGet("alumnos")]
        public IActionResult ObtenerTutorados(int idUsuario)
        {
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
        public IActionResult CrearTutoria(int idUsuario, [FromBody] SesionTutoriaDto? dto)
        {
            try
            {
                if (dto == null)
                    return BadRequest("DTO vacío");

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
                    HoraIni = TimeOnly.Parse(dto.HoraIni),
                    HoraFin = TimeOnly.Parse(dto.HoraFin),
                    Motivo = dto.Motivo,
                    PtsRelevantes = dto.Pts,
                    CompromisosAcuerdos = dto.Acuerdos,
                    Estado = "PENDIENTE"
                };

                _context.SesionTutoria.Add(sesion);
                _context.SaveChanges();

                return Ok(new { message = "Tutoría creada correctamente" });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("{idSesion}")]
        public IActionResult EditarTutoria(int idSesion, [FromBody] SesionTutoriaDto? dto)
        {
            if (dto == null)
                return BadRequest("DTO vacío");

            var sesion = _context.SesionTutoria.FirstOrDefault(x => x.IdSesion == idSesion);

            if (sesion == null)
                return NotFound();

            sesion.Fecha = dto.Fecha;
            sesion.HoraIni = TimeOnly.Parse(dto.HoraIni);
            sesion.HoraFin = TimeOnly.Parse(dto.HoraFin);
            sesion.Motivo = dto.Motivo;
            sesion.PtsRelevantes = dto.Pts;
            sesion.CompromisosAcuerdos = dto.Acuerdos;

            sesion.Estado = "PENDIENTE";

            _context.SaveChanges();

            return Ok(new { message = "Tutoría actualizada" });
        }

        [HttpPut("eliminar/{idSesion}")]
        public IActionResult EliminarTutoria(int idSesion)
        {
            var sesion = _context.SesionTutoria.First(x => x.IdSesion == idSesion);

            sesion.Estado = "INACTIVO";

            _context.SaveChanges();

            return Ok(new { message = "Tutoría eliminada" });
        }

        [HttpPut("aceptar/{idSesion}")]
        public IActionResult AceptarTutoria(int idSesion)
        {
            var sesion = _context.SesionTutoria.First(x => x.IdSesion == idSesion);

            sesion.Estado = "COMPLETADA";

            _context.SaveChanges();

            return Ok(new { message = "Tutoría aceptada" });
        }

        [HttpPut("solicitar-edicion/{idSesion}")]
        public IActionResult SolicitarEdicion(int idSesion)
        {
            var sesion = _context.SesionTutoria.First(x => x.IdSesion == idSesion);

            sesion.Estado = "EDICION";

            _context.SaveChanges();

            return Ok(new { message = "Tutoría en edición" });
        }
    }
}