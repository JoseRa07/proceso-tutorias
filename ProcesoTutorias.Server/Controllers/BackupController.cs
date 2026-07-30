using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProcesoTutorias.Server.Models;
using ProcesoTutorias.Server.Services;

namespace ProcesoTutorias.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "ADMIN")]
public class BackupController : ControllerBase
{
    private readonly LogicalBackupService _backupService;

    public BackupController(LogicalBackupService backupService)
    {
        _backupService = backupService;
    }

    [HttpPost("full")]
    public async Task<ActionResult<BackupResult>> FullBackup(CancellationToken cancellationToken)
    {
        var result = await _backupService.CreateBackupAsync("COMPLETO", cancellationToken);
        return Ok(result);
    }

    [HttpPost("incremental")]
    public async Task<ActionResult<BackupResult>> IncrementalBackup(CancellationToken cancellationToken)
    {
        var result = await _backupService.CreateBackupAsync("INCREMENTAL", cancellationToken);
        return Ok(result);
    }

    [HttpPost("differential")]
    public async Task<ActionResult<BackupResult>> DifferentialBackup(CancellationToken cancellationToken)
    {
        var result = await _backupService.CreateBackupAsync("INCREMENTAL", cancellationToken);
        return Ok(result);
    }

    [HttpPost("restore")]
    public async Task<ActionResult<RestoreResult>> Restore([FromBody] RestoreRequest? req, CancellationToken cancellationToken)
    {
        if (req == null || string.IsNullOrWhiteSpace(req.FilePath))
            return BadRequest(new { message = "[BACKUP_RUTA_REQUERIDA] Selecciona un archivo de respaldo." });

        try
        {
            var result = await _backupService.RestoreBackupAsync(req.FilePath, cancellationToken);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new
            {
                message = "[BACKUP_RESTAURACION_ERROR] No se pudo restaurar el respaldo lógico.",
                detail = ex.Message
            });
        }
    }

    [HttpPost("schedule")]
    public ActionResult ScheduleBackup([FromBody] ScheduleRequest req)
    {
        if (req == null)
            return BadRequest(new { message = "[BACKUP_PROGRAMACION_REQUERIDA] Indica la fecha, hora y tipo de respaldo." });
        if (req.Type is not ("COMPLETO" or "INCREMENTAL"))
            return BadRequest(new { message = "[BACKUP_TIPO_INVALIDO] Selecciona un tipo de respaldo válido." });
        if (string.IsNullOrWhiteSpace(req.ScheduledAt) || req.ScheduledAt.Length > 35)
            return BadRequest(new { message = "[BACKUP_FECHA_INVALIDA] La fecha y hora programada no es válida." });

        if (!DateTime.TryParse(req.ScheduledAt, out DateTime scheduledAt))
            return BadRequest(new { message = "[BACKUP_FECHA_INVALIDA] La fecha y hora programada no es válida." });

        if (scheduledAt <= DateTime.Now)
            return BadRequest(new { message = "[BACKUP_FECHA_PASADA] La programación debe ser posterior a la hora actual." });

        var job = BackupScheduler.Register(req.Type, scheduledAt);
        return Ok(new { message = "Respaldo programado correctamente.", job });
    }

    [HttpGet("jobs")]
    public ActionResult<IEnumerable<BackupJob>> GetJobs()
    {
        return Ok(BackupScheduler.GetJobs());
    }

    [HttpGet("files")]
    public ActionResult<IEnumerable<BackupFileInfo>> GetFiles()
    {
        return Ok(_backupService.ListBackups());
    }
}

public class RestoreRequest
{
    public string FilePath { get; set; } = "";
}

public class ScheduleRequest
{
    public string Type { get; set; } = "";
    public string ScheduledAt { get; set; } = "";
}
