namespace ProcesoTutorias.Server.DTOs
{
    public class SesionTutoriaDto
    {
        public int IdSesion { get; set; }
        public DateOnly Fecha { get; set; }
        public string HoraIni { get; set; } = string.Empty;
        public string HoraFin { get; set; } = string.Empty;
        public string Motivo { get; set; } = null!;
        public string Pts { get; set; } = null!;
        public string Acuerdos { get; set; } = null!;
        public string? Estado { get; set; } = null!;

        public int IdAlumno { get; set; }
        public string? NombreAlumno { get; set; } = null!;
    }
}
