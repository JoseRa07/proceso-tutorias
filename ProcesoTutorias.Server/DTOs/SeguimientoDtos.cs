namespace ProcesoTutorias.Server.DTOs;

public class SeguimientoAlumnoResumenDto
{
    public int IdAlumno { get; set; }

    public string NombreAlumno { get; set; } = null!;

    public string Matricula { get; set; } = null!;

    public string Grupo { get; set; } = null!;

    public int TotalSeguimientos { get; set; }

    public int SeguimientosActivos { get; set; }

    public DateTime UltimaActividad { get; set; }
}

public class SeguimientoResumenDto
{
    public int IdSeguimiento { get; set; }

    public int IdAlumno { get; set; }

    public string Titulo { get; set; } = null!;

    public string? Descripcion { get; set; }

    public string Estado { get; set; } = null!;

    public DateTime FechaCreacion { get; set; }

    public DateTime FechaActualizacion { get; set; }

    public int TotalTutorias { get; set; }

    public DateOnly? UltimaTutoria { get; set; }
}

public class SesionSeguimientoDto
{
    public int IdSesion { get; set; }

    public DateOnly Fecha { get; set; }

    public string Motivo { get; set; } = null!;

    public string Estado { get; set; } = null!;
}

public class SeguimientoEstadoRequest
{
    public string Estado { get; set; } = null!;
}

public class VincularSeguimientoRequest
{
    public int? IdSeguimiento { get; set; }

    public string? Titulo { get; set; }

    public string? Descripcion { get; set; }

    public bool Quitar { get; set; }
}
