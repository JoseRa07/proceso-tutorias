using Microsoft.AspNetCore.Mvc;
using ProcesoTutorias.Server.Models;
using ProcesoTutorias.Server.DTOs;
using System.Text;
using System.Security.Cryptography;
using BCrypt.Net;

namespace ProcesoTutorias.Server.Controllers
{

    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly SistemaTutoriasContext _context;

        public AuthController(SistemaTutoriasContext context)
        {
            _context = context;
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginRequest request)
        {
            Usuario? user = _context.Usuarios
                .FirstOrDefault(u => u.correo == request.Correo);

            if (user == null)
                return Unauthorized("Usuario no encontrado");

            if (user.req_cambio_contra)
            {
                if (user.contrasena_hash != request.Contrasena)
                    return Unauthorized("Contraseña incorrecta");
            }
            else
            {
                bool isValid = BCrypt.Net.BCrypt.Verify(request.Contrasena, user.contrasena_hash);
                if (!isValid)
                    return Unauthorized("Contraseña incorrecta");
            }

            return Ok(new
            {
                user.id_usuario,
                user.nombre,
                user.correo,
                user.id_rol,
                req_cambio_contra = user.req_cambio_contra
            });
        }

        [HttpPost("cambiar-contra")]
        public IActionResult CambiarContrasena([FromBody] CambiarContraIniRequest request)
        {
            var user = _context.Usuarios
                .FirstOrDefault(u => u.id_usuario == request.IdUsuario);

            if (user == null)
                return NotFound("Usuario no encontrado");

            // VALIDACIONES

            if (string.IsNullOrWhiteSpace(request.NuevaContra))
                return BadRequest("La contraseña no puede estar vacía");

            if (request.NuevaContra.Length < 6)
                return BadRequest("La contraseña debe tener al menos 6 caracteres");

            if (request.NuevaContra != request.ConfirmarContra)
                return BadRequest("Las contraseñas no coinciden");

            // evitar que repita la misma
            if (user.contrasena_hash == request.NuevaContra)
                return BadRequest("No puedes usar la misma contraseña");

            // Guardar nueva contraseña por ahora sin hash
            string hashed = BCrypt.Net.BCrypt.HashPassword(request.NuevaContra);
            user.contrasena_hash = hashed;

            // Quitar lo de contra por defecto inicial
            user.req_cambio_contra = false;

            _context.SaveChanges();

            return Ok("Contraseña actualizada correctamente");
        }
    }
}

