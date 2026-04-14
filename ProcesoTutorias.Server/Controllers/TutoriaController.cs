using Microsoft.AspNetCore.Mvc;
using ProcesoTutorias.Server.Models;
using ProcesoTutorias.Server.DTOs;

namespace ProcesoTutorias.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
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

            if (idRol == 2) // ALUMNO
            {
                query = from a in _context.Alumnos
                        join u in _context.Usuarios on a.id_usuario equals u.id_usuario
                        join t in _context.Tutoria on a.id_alumno equals t.id_alumno
                        join s in _context.sesion_tutoria on t.id_tutoria equals s.id_tutoria
                        where a.id_usuario == idUsuario
                        && s.estado != "INACTIVO"
                        select new SesionTutoriaDto
                        {
                            IdSesion = s.id_sesion,
                            Fecha = s.fecha,
                            HoraIni = s.hora_ini.ToString("HH:mm"),
                            HoraFin = s.hora_fin.ToString("HH:mm"),
                            Motivo = s.motivo,
                            Estado = s.estado,
                            IdAlumno = a.id_alumno,
                            NombreAlumno = u.nombre + " " + u.apellidos
                        };
            }
            else // TUTOR
            {
                query = from m in _context.Maestros
                        join tu in _context.Tutors on m.id_maestro equals tu.id_maestro
                        join g in _context.Grupos on tu.id_tutor equals g.id_tutor
                        join a in _context.Alumnos on g.id_grupo equals a.id_grupo
                        join u in _context.Usuarios on a.id_usuario equals u.id_usuario
                        join t in _context.Tutoria on a.id_alumno equals t.id_alumno
                        join s in _context.sesion_tutoria on t.id_tutoria equals s.id_tutoria
                        where m.id_usuario == idUsuario
                        && s.estado != "INACTIVO"
                        select new SesionTutoriaDto
                        {
                            IdSesion = s.id_sesion,
                            Fecha = s.fecha,
                            HoraIni = s.hora_ini.ToString("HH:mm"),
                            HoraFin = s.hora_fin.ToString("HH:mm"),
                            Motivo = s.motivo,
                            Estado = s.estado,
                            IdAlumno = a.id_alumno,
                            NombreAlumno = u.nombre + " " + u.apellidos
                        };
            }

            // filtro por alumno
            if (idAlumno.HasValue)
                query = query.Where(x => x.IdAlumno == idAlumno.Value);

            // filtro por estado
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
            var data = (from s in _context.sesion_tutoria
                        join t in _context.Tutoria on s.id_tutoria equals t.id_tutoria
                        join a in _context.Alumnos on t.id_alumno equals a.id_alumno
                        join u in _context.Usuarios on a.id_usuario equals u.id_usuario
                        where s.id_sesion == idSesion
                        && s.estado != "INACTIVO"
                        select new
                        {
                            idSesion = s.id_sesion,
                            fecha = s.fecha,
                            horaIni = s.hora_ini,
                            horaFin = s.hora_fin,
                            motivo = s.motivo,
                            ptsRelevantes = s.pts_relevantes,
                            compromisos = s.compromisos_acuerdos,
                            estado = s.estado,
                            idAlumno = a.id_alumno,
                            nombreAlumno = u.nombre + " " + u.apellidos,
                            idUsuarioAlumno = u.id_usuario
                        }).FirstOrDefault();

            if (data == null) return NotFound();

            return Ok(data);
        }

        [HttpGet("alumnos")]
        public IActionResult ObtenerTutorados(int idUsuario)
        {
            var alumnos = from m in _context.Maestros
                          join t in _context.Tutors on m.id_maestro equals t.id_maestro
                          join g in _context.Grupos on t.id_tutor equals g.id_tutor
                          join a in _context.Alumnos on g.id_grupo equals a.id_grupo
                          join u in _context.Usuarios on a.id_usuario equals u.id_usuario
                          where m.id_usuario == idUsuario
                          select new
                          {
                              id_alumno = a.id_alumno,
                              nombre = u.nombre + " " + u.apellidos
                          };

            return Ok(alumnos.ToList());
        }


        // INSERTAR
        [HttpPost]
        public IActionResult CrearTutoria(int idUsuario, [FromBody] SesionTutoriaDto? dto)
        {
            try
            {
                if (dto == null)
                    return BadRequest("DTO vacío");

                Tutor? tutor = _context.Tutors
                    .First(t => t.id_maestroNavigation.id_usuario == idUsuario);

                var tutoria = new Tutorium
                {
                    id_alumno = dto.IdAlumno,
                    id_tutor = tutor.id_tutor
                };

                _context.Tutoria.Add(tutoria);
                _context.SaveChanges();

                var sesion = new sesion_tutorium
                {
                    id_tutoria = tutoria.id_tutoria,
                    fecha = dto.Fecha,
                    hora_ini = TimeOnly.Parse(dto.HoraIni),
                    hora_fin = TimeOnly.Parse(dto.HoraFin),
                    motivo = dto.Motivo,
                    pts_relevantes = dto.Pts,
                    compromisos_acuerdos = dto.Acuerdos,
                    estado = "PENDIENTE"
                };

                _context.sesion_tutoria.Add(sesion);
                _context.SaveChanges();

                return Ok(new { message = "Tutoría creada correctamente" });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }


        // EDITAR
        [HttpPut("{idSesion}")]
        public IActionResult EditarTutoria(int idSesion, [FromBody] SesionTutoriaDto? dto)
        {
            if (dto == null)
                return BadRequest("DTO vacío");

            var sesion = _context.sesion_tutoria.FirstOrDefault(x => x.id_sesion == idSesion);

            if (sesion == null)
                return NotFound();

            sesion.fecha = dto.Fecha;
            sesion.hora_ini = TimeOnly.Parse(dto.HoraIni);
            sesion.hora_fin = TimeOnly.Parse(dto.HoraFin);
            sesion.motivo = dto.Motivo;
            sesion.pts_relevantes = dto.Pts;
            sesion.compromisos_acuerdos = dto.Acuerdos;

            sesion.estado = "PENDIENTE";

            _context.SaveChanges();

            return Ok(new { message = "Tutoría actualizada" });
        }

        // ELIMINAR
        [HttpPut("eliminar/{idSesion}")]
        public IActionResult EliminarTutoria(int idSesion)
        {
            var sesion = _context.sesion_tutoria
                .First(x => x.id_sesion == idSesion);

            sesion.estado = "INACTIVO";

            _context.SaveChanges();

            return Ok(new { message = "Tutoría eliminada" });
        }

        //ACEPTAR
        [HttpPut("aceptar/{idSesion}")]
        public IActionResult AceptarTutoria(int idSesion)
        {
            var sesion = _context.sesion_tutoria
                .First(x => x.id_sesion == idSesion);

            sesion.estado = "COMPLETADA";

            _context.SaveChanges();

            return Ok(new { message = "Tutoría aceptada" });
        }

        //SOLICITAR EDICION
        [HttpPut("solicitar-edicion/{idSesion}")]
        public IActionResult SolicitarEdicion(int idSesion)
        {
            var sesion = _context.sesion_tutoria
                .First(x => x.id_sesion == idSesion);

            sesion.estado = "EDICION";

            _context.SaveChanges();

            return Ok(new { message = "Tutoría en edición" });
        }
    }
}