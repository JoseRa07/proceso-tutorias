namespace ProcesoTutorias.Server.DTOs
{
    public class GrupoResumenDto
    {
        public string Grupo { get; set; } = null!;
        public string Carrera { get; set; } = null!;
        public int TotalAlumnos { get; set; }
        public int TotalTutorias { get; set; }
        public int TutoriasPendientes { get; set; }
        public int TutoriasCompletadas { get; set; }
        public int TutoriasEnEdicion { get; set; }
        public int TotalJustificantes { get; set; }
        public int JustificantesPendientes { get; set; }
        public int JustificantesAprobados { get; set; }
        public int JustificantesRechazados { get; set; }
    }
}
