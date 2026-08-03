using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using ProcesoTutorias.Server.Models;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using ProcesoTutorias.Server.Validation;
using ProcesoTutorias.Server.Services;

namespace ProcesoTutorias.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class LoginController : ControllerBase
    {
        private readonly SistemaTutoriasContext _context;
        private readonly SessionTokenService _sessionTokenService;
        private const string RefreshCookieName = "refresh_token";

        public LoginController(
            SistemaTutoriasContext context,
            SessionTokenService sessionTokenService)
        {
            _context = context;
            _sessionTokenService = sessionTokenService;
        }

        [HttpPost]
        [AllowAnonymous]
        public async Task<ActionResult> Login([FromBody] LoginRequest? request)
        {
            if (request == null)
                return BadRequest(new { message = "[SOLICITUD_REQUERIDA] La solicitud es obligatoria." });

            string? emailError = InputSanitizer.ValidateEmail(request.Correo);
            string? passwordError = InputSanitizer.ValidatePassword(request.Password, minLength: 1);
            if (emailError != null || passwordError != null)
                return BadRequest(new { message = emailError ?? passwordError });

            string correo = InputSanitizer.NormalizeSingleLine(request.Correo).ToLowerInvariant();
            var usuario = await _context.Usuarios
                .Include(u => u.IdRolNavigation)
                .FirstOrDefaultAsync(u => u.Correo == correo);

            if (usuario == null)
                return CredencialesInvalidas();

            bool legacyPlainText = usuario.ReqCambioContra &&
                !IsBcryptHash(usuario.ContrasenaHash);
            bool esValida = legacyPlainText
                ? FixedTimeEquals(usuario.ContrasenaHash, request.Password)
                : VerifyBcrypt(request.Password, usuario.ContrasenaHash);

            if (!esValida)
                return CredencialesInvalidas();

            if (legacyPlainText)
            {
                usuario.ContrasenaHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
                await _context.SaveChangesAsync();
            }

            SessionTokenResult session = await _sessionTokenService.CreateSessionAsync(usuario);
            WriteRefreshCookie(session.RefreshToken);

            return Ok(new
            {
                token = session.AccessToken,
                user = BuildUserResponse(usuario)
            });
        }

        [HttpPost("refresh")]
        [AllowAnonymous]
        public async Task<IActionResult> Refresh()
        {
            if (!Request.Cookies.TryGetValue(RefreshCookieName, out string? refreshToken))
                return Unauthorized();

            SessionTokenResult? session =
                await _sessionTokenService.RefreshSessionAsync(refreshToken);
            if (session == null)
            {
                DeleteRefreshCookie();
                return Unauthorized();
            }

            WriteRefreshCookie(session.RefreshToken);

            return Ok(new
            {
                token = session.AccessToken,
                user = BuildUserResponse(session.User)
            });
        }

        [HttpPost("logout")]
        [AllowAnonymous]
        public async Task<IActionResult> Logout()
        {
            Request.Cookies.TryGetValue(RefreshCookieName, out string? refreshToken);
            await _sessionTokenService.RevokeByRefreshTokenAsync(refreshToken);
            DeleteRefreshCookie();
            return NoContent();
        }

        [HttpPost("cambiar-contra")]
        [Authorize]
        public async Task<IActionResult> CambiarContrasena([FromBody] CambiarContraRequest? request)
        {
            if (request == null)
                return BadRequest(new { message = "[SOLICITUD_REQUERIDA] La solicitud es obligatoria." });

            if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out int idUsuario))
                return Unauthorized();

            var user = await _context.Usuarios
                .Include(item => item.IdRolNavigation)
                .FirstOrDefaultAsync(item => item.IdUsuario == idUsuario);

            if (user == null)
                return NotFound("Usuario no encontrado");

            if (request.NuevaContra != request.ConfirmarContra)
                return BadRequest("Las contraseñas no coinciden");

            if (!user.ReqCambioContra &&
                (string.IsNullOrEmpty(request.ContrasenaActual) ||
                 !VerifyBcrypt(request.ContrasenaActual, user.ContrasenaHash)))
            {
                return BadRequest(new
                {
                    message = "[CONTRASENA_ACTUAL_INCORRECTA] La contraseña actual no es correcta."
                });
            }

            string? passwordError = InputSanitizer.ValidatePassword(request.NuevaContra);
            if (passwordError != null)
                return BadRequest(new { message = passwordError });

            user.ContrasenaHash = BCrypt.Net.BCrypt.HashPassword(request.NuevaContra);
            user.ReqCambioContra = false;
            user.SessionVersion++;

            await _context.SaveChangesAsync();
            await _sessionTokenService.RevokeAllForUserAsync(user.IdUsuario);
            SessionTokenResult session = await _sessionTokenService.CreateSessionAsync(user);
            WriteRefreshCookie(session.RefreshToken);

            return Ok(new
            {
                message = "Contraseña actualizada correctamente",
                token = session.AccessToken,
                user = BuildUserResponse(user)
            });
        }

        private UnauthorizedObjectResult CredencialesInvalidas() =>
            Unauthorized(new { message = "El correo o la contraseña no son correctos." });

        private static bool IsBcryptHash(string value) =>
            value.Length == 60 &&
            (value.StartsWith("$2a$") ||
             value.StartsWith("$2b$") ||
             value.StartsWith("$2y$"));

        private static bool VerifyBcrypt(string password, string hash)
        {
            if (!IsBcryptHash(hash))
                return false;

            try
            {
                return BCrypt.Net.BCrypt.Verify(password, hash);
            }
            catch (BCrypt.Net.SaltParseException)
            {
                return false;
            }
        }

        private static bool FixedTimeEquals(string expected, string supplied)
        {
            byte[] expectedHash = SHA256.HashData(Encoding.UTF8.GetBytes(expected));
            byte[] suppliedHash = SHA256.HashData(Encoding.UTF8.GetBytes(supplied));
            return CryptographicOperations.FixedTimeEquals(expectedHash, suppliedHash);
        }

        private object BuildUserResponse(Usuario usuario) => new
        {
            id_usuario = usuario.IdUsuario,
            id_rol = usuario.IdRol,
            nombre = usuario.Nombre,
            correo = usuario.Correo,
            rol = usuario.IdRolNavigation?.Nombre,
            req_cambio_contra = usuario.ReqCambioContra
        };

        private void WriteRefreshCookie(string refreshToken)
        {
            Response.Cookies.Append(RefreshCookieName, refreshToken, new CookieOptions
            {
                HttpOnly = true,
                Secure = Request.IsHttps,
                SameSite = SameSiteMode.Lax,
                Path = "/api/Login",
                MaxAge = TimeSpan.FromDays(7),
                IsEssential = true
            });
        }

        private void DeleteRefreshCookie()
        {
            Response.Cookies.Delete(RefreshCookieName, new CookieOptions
            {
                Secure = Request.IsHttps,
                SameSite = SameSiteMode.Lax,
                Path = "/api/Login"
            });
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
        public string? ContrasenaActual { get; set; }
        public string NuevaContra { get; set; } = null!;
        public string ConfirmarContra { get; set; } = null!;
    }
}
