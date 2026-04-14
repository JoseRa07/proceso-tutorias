namespace ProcesoTutorias.Server.DTOs
{
    public class AlumnoReportDto
    {
        public string Nombre { get; set; }
        public string Matricula { get; set; }

        public int TotalTutorias { get; set; }
        public int TotalJustificantes { get; set; }
    }
}
