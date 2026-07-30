namespace ProcesoTutorias.Server.DTOs
{
    public class AlumnoReportDto
    {
        public string Nombre { get; set; } = null!;
        public string Matricula { get; set; } = null!;

        public int TotalTutorias { get; set; }
        public int TutoriasPendientes { get; set; }
        public int TutoriasCompletadas { get; set; }
        public int TutoriasEnEdicion { get; set; }
        public int TotalJustificantes { get; set; }
        public int JustificantesPendientes { get; set; }
        public int JustificantesAprobados { get; set; }
        public int JustificantesRechazados { get; set; }
        public string? UltimaTutoria { get; set; }
        public List<string> Recomendaciones { get; set; } = new();
    }
}
