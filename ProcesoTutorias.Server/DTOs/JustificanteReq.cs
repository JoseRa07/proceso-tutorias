namespace ProcesoTutorias.Server.DTOs
{
    public class JustificanteReq
    {
        public DateOnly Fecha { get; set; }
        public string Descripcion { get; set; }
        public List<string>? Archivos { get; set; }
    }
}
