using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using ProcesoTutorias.Server.Validation;
using Microsoft.Data.SqlClient;

namespace ProcesoTutorias.Server.Services;

public class LogicalBackupService
{
    private const string DatabaseName = "SistemaTutorias";
    private const string BackupFolder = @"C:\Respaldos";
    private readonly IConfiguration _configuration;

    public LogicalBackupService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public async Task<BackupResult> CreateBackupAsync(string type, CancellationToken cancellationToken = default)
    {
        string normalizedType = NormalizeType(type);
        Directory.CreateDirectory(BackupFolder);

        LogicalBackupFile? previousBackup = normalizedType == "INCREMENTAL"
            ? await ReadLatestBackupManifestAsync(cancellationToken)
            : null;

        var backup = new LogicalBackupFile
        {
            Version = 1,
            Type = normalizedType,
            CreatedAt = DateTime.Now,
            SourceDatabase = DatabaseName,
            SinceBackupFile = previousBackup?.FileName
        };

        await using var connection = new SqlConnection(GetConnectionString());
        await connection.OpenAsync(cancellationToken);

        var tables = await GetTablesAsync(connection, cancellationToken);
        var previousHashes = previousBackup?.Tables.ToDictionary(
            t => t.FullName,
            t => t.RowHashes,
            StringComparer.OrdinalIgnoreCase) ?? new Dictionary<string, Dictionary<string, string>>(StringComparer.OrdinalIgnoreCase);

        foreach (var table in tables)
        {
            var rows = await ReadTableRowsAsync(connection, table, cancellationToken);
            var currentHashes = new Dictionary<string, string>();
            var rowsToStore = new List<Dictionary<string, object?>>();

            foreach (var row in rows)
            {
                string rowKey = BuildRowKey(table.PrimaryKey, row);
                string rowHash = ComputeRowHash(row);
                currentHashes[rowKey] = rowHash;

                bool includeRow = normalizedType == "COMPLETO"
                    || !previousHashes.TryGetValue(table.FullName, out var tableHashes)
                    || !tableHashes.TryGetValue(rowKey, out string? previousHash)
                    || previousHash != rowHash;

                if (includeRow)
                    rowsToStore.Add(row);
            }

            backup.Tables.Add(new LogicalBackupTable
            {
                Schema = table.Schema,
                Name = table.Name,
                PrimaryKey = table.PrimaryKey,
                Columns = table.Columns.Select(c => c.Name).ToList(),
                RowHashes = currentHashes,
                Rows = rowsToStore
            });
        }

        string fileName = $"{DatabaseName}_{normalizedType}_{DateTime.Now:yyyyMMdd_HHmmss}.json";
        string filePath = Path.Combine(BackupFolder, fileName);
        backup.FileName = fileName;

        var options = new JsonSerializerOptions
        {
            WriteIndented = true,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };
        await File.WriteAllTextAsync(filePath, JsonSerializer.Serialize(backup, options), cancellationToken);

        return new BackupResult
        {
            Message = "Respaldo generado correctamente.",
            File = filePath,
            Type = normalizedType,
            Tables = backup.Tables.Count,
            Rows = backup.Tables.Sum(t => t.Rows.Count),
            SinceBackupFile = backup.SinceBackupFile
        };
    }

