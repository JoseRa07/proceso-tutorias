using System;
using System.Collections.Generic;

namespace ProcesoTutorias.Server.Models;

public partial class SesionTutorium
{
    public int IdSesion { get; set; }

    public int IdTutoria { get; set; }

    public DateOnly Fecha { get; set; }

    public TimeOnly HoraIni { get; set; }

    public TimeOnly HoraFin { get; set; }

    public string Motivo { get; set; } = null!;

    public string? PtsRelevantes { get; set; }

    public string? CompromisosAcuerdos { get; set; }

    public string Estado { get; set; } = null!;

    public int? IdSeguimiento { get; set; }

    public virtual Seguimiento? IdSeguimientoNavigation { get; set; }

    public virtual Tutorium IdTutoriaNavigation { get; set; } = null!;
}
