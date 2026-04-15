using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Hosting;
using ProcesoTutorias.Server.Models;

namespace ProcesoTutorias.Server.Services
{
    public class BackupWorker : BackgroundService
    {
        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                var now = DateTime.Now;

                foreach (var job in BackupScheduler.GetJobs())
                {
                    var jobTime = DateTime.Today.Add(job.Time);

                    if (Math.Abs((jobTime - now).TotalMinutes) < 1)
                    {
                        ExecuteBackup(job.Type);
                    }
                }

                await Task.Delay(30000, stoppingToken);
            }
        }

        private void ExecuteBackup(string type)
        {
            string dbName = "SistemaTutorias";
            string file = $"C:\\Respaldos\\{dbName}_{type}_{DateTime.Now:yyyyMMdd_HHmmss}.bak";

            string sql = type == "FULL"
                ? $@"BACKUP DATABASE [{dbName}] TO DISK = '{file}' WITH INIT;"
                : $@"BACKUP DATABASE [{dbName}] TO DISK = '{file}' WITH DIFFERENTIAL;";

            using var conn = new SqlConnection("Server=localhost;Database=SistemaTutorias;Trusted_Connection=True;TrustServerCertificate=True;");
            conn.Open();

            using var cmd = new SqlCommand(sql, conn);
            cmd.ExecuteNonQuery();
        }
    }
}