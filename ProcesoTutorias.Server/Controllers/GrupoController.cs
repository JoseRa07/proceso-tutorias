using Microsoft.AspNetCore.Mvc;
using ProcesoTutorias.Server.Models;
using ProcesoTutorias.Server.DTOs;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace ProcesoTutorias.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "ALUMNO,TUTOR")]
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
            if (
                User.IsInRole("ALUMNO") &&
                (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out int idUsuarioActual) ||
                 idUsuarioActual != idUsuario)
            )
            {
                return Forbid();
            }

            var grupoAlumno = (from a in _context.Alumnos
                               join g in _context.Grupos on a.IdGrupo equals g.IdGrupo
                               join c in _context.Carreras on g.IdCarrera equals c.IdCarrera into carr
                               from c in carr.DefaultIfEmpty()
                               where a.IdUsuario == idUsuario
                               select new GrupoDto
                               {
                                   IdGrupo = g.IdGrupo,
                                   Nombre = g.NombreGrupo,
                                   Carrera = c != null ? c.Siglas : "Sin carrera",
                                   Carrera_nombre = c != null ? c.Nombre : "Sin Carrera"
                               }).FirstOrDefault();

            if (grupoAlumno != null)
                return Ok(grupoAlumno);

            var grupoTutor = (from m in _context.Maestros
                              join t in _context.Tutors on m.IdMaestro equals t.IdMaestro
                              join g in _context.Grupos on t.IdTutor equals g.IdTutor
                              join c in _context.Carreras on g.IdCarrera equals c.IdCarrera into carr
                              from c in carr.DefaultIfEmpty()
                              where m.IdUsuario == idUsuario
                              select new GrupoDto
                              {
                                  IdGrupo = g.IdGrupo,
                                  Nombre = g.NombreGrupo,
                                  Carrera = c != null ? c.Siglas : "Sin carrera",
                                  Carrera_nombre = c != null ? c.Nombre : "Sin Carrera"
                              }).FirstOrDefault();

            if (grupoTutor != null)
                return Ok(grupoTutor);

            return NotFound("Grupo no encontrado");
        }
    }
}