    public async Task<RestoreResult> RestoreBackupAsync(string filePath, CancellationToken cancellationToken = default)
    {
        string safePath = ValidateBackupPath(filePath);

        await using var connection = new SqlConnection(GetConnectionString());
        await connection.OpenAsync(cancellationToken);

        var currentTables = await GetTablesAsync(connection, cancellationToken);
        var tableLookup = currentTables.ToDictionary(t => t.FullName, StringComparer.OrdinalIgnoreCase);

        await using var transaction = (SqlTransaction)await connection.BeginTransactionAsync(cancellationToken);

        try
        {
            var json = await File.ReadAllTextAsync(safePath, cancellationToken);
            using var document = JsonDocument.Parse(json);
            var tablesElement = document.RootElement.GetProperty("tables");

            var result = new RestoreResult
            {
                Message = "Restauración lógica completada.",
                File = safePath
            };

            foreach (var tableElement in tablesElement.EnumerateArray())
            {
                string schema = tableElement.GetProperty("schema").GetString() ?? "dbo";
                string name = tableElement.GetProperty("name").GetString() ?? "";
                string fullName = $"{schema}.{name}";

                if (!tableLookup.TryGetValue(fullName, out var table))
                {
                    result.TablesSkipped++;
                    result.Warnings.Add($"La tabla {fullName} no existe en la base actual y fue omitida.");
                    continue;
                }

                var rowsElement = tableElement.GetProperty("rows");
                foreach (var rowElement in rowsElement.EnumerateArray())
                {
                    var row = ReadJsonRow(rowElement);

                    if (!table.PrimaryKey.All(row.ContainsKey))
                    {
                        result.RowsSkipped++;
                        result.Warnings.Add($"Una fila de {fullName} no contiene la llave primaria completa y fue omitida.");
                        continue;
                    }

                    bool exists = await RowExistsAsync(connection, transaction, table, row, cancellationToken);
                    if (exists)
                    {
                        result.RowsSkipped++;
                        continue;
                    }

                    await InsertRowAsync(connection, transaction, table, row, cancellationToken);
                    result.RowsRestored++;
                }
            }

            await transaction.CommitAsync(cancellationToken);
            return result;
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public IEnumerable<BackupFileInfo> ListBackups()
    {
        Directory.CreateDirectory(BackupFolder);

        return Directory.GetFiles(BackupFolder, $"{DatabaseName}_*.json")
            .Select(path => new FileInfo(path))
            .OrderByDescending(file => file.CreationTime)
            .Select(file => new BackupFileInfo
            {
                Name = file.Name,
                File = file.FullName,
                SizeBytes = file.Length,
                CreatedAt = file.CreationTime
            });
    }

    private async Task<List<TableMetadata>> GetTablesAsync(SqlConnection connection, CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT
                s.name AS schema_name,
                t.name AS table_name,
                c.name AS column_name,
                ty.name AS data_type,
                c.column_id,
                COLUMNPROPERTY(c.object_id, c.name, 'IsIdentity') AS is_identity,
                CASE WHEN pk.column_id IS NULL THEN 0 ELSE 1 END AS is_primary_key,
                pk.key_ordinal
            FROM sys.tables t
            INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
            INNER JOIN sys.columns c ON t.object_id = c.object_id
            INNER JOIN sys.types ty ON c.user_type_id = ty.user_type_id
            LEFT JOIN (
                SELECT ic.object_id, ic.column_id, ic.key_ordinal
                FROM sys.indexes i
                INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
                WHERE i.is_primary_key = 1
            ) pk ON c.object_id = pk.object_id AND c.column_id = pk.column_id
            WHERE t.is_ms_shipped = 0
            ORDER BY s.name, t.name, c.column_id;
            """;

        var grouped = new Dictionary<string, TableMetadata>(StringComparer.OrdinalIgnoreCase);

        await using (var command = new SqlCommand(sql, connection))
        await using (var reader = await command.ExecuteReaderAsync(cancellationToken))
        {
            while (await reader.ReadAsync(cancellationToken))
            {
                string schema = reader.GetString(0);
                string table = reader.GetString(1);
                string column = reader.GetString(2);
                string fullName = $"{schema}.{table}";

                if (!grouped.TryGetValue(fullName, out var metadata))
                {
                    metadata = new TableMetadata { Schema = schema, Name = table };
                    grouped[fullName] = metadata;
                }

                metadata.Columns.Add(new ColumnMetadata
                {
                    Name = column,
                    DataType = reader.GetString(3),
                    IsIdentity = reader.GetInt32(5) == 1
                });

                bool isPrimaryKey = reader.GetInt32(6) == 1;
                if (isPrimaryKey)
                    metadata.PrimaryKey.Add(column);
            }
        }

        var tables = grouped.Values.Where(t => t.PrimaryKey.Count > 0).ToList();
        var order = await GetDependencyOrderAsync(connection, tables, cancellationToken);
        return order;
    }

    private async Task<List<TableMetadata>> GetDependencyOrderAsync(
        SqlConnection connection,
        List<TableMetadata> tables,
        CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT
                parent_schema.name + '.' + parent_table.name AS child_table,
                referenced_schema.name + '.' + referenced_table.name AS parent_table
            FROM sys.foreign_keys fk
            INNER JOIN sys.tables parent_table ON fk.parent_object_id = parent_table.object_id
            INNER JOIN sys.schemas parent_schema ON parent_table.schema_id = parent_schema.schema_id
            INNER JOIN sys.tables referenced_table ON fk.referenced_object_id = referenced_table.object_id
            INNER JOIN sys.schemas referenced_schema ON referenced_table.schema_id = referenced_schema.schema_id;
            """;

        var byName = tables.ToDictionary(t => t.FullName, StringComparer.OrdinalIgnoreCase);
        var dependencies = tables.ToDictionary(t => t.FullName, _ => new HashSet<string>(StringComparer.OrdinalIgnoreCase), StringComparer.OrdinalIgnoreCase);

        await using (var command = new SqlCommand(sql, connection))
        await using (var reader = await command.ExecuteReaderAsync(cancellationToken))
        {
            while (await reader.ReadAsync(cancellationToken))
            {
                string child = reader.GetString(0);
                string parent = reader.GetString(1);

                if (dependencies.ContainsKey(child) && byName.ContainsKey(parent))
                    dependencies[child].Add(parent);
            }
        }

        var ordered = new List<TableMetadata>();
        var pending = new HashSet<string>(byName.Keys, StringComparer.OrdinalIgnoreCase);

        while (pending.Count > 0)
        {
            var ready = pending
                .Where(name => dependencies[name].All(dep => !pending.Contains(dep)))
                .OrderBy(name => name)
                .ToList();

            if (ready.Count == 0)
                ready = pending.OrderBy(name => name).Take(1).ToList();

            foreach (string name in ready)
            {
                ordered.Add(byName[name]);
                pending.Remove(name);
            }
        }

        return ordered;
    }

    private static async Task<List<Dictionary<string, object?>>> ReadTableRowsAsync(
        SqlConnection connection,
        TableMetadata table,
        CancellationToken cancellationToken)
    {
        string columns = string.Join(", ", table.Columns.Select(c => Bracket(c.Name)));
        string order = string.Join(", ", table.PrimaryKey.Select(Bracket));
        string sql = $"SELECT {columns} FROM {table.FullNameBracketed} ORDER BY {order};";
        var rows = new List<Dictionary<string, object?>>();

        await using var command = new SqlCommand(sql, connection);
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);

        while (await reader.ReadAsync(cancellationToken))
        {
            var row = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase);

            foreach (var column in table.Columns)
            {
                object? value = reader[column.Name];
                row[column.Name] = value == DBNull.Value ? null : NormalizeDbValue(value);
            }

            rows.Add(row);
        }

        return rows;
    }

