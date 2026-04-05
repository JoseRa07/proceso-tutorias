using System;
using System.Collections.Generic;

namespace ProcesoTutorias.Server.Models;

public partial class Justificante
{
    public int id_justificante { get; set; }

    public int id_alumno { get; set; }

    public DateOnly fecha { get; set; }

    public string descripcion { get; set; } = null!;

    public string estado { get; set; } = null!;

    public DateTime? fecha_registro { get; set; }

    public string? url_archivo { get; set; }

    public virtual Alumno id_alumnoNavigation { get; set; } = null!;
}
