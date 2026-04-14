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

        [HttpPost]
        public async Task<ActionResult> Login([FromBody] LoginRequest request)
        {
            var usuario = await _context.Usuarios
                .Include(u => u.IdRolNavigation)
                .FirstOrDefaultAsync(u => u.Correo == request.Correo);

            if (usuario == null)
                return Unauthorized(new { message = "Usuario no encontrado" });

            bool esValida;

            if (usuario.ReqCambioContra)
            {
                esValida = (usuario.ContrasenaHash == request.Password);
            }
            else
            {
                esValida = BCrypt.Net.BCrypt.Verify(request.Password, usuario.ContrasenaHash);
            }

            if (!esValida)
                return Unauthorized(new { message = "Contraseña incorrecta" });

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, usuario.IdUsuario.ToString()),
                new Claim(ClaimTypes.Email, usuario.Correo),
                new Claim(ClaimTypes.Role, usuario.IdRolNavigation?.Nombre ?? "Usuario")
            };

            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(_config["JwtSettings:SecretKey"] ?? "")
            );

            var token = new JwtSecurityToken(
                issuer: _config["JwtSettings:Issuer"],
                audience: _config["JwtSettings:Audience"],
                claims: claims,
                expires: DateTime.Now.AddHours(2),
                signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256)
            );

            Console.WriteLine($"[LOGIN] {usuario.Correo} - {DateTime.Now}");

            return Ok(new
            {
                token = new JwtSecurityTokenHandler().WriteToken(token),
                user = new
                {
                    id_usuario = usuario.IdUsuario,
                    id_rol = usuario.IdRol,
                    nombre = usuario.Nombre,
                    correo = usuario.Correo,
                    rol = usuario.IdRolNavigation?.Nombre,
                    req_cambio_contra = usuario.ReqCambioContra
                }
            });
        }

        [HttpPost("cambiar-contra")]
        public async Task<IActionResult> CambiarContrasena([FromBody] CambiarContraRequest request)
        {
            var user = await _context.Usuarios.FindAsync(request.IdUsuario);

            if (user == null)
                return NotFound("Usuario no encontrado");

            if (request.NuevaContra != request.ConfirmarContra)
                return BadRequest("Las contraseñas no coinciden");

            user.ContrasenaHash = BCrypt.Net.BCrypt.HashPassword(request.NuevaContra);
            user.ReqCambioContra = false;

            await _context.SaveChangesAsync();

            return Ok("Contraseña actualizada correctamente");
        }
    }

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