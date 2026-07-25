namespace ProcesoTutorias.Server.DTOs
{
    public class MaestroReportDto
    {
        public string Nombre { get; set; } = null!;
        public string Mensaje { get; set; } = null!;

        public bool EsTutor { get; set; }
        public int TotalAlumnos { get; set; }
        public int TotalTutorias { get; set; }
        public int TutoriasPendientes { get; set; }
        public int TutoriasCompletadas { get; set; }
        public int TotalGrupos { get; set; }
        public List<string> Recomendaciones { get; set; } = new();
    }
}
