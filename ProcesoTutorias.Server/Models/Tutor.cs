using System;
using System.Collections.Generic;

namespace ProcesoTutorias.Server.Models;

public partial class Tutor
{
    public int id_tutor { get; set; }

    public int id_maestro { get; set; }

    public virtual ICollection<Grupo> Grupos { get; set; } = new List<Grupo>();

    public virtual ICollection<Tutorium> Tutoria { get; set; } = new List<Tutorium>();

    public virtual Maestro id_maestroNavigation { get; set; } = null!;
}
