using System;
using System.Collections.Generic;

namespace ProcesoTutorias.Server.Models;

public partial class Usuario
{
    public int id_usuario { get; set; }

    public string nombre { get; set; } = null!;

    public string apellidos { get; set; } = null!;

    public string correo { get; set; } = null!;

    public string? telefono { get; set; }

    public string contrasena_hash { get; set; } = null!;

    public int id_rol { get; set; }

    public virtual ICollection<Alumno> Alumnos { get; set; } = new List<Alumno>();

    public virtual ICollection<Maestro> Maestros { get; set; } = new List<Maestro>();

    public virtual rol id_rolNavigation { get; set; } = null!;

    public bool req_cambio_contra { get; set; }
}
