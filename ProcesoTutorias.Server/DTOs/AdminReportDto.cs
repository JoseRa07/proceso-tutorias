namespace ProcesoTutorias.Server.DTOs
{
    public class AdminReportDto
    {
        public int TotalUsuarios { get; set; }
        public int TotalAlumnos { get; set; }
        public int TotalTutores { get; set; }
        public int TotalGrupos { get; set; }
        public int TotalTutorias { get; set; }
        public int TutoriasPendientes { get; set; }
        public int TutoriasCompletadas { get; set; }
        public int TutoriasEnEdicion { get; set; }
        public int TotalJustificantes { get; set; }
        public int JustificantesPendientes { get; set; }
        public int JustificantesAprobados { get; set; }
        public int JustificantesRechazados { get; set; }

        public List<GrupoResumenDto> Grupos { get; set; } = new();
        public List<TutorResumenDto> Tutores { get; set; } = new();
        public List<string> Recomendaciones { get; set; } = new();
    }
}
