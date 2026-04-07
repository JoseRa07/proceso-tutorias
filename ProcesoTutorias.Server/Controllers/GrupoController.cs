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
            var grupo = (from a in _context.Alumnos
                         join g in _context.Grupos on a.id_grupo equals g.id_grupo
                         join c in _context.Carreras on g.id_carrera equals c.id_carrera into carr
                         from c in carr.DefaultIfEmpty()
                         where a.id_usuario == idUsuario
                         select new GrupoDto
                         {
                             IdGrupo = g.id_grupo,
                             Nombre = g.nombre_grupo,
                             Carrera = c != null ? c.siglas : "Sin carrera"
                         }).FirstOrDefault();

            if (grupo == null)
                return NotFound("Grupo no encontrado");

            return Ok(grupo);
        }
    }
}