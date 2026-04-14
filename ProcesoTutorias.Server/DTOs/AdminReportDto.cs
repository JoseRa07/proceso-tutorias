namespace ProcesoTutorias.Server.DTOs
{
    public class AdminReportDto
    {
        public int TotalUsuarios { get; set; }
        public int TotalTutorias { get; set; }
        public int TotalJustificantes { get; set; }

        public List<GrupoResumenDto> Grupos { get; set; }
        public List<TutorResumenDto> Tutores { get; set; }
    }
}
