using System;
using System.Collections.Generic;

namespace ProcesoTutorias.Server.Models;

public partial class Alumno
{
    public int id_alumno { get; set; }

    public int id_usuario { get; set; }

    public string matricula { get; set; } = null!;

    public int id_grupo { get; set; }

    public virtual ICollection<Justificante> Justificantes { get; set; } = new List<Justificante>();

    public virtual ICollection<Tutorium> Tutoria { get; set; } = new List<Tutorium>();

    public virtual Grupo id_grupoNavigation { get; set; } = null!;

    public virtual Usuario id_usuarioNavigation { get; set; } = null!;
}
