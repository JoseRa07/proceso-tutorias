using System;
using System.Collections.Generic;

namespace ProcesoTutorias.Server.Models;

public partial class Cuatrimestre
{
    public int IdCuatrimestre { get; set; }

    public string Nombre { get; set; } = null!;

    public bool Activo { get; set; }

    public virtual ICollection<GrupoCuatrimestre> GrupoCuatrimestres { get; set; } = new List<GrupoCuatrimestre>();

    public virtual ICollection<Justificante> Justificantes { get; set; } = new List<Justificante>();
}
