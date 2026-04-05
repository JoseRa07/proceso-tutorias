using System;
using System.Collections.Generic;

namespace ProcesoTutorias.Server.Models;

public partial class Maestro
{
    public int id_maestro { get; set; }

    public int id_usuario { get; set; }

    public string cod_empleado { get; set; } = null!;

    public DateOnly vigencia { get; set; }

    public virtual ICollection<Tutor> Tutors { get; set; } = new List<Tutor>();

    public virtual Usuario id_usuarioNavigation { get; set; } = null!;
}
