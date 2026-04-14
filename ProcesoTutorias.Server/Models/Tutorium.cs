using System;
using System.Collections.Generic;

namespace ProcesoTutorias.Server.Models;

public partial class Tutorium
{
    public int IdTutoria { get; set; }

    public int IdAlumno { get; set; }

    public int IdTutor { get; set; }

    public int IdGrupoCuatrimestre { get; set; }

    public virtual Alumno IdAlumnoNavigation { get; set; } = null!;

    public virtual GrupoCuatrimestre IdGrupoCuatrimestreNavigation { get; set; } = null!;

    public virtual Tutor IdTutorNavigation { get; set; } = null!;

    public virtual ICollection<SesionTutorium> SesionTutoria { get; set; } = new List<SesionTutorium>();
}
