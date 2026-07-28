namespace ProcesoTutorias.Server.Models;

public sealed class AuditLog
{
    public long IdAuditLog { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public int? ActorUserId { get; set; }
    public string? ActorEmail { get; set; }
    public string? ActorRole { get; set; }
    public string Action { get; set; } = null!;
    public string Entity { get; set; } = null!;
    public string? EntityId { get; set; }
    public string? Detail { get; set; }
    public string? IpAddress { get; set; }
}
