namespace ProcesoTutorias.Server.Models
{
    public class BackupJob
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string Type { get; set; } = "";
        public DateTime ScheduledAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public DateTime? ExecutedAt { get; set; }
        public string Status { get; set; } = "PENDIENTE";
        public string? File { get; set; }
        public string? Error { get; set; }
    }
}
