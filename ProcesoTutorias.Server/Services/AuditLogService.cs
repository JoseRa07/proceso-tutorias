using System.Security.Claims;
using ProcesoTutorias.Server.Models;

namespace ProcesoTutorias.Server.Services;

public sealed class AuditLogService
{
    private readonly SistemaTutoriasContext _context;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public AuditLogService(
        SistemaTutoriasContext context,
        IHttpContextAccessor httpContextAccessor)
    {
        _context = context;
        _httpContextAccessor = httpContextAccessor;
    }

    public void Record(
        string action,
        string entity,
        int entityId,
        string? detail = null)
    {
        ClaimsPrincipal? user = _httpContextAccessor.HttpContext?.User;
        int? actorUserId = int.TryParse(
            user?.FindFirstValue(ClaimTypes.NameIdentifier),
            out int parsedUserId)
                ? parsedUserId
                : null;

        _context.AuditLogs.Add(new AuditLog
        {
            CreatedAtUtc = DateTime.UtcNow,
            ActorUserId = actorUserId,
            ActorEmail = Limit(user?.FindFirstValue(ClaimTypes.Email), 150),
            ActorRole = Limit(user?.FindFirstValue(ClaimTypes.Role), 50),
            Action = Limit(action, 80)!,
            Entity = Limit(entity, 80)!,
            EntityId = entityId.ToString(),
            Detail = Limit(detail, 500),
            IpAddress = Limit(
                _httpContextAccessor.HttpContext?.Connection.RemoteIpAddress?.ToString(),
                45)
        });
    }

    private static string? Limit(string? value, int maxLength)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        string normalized = value.Trim();
        return normalized.Length <= maxLength
            ? normalized
            : normalized[..maxLength];
    }
}
