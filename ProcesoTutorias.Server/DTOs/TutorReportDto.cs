namespace ProcesoTutorias.Server.DTOs
{
    public class TutorReportDto
    {
        public string NombreTutor { get; set; }
        public string Grupo { get; set; }

        public List<AlumnoResumenDto> Alumnos { get; set; }
        public List<JustificanteResumenDto> Justificantes { get; set; }
    }
}
