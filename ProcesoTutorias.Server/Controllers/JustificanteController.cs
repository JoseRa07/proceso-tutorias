using Microsoft.AspNetCore.Mvc;
using ProcesoTutorias.Server.Models;
using ProcesoTutorias.Server.DTOs;

namespace ProcesoTutorias.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class JustificanteController : ControllerBase
    {
        private readonly SistemaTutoriasContext _context;

        public JustificanteController(SistemaTutoriasContext context)
        {
            _context = context;
        }

        [HttpGet]
        public IActionResult Obtener(int idUsuario, int pagina = 1, int tam = 5)
        {
            var query = from a in _context.Alumnos
                        join j in _context.Justificantes on a.id_alumno equals j.id_alumno
                        where a.id_usuario == idUsuario
                        orderby j.fecha descending
                        select new JustificanteDto
                        {
                            IdJustificante = j.id_justificante,
                            Fecha = j.fecha,
                            Descripcion = j.descripcion,
                            Estado = j.estado
                        };

            var total = query.Count();

            var data = query
                .Skip((pagina - 1) * tam)
                .Take(tam)
                .ToList();

            return Ok(new { total, data });
        }

        [HttpPost]
        public IActionResult Crear(int idUsuario, [FromBody] JustificanteDto dto)
        {
            var alumno = _context.Alumnos.FirstOrDefault(a => a.id_usuario == idUsuario);

            if (alumno == null)
                return NotFound("Alumno no encontrado");

            var j = new Justificante
            {
                id_alumno = alumno.id_alumno,
                fecha = dto.Fecha,
                descripcion = dto.Descripcion,
                estado = "ACTIVO"
            };

            _context.Justificantes.Add(j);
            _context.SaveChanges();

            return Ok(j);
        }

        [HttpPut("{id}")]
        public IActionResult Editar(int id, [FromBody] JustificanteDto dto)
        {
            var j = _context.Justificantes.Find(id);

            if (j == null)
                return NotFound();

            j.descripcion = dto.Descripcion;
            j.fecha = dto.Fecha;

            _context.SaveChanges();

            return Ok(j);
        }

        [HttpDelete("{id}")]
        public IActionResult Eliminar(int id)
        {
            var j = _context.Justificantes.Find(id);

            if (j == null)
                return NotFound();

            j.estado = "INACTIVO";

            _context.SaveChanges();

            return Ok();
        }
    }
}