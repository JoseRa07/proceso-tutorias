namespace ProcesoTutorias.Server.DTOs
{
    public class JustificanteDto
    {
        public int IdJustificante { get; set; }
        public DateOnly Fecha { get; set; }
        public string Descripcion { get; set; } = null!;
        public string Estado { get; set; } = null!;
    }
}
