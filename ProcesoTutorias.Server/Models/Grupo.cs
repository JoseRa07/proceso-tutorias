using System;
using System.Collections.Generic;

namespace ProcesoTutorias.Server.Models;

public partial class Grupo
{
    public int IdGrupo { get; set; }

    public string NombreGrupo { get; set; } = null!;

    public int? IdTutor { get; set; }

    public int IdCarrera { get; set; }

    public virtual ICollection<Alumno> Alumnos { get; set; } = new List<Alumno>();

    public virtual ICollection<GrupoCuatrimestre> GrupoCuatrimestres { get; set; } = new List<GrupoCuatrimestre>();

    public virtual Carrera IdCarreraNavigation { get; set; } = null!;

    public virtual Tutor? IdTutorNavigation { get; set; }
}
