namespace ProcesoTutorias.Server.DTOs
{
    public class CambiarContraIniRequest
    {
        public int IdUsuario { get; set; }
        public string NuevaContra { get; set; } = null!;
        public string ConfirmarContra { get; set; } = null!;
    }
}
