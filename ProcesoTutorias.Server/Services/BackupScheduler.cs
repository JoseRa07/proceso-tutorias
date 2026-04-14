using ProcesoTutorias.Server.Models;
using System.Collections.Generic;

namespace ProcesoTutorias.Server.Services
{
    public static class BackupScheduler
    {
        private static List<BackupJob> jobs = new();

        public static void Register(string type, TimeSpan time)
        {
            jobs.Add(new BackupJob
            {
                Type = type,
                Time = time
            });
        }

        public static List<BackupJob> GetJobs()
        {
            return jobs;
        }
    }
}