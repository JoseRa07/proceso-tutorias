using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using ProcesoTutorias.Server.Services;
using System.Diagnostics;
using System.Text;

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

            if (!System.IO.File.Exists(safePath))
                return BadRequest("El archivo no existe");

            string script = System.IO.File.ReadAllText(safePath);

            var batches = script.Split(
                new[] { "\r\nGO\r\n", "\nGO\n", "\rGO\r" },
                StringSplitOptions.RemoveEmptyEntries
            );

            using var conn = new SqlConnection(
                "Server=localhost;Database=master;Trusted_Connection=True;TrustServerCertificate=True;"
            );
            conn.Open();

            foreach (var batch in batches)
            {
                using var cmd = new SqlCommand(batch, conn);
                cmd.CommandTimeout = 0;
                cmd.ExecuteNonQuery();
            }

            return Ok("Restauración desde .sql completada correctamente");
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

            string folder = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.Desktop),
                "Respaldos"
            );

            if (!Directory.Exists(folder))
                Directory.CreateDirectory(folder);

            string file = Path.Combine(
                folder,
                $"{dbName}_{type}_{DateTime.Now:yyyyMMdd_HHmmss}.sql"
            );

            string connectionString = _config.GetConnectionString("DefaultConnection");
            var builder = new SqlConnectionStringBuilder(connectionString);

            string server = builder.DataSource;
            string database = builder.InitialCatalog;

            string auth = builder.IntegratedSecurity
                ? "-E"
                : $"-U {builder.UserID} -P {builder.Password}";

            string query = $@"
SET NOCOUNT ON;

PRINT 'CREATE DATABASE [{database}]';
PRINT 'GO';
PRINT 'USE [{database}]';
PRINT 'GO';

DECLARE @table NVARCHAR(256);

DECLARE table_cursor CURSOR FOR
SELECT TABLE_SCHEMA + '.' + TABLE_NAME
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE';

OPEN table_cursor;
FETCH NEXT FROM table_cursor INTO @table;

WHILE @@FETCH_STATUS = 0
BEGIN
    PRINT '---------------------------------';
    PRINT 'TABLA: ' + @table;

    DECLARE @createTable NVARCHAR(MAX) = 'CREATE TABLE ' + @table + ' (';

    SELECT @createTable = @createTable +
        COLUMN_NAME + ' ' +
        DATA_TYPE +
        CASE 
            WHEN CHARACTER_MAXIMUM_LENGTH IS NOT NULL 
            THEN '(' + 
                CASE 
                    WHEN CHARACTER_MAXIMUM_LENGTH = -1 THEN 'MAX'
                    ELSE CAST(CHARACTER_MAXIMUM_LENGTH AS VARCHAR)
                END + ')'
            ELSE ''
        END + ',' 
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = PARSENAME(@table,1);

    SET @createTable = LEFT(@createTable, LEN(@createTable)-1) + ')';

    PRINT @createTable;
    PRINT 'GO';

    DECLARE @sql NVARCHAR(MAX) = 'SELECT ''INSERT INTO ' + @table + ' VALUES ('' + ';

    SELECT @sql = @sql + 
        STRING_AGG(
            'ISNULL('''''''' + REPLACE(CAST(' + COLUMN_NAME + ' AS NVARCHAR(MAX)), '''''''', '''''''''''') + '''''''',''NULL'')',
            ' + '','' + '
        )
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = PARSENAME(@table,1);

    SET @sql = @sql + ' + '')'' FROM ' + @table;

    EXEC(@sql);

    PRINT 'GO';

    FETCH NEXT FROM table_cursor INTO @table;
END;

CLOSE table_cursor;
DEALLOCATE table_cursor;
";

            var process = new Process();
            process.StartInfo.FileName = "sqlcmd";
            process.StartInfo.Arguments = $"-S {server} -d {database} {auth} -C -Q \"{query}\" -o \"{file}\"";
            process.StartInfo.RedirectStandardOutput = true;
            process.StartInfo.RedirectStandardError = true;
            process.StartInfo.UseShellExecute = false;
            process.StartInfo.CreateNoWindow = true;

            process.Start();

            string output = process.StandardOutput.ReadToEnd();
            string error = process.StandardError.ReadToEnd();

            process.WaitForExit();

            if (!System.IO.File.Exists(file))
            {
                return BadRequest(new
                {
                    message = "No se creó el archivo",
                    error
                });
            }

            return Ok(new
            {
                message = "Backup SQL generado correctamente",
                file,
                output,
                error
            });
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