using System;
using System.Collections.Generic;

namespace ProcesoTutorias.Server.Models;

public partial class Alumno
{
    public int IdAlumno { get; set; }

    public int IdUsuario { get; set; }

    public string Matricula { get; set; } = null!;

    public int IdGrupo { get; set; }

    public virtual Grupo IdGrupoNavigation { get; set; } = null!;

    public virtual Usuario IdUsuarioNavigation { get; set; } = null!;

    public virtual ICollection<Justificante> Justificantes { get; set; } = new List<Justificante>();

    public virtual ICollection<Seguimiento> Seguimientos { get; set; } = new List<Seguimiento>();

    public virtual ICollection<Tutorium> Tutoria { get; set; } = new List<Tutorium>();
}
