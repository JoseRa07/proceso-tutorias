using System;
using System.Collections.Generic;

namespace ProcesoTutorias.Server.Models;

public partial class rol
{
    public int id_rol { get; set; }

    public string nombre { get; set; } = null!;

    public virtual ICollection<Usuario> Usuarios { get; set; } = new List<Usuario>();
}
