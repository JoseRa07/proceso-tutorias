namespace ProcesoTutorias.Server.DTOs
{
    public class TutoriaDto
    {
        public int IdSesion { get; set; }
        public DateOnly Fecha { get; set; }
        public TimeOnly HoraIni { get; set; }
        public TimeOnly HoraFin { get; set; }
        public string Motivo { get; set; } = null!;
        public string Estado { get; set; } = null!;
    }
}
