using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using ProcesoTutorias.Server.Models;

namespace ProcesoTutorias.Server.Services;

public sealed class SessionTokenService
{
    private readonly SistemaTutoriasContext _context;
    private readonly IConfiguration _configuration;

    public SessionTokenService(SistemaTutoriasContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    public async Task<SessionTokenResult> CreateSessionAsync(Usuario user)
    {
        var session = new AuthSession
        {
            IdSession = Guid.NewGuid(),
            IdUsuario = user.IdUsuario,
            SessionVersion = user.SessionVersion,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(GetRefreshTokenDays())
        };

        string refreshToken = RotateSessionSecrets(session);
        _context.AuthSessions.Add(session);
        await _context.SaveChangesAsync();

        return BuildResult(user, session, refreshToken);
    }

    public async Task<SessionTokenResult?> RefreshSessionAsync(string refreshToken)
    {
        string refreshHash = HashToken(refreshToken);
        var session = await _context.AuthSessions
            .Include(item => item.IdUsuarioNavigation)
                .ThenInclude(user => user.IdRolNavigation)
            .FirstOrDefaultAsync(item =>
                item.RefreshTokenHash == refreshHash &&
                item.RevokedAt == null &&
                item.ExpiresAt > DateTime.UtcNow &&
                item.SessionVersion == item.IdUsuarioNavigation.SessionVersion);

        if (session == null)
            return null;

        string nextRefreshToken = RotateSessionSecrets(session);
        await _context.SaveChangesAsync();
        return BuildResult(session.IdUsuarioNavigation, session, nextRefreshToken);
    }

    public async Task<SessionTokenResult?> RenewCurrentSessionAsync(Guid sessionId, Usuario user)
    {
        var session = await _context.AuthSessions.FirstOrDefaultAsync(item =>
            item.IdSession == sessionId &&
            item.IdUsuario == user.IdUsuario &&
            item.RevokedAt == null &&
            item.ExpiresAt > DateTime.UtcNow);

        if (session == null)
            return null;

        string refreshToken = RotateSessionSecrets(session);
        await _context.SaveChangesAsync();
        return BuildResult(user, session, refreshToken);
    }

    public async Task RevokeByRefreshTokenAsync(string? refreshToken)
    {
        if (string.IsNullOrWhiteSpace(refreshToken))
            return;

        string refreshHash = HashToken(refreshToken);
        var session = await _context.AuthSessions.FirstOrDefaultAsync(item =>
            item.RefreshTokenHash == refreshHash &&
            item.RevokedAt == null);

        if (session == null)
            return;

        session.RevokedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
    }

    public async Task RevokeAllForUserAsync(int idUsuario)
    {
        var activeSessions = await _context.AuthSessions
            .Where(item => item.IdUsuario == idUsuario && item.RevokedAt == null)
            .ToListAsync();

        foreach (var session in activeSessions)
            session.RevokedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
    }

    public async Task<bool> ValidateAccessSessionAsync(
        Guid sessionId,
        int idUsuario,
        string jti,
        int sessionVersion)
    {
        return await _context.AuthSessions
            .AsNoTracking()
            .AnyAsync(item =>
                item.IdSession == sessionId &&
                item.IdUsuario == idUsuario &&
                item.Jti == jti &&
                item.SessionVersion == sessionVersion &&
                item.RevokedAt == null &&
                item.ExpiresAt > DateTime.UtcNow &&
                item.IdUsuarioNavigation.SessionVersion == sessionVersion);
    }

    private SessionTokenResult BuildResult(Usuario user, AuthSession session, string refreshToken)
    {
        DateTime accessExpiresAt = DateTime.UtcNow.AddMinutes(GetAccessTokenMinutes());
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.IdUsuario.ToString()),
            new(ClaimTypes.Email, user.Correo),
            new(ClaimTypes.Role, user.IdRolNavigation?.Nombre ?? "Usuario"),
            new(JwtRegisteredClaimNames.Jti, session.Jti),
            new("sid", session.IdSession.ToString()),
            new("session_version", user.SessionVersion.ToString())
        };

        string secret = _configuration["JwtSettings:SecretKey"]
            ?? throw new InvalidOperationException("JwtSettings:SecretKey no está configurado.");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var token = new JwtSecurityToken(
            issuer: _configuration["JwtSettings:Issuer"],
            audience: _configuration["JwtSettings:Audience"],
            claims: claims,
            notBefore: DateTime.UtcNow,
            expires: accessExpiresAt,
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));

        return new SessionTokenResult(
            new JwtSecurityTokenHandler().WriteToken(token),
            refreshToken,
            accessExpiresAt,
            user);
    }

    private static string RotateSessionSecrets(AuthSession session)
    {
        string refreshToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
        session.Jti = Guid.NewGuid().ToString("N");
        session.RefreshTokenHash = HashToken(refreshToken);
        return refreshToken;
    }

    private static string HashToken(string token)
    {
        return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));
    }

    private int GetAccessTokenMinutes() =>
        Math.Max(5, _configuration.GetValue("JwtSettings:AccessTokenMinutes", 15));

    private int GetRefreshTokenDays() =>
        Math.Max(1, _configuration.GetValue("JwtSettings:RefreshTokenDays", 7));
}

public sealed record SessionTokenResult(
    string AccessToken,
    string RefreshToken,
    DateTime AccessExpiresAt,
    Usuario User);
