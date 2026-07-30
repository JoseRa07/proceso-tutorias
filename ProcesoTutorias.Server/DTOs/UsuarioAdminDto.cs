namespace ProcesoTutorias.Server.DTOs;

public class UsuarioAdminDto
{
    public int IdUsuario { get; set; }
    public string Nombre { get; set; } = null!;
    public string Apellidos { get; set; } = null!;
    public string Correo { get; set; } = null!;
    public string? Telefono { get; set; }
    public int IdRol { get; set; }
    public string Rol { get; set; } = null!;
    public bool ReqCambioContra { get; set; }
}

public class UsuarioGuardarDto
{
    public string Nombre { get; set; } = null!;
    public string Apellidos { get; set; } = null!;
    public string Correo { get; set; } = null!;
    public string? Telefono { get; set; }
    public int IdRol { get; set; }
    public string? ContrasenaInicial { get; set; }
}

public class UsuarioContrasenaDto
{
    public string ContrasenaInicial { get; set; } = null!;
}
