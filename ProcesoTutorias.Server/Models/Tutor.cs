using System;
using System.Collections.Generic;

namespace ProcesoTutorias.Server.Models;

public partial class Tutor
{
    public int IdTutor { get; set; }

    public int IdMaestro { get; set; }

    public virtual ICollection<Grupo> Grupos { get; set; } = new List<Grupo>();

    public virtual Maestro IdMaestroNavigation { get; set; } = null!;

    public virtual ICollection<Tutorium> Tutoria { get; set; } = new List<Tutorium>();
}
