using System;
using System.Collections.Generic;
using System.Text.Json.Serialization; 

namespace ProcesoTutorias.Server.Models;

public partial class Maestro
{
    public int id_maestro { get; set; }

    public int id_usuario { get; set; }

    public string cod_empleado { get; set; } = null!;

    public DateOnly vigencia { get; set; }

    [JsonIgnore] 
    public virtual ICollection<Tutor> Tutors { get; set; } = new List<Tutor>();

    [JsonIgnore] 
    public virtual Usuario? id_usuarioNavigation { get; set; }
}