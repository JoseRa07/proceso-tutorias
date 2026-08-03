namespace ProcesoTutorias.Server.Models;

public class AuthSession
{
    public Guid IdSession { get; set; }
    public int IdUsuario { get; set; }
    public int SessionVersion { get; set; }
    public string Jti { get; set; } = null!;
    public string RefreshTokenHash { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
    public DateTime ExpiresAt { get; set; }
    public DateTime? RevokedAt { get; set; }
    public virtual Usuario IdUsuarioNavigation { get; set; } = null!;
}
