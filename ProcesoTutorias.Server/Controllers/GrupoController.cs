using Microsoft.AspNetCore.Mvc;
using ProcesoTutorias.Server.Models;
using ProcesoTutorias.Server.DTOs;

namespace ProcesoTutorias.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class GrupoController : ControllerBase
    {
        private readonly SistemaTutoriasContext _context;

        public GrupoController(SistemaTutoriasContext context)
        {
            _context = context;
        }

        [HttpGet("{idUsuario}")]
        public IActionResult ObtenerGrupo(int idUsuario)
        {
            //
            var grupoAlumno = (from a in _context.Alumnos
                               join g in _context.Grupos on a.id_grupo equals g.id_grupo
                               join c in _context.Carreras on g.id_carrera equals c.id_carrera into carr
                               from c in carr.DefaultIfEmpty()
                               where a.id_usuario == idUsuario
                               select new GrupoDto
                               {
                                   IdGrupo = g.id_grupo,
                                   Nombre = g.nombre_grupo,
                                   Carrera = c != null ? c.siglas : "Sin carrera",
                                   Carrera_nombre = c != null ? c.nombre : "Sin Carrera"
                               }).FirstOrDefault();

            if (grupoAlumno != null)
                return Ok(grupoAlumno);

            var grupoTutor = (from m in _context.Maestros
                              join t in _context.Tutors on m.id_maestro equals t.id_maestro
                              join g in _context.Grupos on t.id_tutor equals g.id_tutor
                              join c in _context.Carreras on g.id_carrera equals c.id_carrera into carr
                              from c in carr.DefaultIfEmpty()
                              where m.id_usuario == idUsuario
                              select new GrupoDto
                              {
                                  IdGrupo = g.id_grupo,
                                  Nombre = g.nombre_grupo,
                                  Carrera = c != null ? c.siglas : "Sin carrera",
                                  Carrera_nombre = c != null ? c.nombre : "Sin Carrera"
                              }).FirstOrDefault();

            if (grupoTutor != null)
                return Ok(grupoTutor);

            return NotFound("Grupo no encontrado");
        }
    }
}