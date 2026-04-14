using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using ProcesoTutorias.Server.Services;

namespace ProcesoTutorias.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BackupController : ControllerBase
    {
        private readonly IConfiguration _config;

        public BackupController(IConfiguration config)
        {
            _config = config;
        }

        [HttpPost("full")]
        public IActionResult FullBackup()
        {
            return ExecuteBackup("FULL");
        }

        [HttpPost("differential")]
        public IActionResult DifferentialBackup()
        {
            return ExecuteBackup("DIFFERENTIAL");
        }

        [HttpPost("restore")]
        public IActionResult Restore([FromBody] RestoreRequest req)
        {
            string safePath = req.FilePath.Replace("\"", "");

            string sql = $@"
            USE master;

            ALTER DATABASE SistemaTutorias SET SINGLE_USER WITH ROLLBACK IMMEDIATE;

            RESTORE DATABASE SistemaTutorias
            FROM DISK = '{safePath}'
            WITH REPLACE, RECOVERY;

            ALTER DATABASE SistemaTutorias SET MULTI_USER;
            ";

            using var conn = new SqlConnection(_config.GetConnectionString("DefaultConnection"));
            conn.Open();

            using var cmd = new SqlCommand(sql, conn);
            cmd.ExecuteNonQuery();

            return Ok("Restauración completa");
        }

        [HttpPost("schedule")]
        public IActionResult ScheduleBackup([FromBody] ScheduleRequest req)
        {
            BackupScheduler.Register(req.Type, TimeSpan.Parse(req.Time));
            return Ok(new { message = "Respaldo programado" });
        }

        private IActionResult ExecuteBackup(string type)
        {
            string dbName = "SistemaTutorias";

            string folder = "C:\\Respaldos";

            if (!Directory.Exists(folder))
            {
                Directory.CreateDirectory(folder);
            }

            string file = Path.Combine(
                folder,
                $"{dbName}_{type}_{DateTime.Now:yyyyMMdd_HHmmss}.bak"
            );

            string sql = type == "FULL"
                ? $@"BACKUP DATABASE [{dbName}] TO DISK = '{file}' WITH INIT;"
                : $@"BACKUP DATABASE [{dbName}] TO DISK = '{file}' WITH DIFFERENTIAL;";

            using var conn = new SqlConnection(_config.GetConnectionString("DefaultConnection"));
            conn.Open();

            using var cmd = new SqlCommand(sql, conn);
            cmd.ExecuteNonQuery();

            return Ok(new { message = "Backup generado correctamente", file });
        }

        [HttpGet("jobs")]
        public IActionResult GetJobs()
        {
            return Ok(BackupScheduler.GetJobs());
        }
    }

    public class RestoreRequest
    {
        public string FilePath { get; set; }
    }

    public class ScheduleRequest
    {
        public string Type { get; set; }
        public string Time { get; set; }
    }
}