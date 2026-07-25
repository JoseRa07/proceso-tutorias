namespace ProcesoTutorias.Server.DTOs;

public class TutorAdminDto
{
    public int IdMaestro { get; set; }
    public int? IdTutor { get; set; }
    public int IdUsuario { get; set; }
    public string NombreCompleto { get; set; } = null!;
    public string Correo { get; set; } = null!;
    public string CodEmpleado { get; set; } = null!;
    public DateOnly Vigencia { get; set; }
    public int TotalGrupos { get; set; }
    public int TotalTutorias { get; set; }
    public bool EsTutor { get; set; }
}

public class TutorGuardarDto
{
    public int IdUsuario { get; set; }
    public string CodEmpleado { get; set; } = null!;
    public DateOnly Vigencia { get; set; }
    public bool ActivarComoTutor { get; set; }
}

public class MaestroActualizarDto
{
    public string CodEmpleado { get; set; } = null!;
    public DateOnly Vigencia { get; set; }
}

public class UsuarioCandidatoTutorDto
{
    public int IdUsuario { get; set; }
    public string NombreCompleto { get; set; } = null!;
    public string Correo { get; set; } = null!;
    public int IdRol { get; set; }
    public string Rol { get; set; } = null!;
}
