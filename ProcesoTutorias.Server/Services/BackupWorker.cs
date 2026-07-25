namespace ProcesoTutorias.Server.Services
{
    public class BackupWorker : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<BackupWorker> _logger;

        public BackupWorker(IServiceScopeFactory scopeFactory, ILogger<BackupWorker> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            using var timer = new PeriodicTimer(TimeSpan.FromSeconds(5));

            while (await timer.WaitForNextTickAsync(stoppingToken))
            {
                var dueJobs = BackupScheduler.GetDueJobs(DateTime.Now);

                foreach (var job in dueJobs)
                {
                    try
                    {
                        using var scope = _scopeFactory.CreateScope();
                        var backupService = scope.ServiceProvider.GetRequiredService<LogicalBackupService>();
                        var result = await backupService.CreateBackupAsync(job.Type, stoppingToken);
                        BackupScheduler.MarkCompleted(job.Id, result.File);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error al ejecutar respaldo programado {JobId}", job.Id);
                        BackupScheduler.MarkFailed(job.Id, "No se pudo ejecutar el respaldo programado.");
                    }
                }
            }
        }
    }
}
