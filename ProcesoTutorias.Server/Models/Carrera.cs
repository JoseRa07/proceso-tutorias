using System;
using System.Collections.Generic;

namespace ProcesoTutorias.Server.Models;

public partial class Carrera
{
    public int id_carrera { get; set; }

    public string nombre { get; set; } = null!;

    public string siglas { get; set; } = null!;

    public virtual ICollection<Grupo> Grupos { get; set; } = new List<Grupo>();
}
