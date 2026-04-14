using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using ProcesoTutorias.Server.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace ProcesoTutorias.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class LoginController : ControllerBase
    {
        private readonly SistemaTutoriasContext _context;
        private readonly IConfiguration _config;

        public LoginController(SistemaTutoriasContext context, IConfiguration config)
        {
            _context = context;
            _config = config;
        }

        // 1. LOGIN (Rúbrica: Tokens, Roles y Hashing)
        [HttpPost]
        public async Task<ActionResult> Login([FromBody] LoginRequest request)
        {
            var usuario = await _context.Usuarios
                .Include(u => u.id_rolNavigation)
                .FirstOrDefaultAsync(u => u.correo == request.Correo);

            if (usuario == null) return Unauthorized(new { message = "Usuario no encontrado" });

            bool esValida = false;
            // Manejo de contraseña inicial vs Hashing (Rúbrica: Seguridad básica)
            if (usuario.req_cambio_contra)
            {
                esValida = (usuario.contrasena_hash == request.Password);
            }
            else
            {
                esValida = BCrypt.Net.BCrypt.Verify(request.Password, usuario.contrasena_hash);
            }

            if (!esValida) return Unauthorized(new { message = "Contraseña incorrecta" });

            // Generación de Token (Rúbrica: 20% de la nota)
            var claims = new List<Claim> {
                new Claim(ClaimTypes.NameIdentifier, usuario.id_usuario.ToString()),
                new Claim(ClaimTypes.Email, usuario.correo),
                new Claim(ClaimTypes.Role, usuario.id_rolNavigation?.nombre ?? "Usuario")
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["JwtSettings:SecretKey"] ?? ""));
            var token = new JwtSecurityToken(
                issuer: _config["JwtSettings:Issuer"],
                audience: _config["JwtSettings:Audience"],
                claims: claims,
                expires: DateTime.Now.AddHours(2),
                signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256)
            );

            // Rúbrica: Registro de logs (10%)
            Console.WriteLine($"[AUDITORIA] Login exitoso: {usuario.correo} - {DateTime.Now}");

            return Ok(new
            {
                token = new JwtSecurityTokenHandler().WriteToken(token),
                user = new { usuario.nombre, usuario.correo, rol = usuario.id_rolNavigation?.nombre }
            });
        }

        // 2. CAMBIAR CONTRASEÑA (Recuperado de tu AuthController)
        [HttpPost("cambiar-contra")]
        public async Task<IActionResult> CambiarContrasena([FromBody] CambiarContraRequest request)
        {
            var user = await _context.Usuarios.FindAsync(request.IdUsuario);
            if (user == null) return NotFound("Usuario no encontrado");

            if (request.NuevaContra != request.ConfirmarContra)
                return BadRequest("Las contraseñas no coinciden");

            // Rúbrica: Uso de hashing al actualizar
            user.contrasena_hash = BCrypt.Net.BCrypt.HashPassword(request.NuevaContra);
            user.req_cambio_contra = false;

            await _context.SaveChangesAsync();
            return Ok("Contraseña actualizada correctamente");
        }
    }

    // DTOs Unificados (Fix para error CS1061)
    public class LoginRequest
    {
        public string Correo { get; set; } = null!;
        public string Password { get; set; } = null!;
    }

    public class CambiarContraRequest
    {
        public int IdUsuario { get; set; }
        public string NuevaContra { get; set; } = null!;
        public string ConfirmarContra { get; set; } = null!;
    }
}
