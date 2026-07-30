using System;
using System.Collections.Generic;

namespace ProcesoTutorias.Server.Models;

public partial class Usuario
{
    public int IdUsuario { get; set; }

    public string Nombre { get; set; } = null!;

    public string Apellidos { get; set; } = null!;

    public string Correo { get; set; } = null!;

    public string? Telefono { get; set; }

    public string ContrasenaHash { get; set; } = null!;

    public int IdRol { get; set; }

    public bool ReqCambioContra { get; set; }

    public int SessionVersion { get; set; }

    public virtual ICollection<AuthSession> AuthSessions { get; set; } = new List<AuthSession>();

    public virtual ICollection<Alumno> Alumnos { get; set; } = new List<Alumno>();

    public virtual Rol IdRolNavigation { get; set; } = null!;

    public virtual ICollection<Maestro> Maestros { get; set; } = new List<Maestro>();
}
