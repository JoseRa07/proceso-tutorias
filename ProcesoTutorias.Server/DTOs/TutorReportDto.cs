namespace ProcesoTutorias.Server.DTOs
{
    public class TutorReportDto
    {
        public string NombreTutor { get; set; } = null!;
        public string? Grupo { get; set; }
        public int TotalAlumnos { get; set; }
        public int TotalTutorias { get; set; }
        public int TutoriasPendientes { get; set; }
        public int TutoriasCompletadas { get; set; }
        public int TutoriasEnEdicion { get; set; }
        public int TotalJustificantes { get; set; }
        public int JustificantesPendientes { get; set; }
        public int JustificantesAprobados { get; set; }
        public int JustificantesRechazados { get; set; }

        public List<AlumnoResumenDto> Alumnos { get; set; } = new();
        public List<JustificanteResumenDto> Justificantes { get; set; } = new();
        public List<string> Recomendaciones { get; set; } = new();
    }
}