    private static async Task<bool> RowExistsAsync(
        SqlConnection connection,
        SqlTransaction transaction,
        TableMetadata table,
        Dictionary<string, object?> row,
        CancellationToken cancellationToken)
    {
        string where = string.Join(" AND ", table.PrimaryKey.Select((column, index) => $"{Bracket(column)} = @pk{index}"));
        string sql = $"SELECT COUNT(1) FROM {table.FullNameBracketed} WHERE {where};";

        await using var command = new SqlCommand(sql, connection, transaction);

        for (int i = 0; i < table.PrimaryKey.Count; i++)
            command.Parameters.AddWithValue($"@pk{i}", row[table.PrimaryKey[i]] ?? DBNull.Value);

        int count = Convert.ToInt32(await command.ExecuteScalarAsync(cancellationToken));
        return count > 0;
    }

    private static async Task InsertRowAsync(
        SqlConnection connection,
        SqlTransaction transaction,
        TableMetadata table,
        Dictionary<string, object?> row,
        CancellationToken cancellationToken)
    {
        var columns = table.Columns.Where(c => row.ContainsKey(c.Name)).ToList();
        bool hasIdentity = columns.Any(c => c.IsIdentity);
        string columnList = string.Join(", ", columns.Select(c => Bracket(c.Name)));
        string parameterList = string.Join(", ", columns.Select((_, index) => $"@p{index}"));
        string sql = $"INSERT INTO {table.FullNameBracketed} ({columnList}) VALUES ({parameterList});";

        if (hasIdentity)
            await ExecuteNonQueryAsync(connection, transaction, $"SET IDENTITY_INSERT {table.FullNameBracketed} ON;", cancellationToken);

        try
        {
            await using var command = new SqlCommand(sql, connection, transaction);

            for (int i = 0; i < columns.Count; i++)
            {
                object? value = row[columns[i].Name];
                command.Parameters.AddWithValue($"@p{i}", value ?? DBNull.Value);
            }

            await command.ExecuteNonQueryAsync(cancellationToken);
        }
        finally
        {
            if (hasIdentity)
                await ExecuteNonQueryAsync(connection, transaction, $"SET IDENTITY_INSERT {table.FullNameBracketed} OFF;", cancellationToken);
        }
    }

