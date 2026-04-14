using System;
using System.Collections.Generic;

namespace ProcesoTutorias.Server.Models;

public partial class Carrera
{
    public int IdCarrera { get; set; }

    public string Nombre { get; set; } = null!;

    public string Siglas { get; set; } = null!;

    public virtual ICollection<Grupo> Grupos { get; set; } = new List<Grupo>();
}
