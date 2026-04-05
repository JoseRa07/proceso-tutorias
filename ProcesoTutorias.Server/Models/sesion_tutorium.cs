using System;
using System.Collections.Generic;

namespace ProcesoTutorias.Server.Models;

public partial class sesion_tutorium
{
    public int id_sesion { get; set; }

    public int id_tutoria { get; set; }

    public DateOnly fecha { get; set; }

    public TimeOnly hora_ini { get; set; }

    public TimeOnly hora_fin { get; set; }

    public string motivo { get; set; } = null!;

    public string? pts_relevantes { get; set; }

    public string? compromisos_acuerdos { get; set; }

    public string estado { get; set; } = null!;

    public virtual Tutorium id_tutoriaNavigation { get; set; } = null!;
}
