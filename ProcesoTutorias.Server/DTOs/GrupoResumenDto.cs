namespace ProcesoTutorias.Server.DTOs
{
    public class GrupoResumenDto
    {
        public string Grupo { get; set; } = null!;
        public int TotalAlumnos { get; set; }
        public int TotalTutorias { get; set; }
        public int TutoriasPendientes { get; set; }
        public int TotalJustificantes { get; set; }
    }
}
