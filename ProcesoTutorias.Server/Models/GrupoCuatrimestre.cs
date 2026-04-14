using System;
using System.Collections.Generic;

namespace ProcesoTutorias.Server.Models;

public partial class GrupoCuatrimestre
{
    public int IdGrupoCuatrimestre { get; set; }

    public int IdGrupo { get; set; }

    public int IdCuatrimestre { get; set; }

    public bool? Activo { get; set; }

    public virtual Cuatrimestre IdCuatrimestreNavigation { get; set; } = null!;

    public virtual Grupo IdGrupoNavigation { get; set; } = null!;

    public virtual ICollection<Tutorium> Tutoria { get; set; } = new List<Tutorium>();
}