    private static async Task ExecuteNonQueryAsync(
        SqlConnection connection,
        SqlTransaction transaction,
        string sql,
        CancellationToken cancellationToken)
    {
        await using var command = new SqlCommand(sql, connection, transaction);
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    private async Task<LogicalBackupFile?> ReadLatestBackupManifestAsync(CancellationToken cancellationToken)
    {
        var latest = ListBackups().FirstOrDefault();
        if (latest == null) return null;

        var json = await File.ReadAllTextAsync(latest.File, cancellationToken);
        var backup = JsonSerializer.Deserialize<LogicalBackupFile>(json, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        if (backup != null)
            backup.FileName = Path.GetFileName(latest.File);

        return backup;
    }

    private string ValidateBackupPath(string filePath)
    {
        if (string.IsNullOrWhiteSpace(filePath))
            throw new InvalidOperationException("[BACKUP_RUTA_REQUERIDA] Selecciona un archivo de respaldo.");
        if (filePath.Length > 260 ||
            filePath.Contains('/') ||
            filePath.Contains("..", StringComparison.Ordinal) ||
            InputSanitizer.HasUnsafeText(filePath))
        {
            throw new InvalidOperationException("[BACKUP_RUTA_INVALIDA] La ruta contiene caracteres o secuencias no permitidas.");
        }

        string fullPath = Path.GetFullPath(filePath.Trim().Trim('"'));
        string backupRoot = Path.GetFullPath(BackupFolder).TrimEnd(Path.DirectorySeparatorChar);
        string? containingFolder = Path.GetDirectoryName(fullPath)?.TrimEnd(Path.DirectorySeparatorChar);

        if (!string.Equals(containingFolder, backupRoot, StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("[BACKUP_RUTA_INVALIDA] El archivo debe estar directamente dentro de la carpeta de respaldos.");

        if (!File.Exists(fullPath))
            throw new FileNotFoundException("[BACKUP_NO_ENCONTRADO] No se encontró el archivo de respaldo.");

        if (!string.Equals(Path.GetExtension(fullPath), ".json", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("[BACKUP_FORMATO_INVALIDO] La restauración segura usa respaldos lógicos .json.");

        return fullPath;
    }

    private string GetConnectionString()
    {
        return _configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("[BACKUP_CONFIG] No se encontró la cadena de conexión.");
    }

    private static string NormalizeType(string type)
    {
        string normalized = (type ?? string.Empty).Trim().ToUpperInvariant();
        return normalized switch
        {
            "FULL" => "COMPLETO",
            "COMPLETO" => "COMPLETO",
            "DIFFERENTIAL" => "INCREMENTAL",
            "INCREMENTAL" => "INCREMENTAL",
            _ => throw new InvalidOperationException("[BACKUP_TIPO_INVALIDO] Tipo de respaldo no válido.")
        };
    }

    private static Dictionary<string, object?> ReadJsonRow(JsonElement rowElement)
    {
        var row = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase);

        foreach (var property in rowElement.EnumerateObject())
            row[property.Name] = ConvertJsonValue(property.Value);

        return row;
    }

    private static object? ConvertJsonValue(JsonElement element)
    {
        return element.ValueKind switch
        {
            JsonValueKind.Null => null,
            JsonValueKind.True => true,
            JsonValueKind.False => false,
            JsonValueKind.Number when element.TryGetInt32(out int intValue) => intValue,
            JsonValueKind.Number when element.TryGetInt64(out long longValue) => longValue,
            JsonValueKind.Number when element.TryGetDecimal(out decimal decimalValue) => decimalValue,
            JsonValueKind.String => element.GetString(),
            _ => element.GetRawText()
        };
    }

    private static object NormalizeDbValue(object value)
    {
        return value switch
        {
            DateTime dateTime => dateTime.ToString("O"),
            DateOnly dateOnly => dateOnly.ToString("yyyy-MM-dd"),
            TimeOnly timeOnly => timeOnly.ToString("HH:mm:ss"),
            TimeSpan timeSpan => timeSpan.ToString(@"hh\:mm\:ss"),
            byte[] bytes => Convert.ToBase64String(bytes),
            _ => value
        };
    }

    private static string BuildRowKey(List<string> primaryKey, Dictionary<string, object?> row)
    {
        return string.Join("|", primaryKey.Select(column => $"{column}:{row[column]}"));
    }

    private static string ComputeRowHash(Dictionary<string, object?> row)
    {
        var ordered = row.OrderBy(x => x.Key, StringComparer.OrdinalIgnoreCase).ToDictionary(x => x.Key, x => x.Value);
        string json = JsonSerializer.Serialize(ordered);
        byte[] hash = SHA256.HashData(Encoding.UTF8.GetBytes(json));
        return Convert.ToHexString(hash);
    }

    private static string Bracket(string identifier)
    {
        return $"[{identifier.Replace("]", "]]")}]";
    }
}

public class LogicalBackupFile
{
    public int Version { get; set; }
    public string FileName { get; set; } = "";
    public string Type { get; set; } = "";
    public DateTime CreatedAt { get; set; }
    public string SourceDatabase { get; set; } = "";
    public string? SinceBackupFile { get; set; }
    public List<LogicalBackupTable> Tables { get; set; } = new();
}

public class LogicalBackupTable
{
    public string Schema { get; set; } = "dbo";
    public string Name { get; set; } = "";
    public string FullName => $"{Schema}.{Name}";
    public List<string> PrimaryKey { get; set; } = new();
    public List<string> Columns { get; set; } = new();
    public Dictionary<string, string> RowHashes { get; set; } = new(StringComparer.OrdinalIgnoreCase);
    public List<Dictionary<string, object?>> Rows { get; set; } = new();
}

public class BackupResult
{
    public string Message { get; set; } = "";
    public string File { get; set; } = "";
    public string Type { get; set; } = "";
    public int Tables { get; set; }
    public int Rows { get; set; }
    public string? SinceBackupFile { get; set; }
}

public class RestoreResult
{
    public string Message { get; set; } = "";
    public string File { get; set; } = "";
    public int RowsRestored { get; set; }
    public int RowsSkipped { get; set; }
    public int TablesSkipped { get; set; }
    public List<string> Warnings { get; set; } = new();
}

public class BackupFileInfo
{
    public string Name { get; set; } = "";
    public string File { get; set; } = "";
    public long SizeBytes { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class TableMetadata
{
    public string Schema { get; set; } = "dbo";
    public string Name { get; set; } = "";
    public string FullName => $"{Schema}.{Name}";
    public string FullNameBracketed => $"{LogicalBackupServiceBracket(Schema)}.{LogicalBackupServiceBracket(Name)}";
    public List<string> PrimaryKey { get; set; } = new();
    public List<ColumnMetadata> Columns { get; set; } = new();

    private static string LogicalBackupServiceBracket(string identifier)
    {
        return $"[{identifier.Replace("]", "]]")}]";
    }
}

public class ColumnMetadata
{
    public string Name { get; set; } = "";
    public string DataType { get; set; } = "";
    public bool IsIdentity { get; set; }
}
