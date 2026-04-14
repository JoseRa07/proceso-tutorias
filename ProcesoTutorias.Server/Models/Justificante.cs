using System;
using System.Collections.Generic;

namespace ProcesoTutorias.Server.Models;

public partial class Justificante
{
    public int IdJustificante { get; set; }

    public int IdAlumno { get; set; }

    public DateOnly Fecha { get; set; }

    public string Descripcion { get; set; } = null!;

    public string Estado { get; set; } = null!;

    public DateTime? FechaRegistro { get; set; }

    public int IdCuatrimestre { get; set; }

    public virtual Alumno IdAlumnoNavigation { get; set; } = null!;

    public virtual Cuatrimestre IdCuatrimestreNavigation { get; set; } = null!;

    public virtual ICollection<JustificanteArchivo> JustificanteArchivos { get; set; } = new List<JustificanteArchivo>();
}
