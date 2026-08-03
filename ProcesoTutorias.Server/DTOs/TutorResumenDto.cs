namespace ProcesoTutorias.Server.DTOs
{
    public class TutorResumenDto
    {
        public string NombreTutor { get; set; } = null!;
        public int TotalGrupos { get; set; }
        public int TotalAlumnos { get; set; }
        public int TotalTutorias { get; set; }
        public int TutoriasPendientes { get; set; }
    }
}
