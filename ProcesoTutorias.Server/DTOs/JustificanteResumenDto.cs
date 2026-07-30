namespace ProcesoTutorias.Server.DTOs
{
    public class JustificanteResumenDto
    {
        public string Matricula { get; set; } = null!;
        public string? Nombre { get; set; }
        public int Total { get; set; }
        public int Pendientes { get; set; }
        public int Aprobados { get; set; }
        public int Rechazados { get; set; }
    }
}
