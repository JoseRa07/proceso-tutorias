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
        public async Task<ActionResult> GetMaestros()
        {
            var maestros = await _context.Maestros
                .AsNoTracking()
                .Select(m => new
                {
                    idMaestro = m.IdMaestro,
                    idUsuario = m.IdUsuario,
                    codEmpleado = m.CodEmpleado,
                    vigencia = m.Vigencia,
                    nombre = m.IdUsuarioNavigation.Nombre + " " + m.IdUsuarioNavigation.Apellidos,
                    correo = m.IdUsuarioNavigation.Correo
                })
                .ToListAsync();

            return Ok(maestros);
        }

        [HttpPost]
        public async Task<ActionResult<Maestro>> PostMaestro(Maestro maestro)
        {
            ModelState.Remove("IdUsuarioNavigation");
            ModelState.Remove("Tutors");

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            bool usuarioExiste = await _context.Usuarios
                .AsNoTracking()
                .AnyAsync(usuario => usuario.IdUsuario == maestro.IdUsuario);
            if (!usuarioExiste)
                return BadRequest(new { message = "[MAESTRO_USUARIO_INVALIDO] El usuario seleccionado no existe." });

            bool maestroExiste = await _context.Maestros
                .AsNoTracking()
                .AnyAsync(item =>
                    item.IdUsuario == maestro.IdUsuario ||
                    item.CodEmpleado == maestro.CodEmpleado);
            if (maestroExiste)
                return Conflict(new { message = "[MAESTRO_DUPLICADO] El usuario o código de empleado ya está registrado." });

            _context.Maestros.Add(maestro);
            await _context.SaveChangesAsync();

            return StatusCode(StatusCodes.Status201Created, new
            {
                message = "Maestro registrado correctamente.",
                idMaestro = maestro.IdMaestro
            });
        }
    }
}
