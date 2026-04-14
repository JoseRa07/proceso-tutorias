using System;
using System.Collections.Generic;

namespace ProcesoTutorias.Server.Models;

public partial class JustificanteArchivo
{
    public int IdArchivo { get; set; }

    public int IdJustificante { get; set; }

    public string Url { get; set; } = null!;

    public virtual Justificante IdJustificanteNavigation { get; set; } = null!;
}
