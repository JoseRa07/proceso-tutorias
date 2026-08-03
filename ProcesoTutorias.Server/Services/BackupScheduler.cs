using ProcesoTutorias.Server.Models;

namespace ProcesoTutorias.Server.Services
{
    public static class BackupScheduler
    {
        private static readonly object LockObject = new();
        private static readonly List<BackupJob> Jobs = new();

        public static BackupJob Register(string type, DateTime scheduledAt)
        {
            var job = new BackupJob
            {
                Type = NormalizeType(type),
                ScheduledAt = scheduledAt
            };

            lock (LockObject)
            {
                Jobs.Add(job);
            }

            return job;
        }

        public static List<BackupJob> GetJobs()
        {
            lock (LockObject)
            {
                return Jobs
                    .OrderByDescending(j => j.CreatedAt)
                    .Select(Clone)
                    .ToList();
            }
        }

        public static List<BackupJob> GetDueJobs(DateTime now)
        {
            lock (LockObject)
            {
                var dueJobs = Jobs
                    .Where(j => j.Status == "PENDIENTE" && j.ScheduledAt <= now)
                    .ToList();

                foreach (var job in dueJobs)
                    job.Status = "EN_PROCESO";

                return dueJobs.Select(Clone).ToList();
            }
        }

        public static void MarkCompleted(Guid id, string file)
        {
            lock (LockObject)
            {
                var job = Jobs.FirstOrDefault(j => j.Id == id);
                if (job == null) return;

                job.Status = "COMPLETADO";
                job.ExecutedAt = DateTime.Now;
                job.File = file;
                job.Error = null;
            }
        }

        public static void MarkFailed(Guid id, string error)
        {
            lock (LockObject)
            {
                var job = Jobs.FirstOrDefault(j => j.Id == id);
                if (job == null) return;

                job.Status = "ERROR";
                job.ExecutedAt = DateTime.Now;
                job.Error = error;
            }
        }

        private static BackupJob Clone(BackupJob job)
        {
            return new BackupJob
            {
                Id = job.Id,
                Type = job.Type,
                ScheduledAt = job.ScheduledAt,
                CreatedAt = job.CreatedAt,
                ExecutedAt = job.ExecutedAt,
                Status = job.Status,
                File = job.File,
                Error = job.Error
            };
        }

        private static string NormalizeType(string type)
        {
            string normalized = (type ?? string.Empty).Trim().ToUpperInvariant();
            return normalized is "FULL" or "COMPLETO"
                ? "COMPLETO"
                : "INCREMENTAL";
        }
    }
}
