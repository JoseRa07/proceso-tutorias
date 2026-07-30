namespace ProcesoTutorias.Server.DTOs;

public class RolAdminDto
{
    public int IdRol { get; set; }
    public string Nombre { get; set; } = null!;
    public int TotalUsuarios { get; set; }
}

public class RolGuardarDto
{
    public string Nombre { get; set; } = null!;
}
