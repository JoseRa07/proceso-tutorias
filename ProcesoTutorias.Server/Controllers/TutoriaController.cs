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
        public IActionResult ObtenerTutorias(int idUsuario, int idRol, string? estado = null, int pagina = 1, int tam = 5)
        {
            IQueryable<TutoriaDto> query;

            if (idRol == 2) // ALUMNO
            {
                query = from a in _context.Alumnos
                        join t in _context.Tutoria on a.id_alumno equals t.id_alumno
                        join s in _context.sesion_tutoria on t.id_tutoria equals s.id_tutoria
                        where a.id_usuario == idUsuario
                        select new TutoriaDto
                        {
                            IdSesion = s.id_sesion,
                            Fecha = s.fecha,
                            HoraIni = s.hora_ini,
                            HoraFin = s.hora_fin,
                            Motivo = s.motivo,
                            Estado = s.estado
                        };
            }
            else // TUTOR
            {
                query = from m in _context.Maestros
                        join tu in _context.Tutors on m.id_maestro equals tu.id_maestro
                        join g in _context.Grupos on tu.id_tutor equals g.id_tutor
                        join a in _context.Alumnos on g.id_grupo equals a.id_grupo
                        join t in _context.Tutoria on a.id_alumno equals t.id_alumno
                        join s in _context.sesion_tutoria on t.id_tutoria equals s.id_tutoria
                        where m.id_usuario == idUsuario
                        select new TutoriaDto
                        {
                            IdSesion = s.id_sesion,
                            Fecha = s.fecha,
                            HoraIni = s.hora_ini,
                            HoraFin = s.hora_fin,
                            Motivo = s.motivo,
                            Estado = s.estado
                        };
            }

            // filtro
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
    }
}