using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using ProcesoTutorias.Server.Models;

namespace ProcesoTutorias.Server.Services;

public static class DatabaseSchemaInitializer
{
    private static readonly string[] RequiredScripts =
    [
        "20260727_add_auth_sessions.sql",
        "20260728_add_audit_log.sql"
    ];

    public static async Task ApplyAsync(IServiceProvider services)
    {
        using IServiceScope scope = services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<SistemaTutoriasContext>();
        var logger = scope.ServiceProvider
            .GetRequiredService<ILoggerFactory>()
            .CreateLogger(nameof(DatabaseSchemaInitializer));

        foreach (string fileName in RequiredScripts)
        {
            string path = Path.Combine(AppContext.BaseDirectory, "Database", fileName);
            if (!File.Exists(path))
            {
                throw new FileNotFoundException(
                    $"No se encontró el script requerido de base de datos: {fileName}",
                    path);
            }

            string script = await File.ReadAllTextAsync(path);
            string[] batches = Regex.Split(
                script,
                @"^\s*GO\s*(?:--.*)?$",
                RegexOptions.Multiline | RegexOptions.IgnoreCase);

            foreach (string batch in batches)
            {
                string command = batch.Trim();
                if (string.IsNullOrWhiteSpace(command) ||
                    command.StartsWith("USE ", StringComparison.OrdinalIgnoreCase) ||
                    command.StartsWith("--", StringComparison.Ordinal))
                {
                    continue;
                }

                await context.Database.ExecuteSqlRawAsync(command);
            }

            logger.LogInformation(
                "Esquema verificado mediante el script {DatabaseScript}.",
                fileName);
        }
    }
}
