using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProcesoTutorias.Server.Models;
using Microsoft.AspNetCore.Authorization;

namespace ProcesoTutorias.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "ADMIN")]
    public class MaestroController : ControllerBase
    {
        private readonly SistemaTutoriasContext _context;

        public MaestroController(SistemaTutoriasContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Maestro>>> GetMaestros()
        {
            return await _context.Maestros
                .Include(m => m.IdUsuarioNavigation)
                .ToListAsync();
        }

        [HttpPost]
        public async Task<ActionResult<Maestro>> PostMaestro(Maestro maestro)
        {
            ModelState.Remove("IdUsuarioNavigation");
            ModelState.Remove("Tutors");

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                _context.Maestros.Add(maestro);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetMaestros),
                    new { id = maestro.IdMaestro }, maestro);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    message = "Error al guardar en BD",
                    detalle = ex.InnerException?.Message ?? ex.Message
                });
            }
        }
    }
}
