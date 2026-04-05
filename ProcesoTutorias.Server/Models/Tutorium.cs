using System;
using System.Collections.Generic;

namespace ProcesoTutorias.Server.Models;

public partial class Tutorium
{
    public int id_tutoria { get; set; }

    public int id_alumno { get; set; }

    public int id_tutor { get; set; }

    public virtual Alumno id_alumnoNavigation { get; set; } = null!;

    public virtual Tutor id_tutorNavigation { get; set; } = null!;

    public virtual ICollection<sesion_tutorium> sesion_tutoria { get; set; } = new List<sesion_tutorium>();
}
