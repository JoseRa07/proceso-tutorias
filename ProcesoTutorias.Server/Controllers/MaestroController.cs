using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProcesoTutorias.Server.Models;

namespace ProcesoTutorias.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MaestroController : ControllerBase
    {
        private readonly SistemaTutoriasContext _context;

        public MaestroController(SistemaTutoriasContext context)
        {
            _context = context;
        }

        // GET: api/Maestro
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Maestro>>> GetMaestros()
        {
            return await _context.Maestros.ToListAsync();
        }

        // POST: api/Maestro
        [HttpPost]
        public async Task<ActionResult<Maestro>> PostMaestro(Maestro maestro)
        {
            // Por si acaso, limpiamos las validaciones extra
            ModelState.Remove("id_usuarioNavigation");
            ModelState.Remove("Tutors");

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                _context.Maestros.Add(maestro);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetMaestros), new { id = maestro.id_maestro }, maestro);
            }
            catch (Exception ex)
            {
                // Si la base de datos lo rechaza (ej. el ID de usuario no existe), te dirá exactamente por qué
                return StatusCode(500, new { message = "Error al guardar en BD", detalle = ex.InnerException?.Message ?? ex.Message });
            }
        }
    }
}