namespace ProcesoTutorias.Server.DTOs
{
    public class AlumnoResumenDto
    {
        public string Matricula { get; set; } = null!;
        public string? Nombre { get; set; }
        public int TotalTutorias { get; set; }
        public int TutoriasPendientes { get; set; }
        public int TutoriasCompletadas { get; set; }
        public int TotalJustificantes { get; set; }
    }
}
