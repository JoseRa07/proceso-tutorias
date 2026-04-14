using System;
using System.Collections.Generic;

namespace ProcesoTutorias.Server.Models;

public partial class Maestro
{
    public int IdMaestro { get; set; }

    public int IdUsuario { get; set; }

    public string CodEmpleado { get; set; } = null!;

    public DateOnly Vigencia { get; set; }

    public virtual Usuario IdUsuarioNavigation { get; set; } = null!;

    public virtual ICollection<Tutor> Tutors { get; set; } = new List<Tutor>();
}
