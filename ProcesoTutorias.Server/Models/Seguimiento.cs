namespace ProcesoTutorias.Server.Models;

public class Seguimiento
{
    public int IdSeguimiento { get; set; }

    public int IdAlumno { get; set; }

    public int IdTutor { get; set; }

    public string Titulo { get; set; } = null!;

    public string? Descripcion { get; set; }

    public string Estado { get; set; } = "ACTIVO";

    public DateTime FechaCreacion { get; set; }

    public DateTime FechaActualizacion { get; set; }

    public virtual Alumno IdAlumnoNavigation { get; set; } = null!;

    public virtual Tutor IdTutorNavigation { get; set; } = null!;

    public virtual ICollection<SesionTutorium> SesionTutoria { get; set; } = new List<SesionTutorium>();
}
