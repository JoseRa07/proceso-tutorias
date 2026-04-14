namespace ProcesoTutorias.Server.Models
{
    public class JustificanteArchivo
    {
        public int id_archivo { get; set; }
        public int id_justificante { get; set; }
        public string url { get; set; } = null!;

        public virtual Justificante Justificante { get; set; } = null!;
    }
}
