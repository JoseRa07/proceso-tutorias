using System;
using System.Collections.Generic;

namespace ProcesoTutorias.Server.Models;

public partial class Grupo
{
    public int id_grupo { get; set; }

    public string nombre_grupo { get; set; } = null!;

    public int? id_tutor { get; set; }

    public int id_carrera { get; set; }

    public virtual ICollection<Alumno> Alumnos { get; set; } = new List<Alumno>();

    public virtual Carrera id_carreraNavigation { get; set; } = null!;

    public virtual Tutor? id_tutorNavigation { get; set; }
}
