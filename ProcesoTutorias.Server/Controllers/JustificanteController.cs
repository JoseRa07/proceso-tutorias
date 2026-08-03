using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProcesoTutorias.Server.Models;
using ProcesoTutorias.Server.DTOs;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using ProcesoTutorias.Server.Validation;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.StaticFiles;
using ProcesoTutorias.Server.Services;

namespace ProcesoTutorias.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "ALUMNO,TUTOR")]
    public class JustificanteController : ControllerBase
    {
        private readonly SistemaTutoriasContext _context;
        private readonly AuditLogService _auditLogService;

        public JustificanteController(
            SistemaTutoriasContext context,
            AuditLogService auditLogService)
        {
            _context = context;
            _auditLogService = auditLogService;
        }

        // =========================
        // GET (PAGINADO + FILTROS)
        // =========================
        [HttpGet]
        public IActionResult Obtener(
            int idUsuario,
            int idRol,
            string? estado = null,
            int? idAlumno = null,
            int pagina = 1,
            int tam = 5)
        {
            if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out idUsuario))
                return Unauthorized();
            if (pagina < 1 || tam is < 1 or > 100)
                return BadRequest(new { message = "[PAGINACION_INVALIDA] La página y el tamaño deben ser enteros positivos; el tamaño máximo es 100." });
            if (idAlumno.HasValue && !InputSanitizer.IsPositiveId(idAlumno.Value))
                return BadRequest(new { message = "[ALUMNO_INVALIDO] El alumno debe ser un entero mayor que cero." });

            idRol = User.IsInRole("ALUMNO") ? 2 : 3;
            IQueryable<JustificanteDto> query;

            // ================= ALUMNO =================
            if (idRol == 2)
            {
                query =
                    from a in _context.Alumnos
                    join u in _context.Usuarios on a.IdUsuario equals u.IdUsuario
                    join j in _context.Justificantes on a.IdAlumno equals j.IdAlumno
                    where a.IdUsuario == idUsuario && j.Estado != "INACTIVO"
                    select new JustificanteDto
                    {
                        IdJustificante = j.IdJustificante,
                        Fecha = j.Fecha,
                        Descripcion = j.Descripcion,
                        Estado = j.Estado,
                        IdAlumno = a.IdAlumno,
                        NombreAlumno = u.Nombre + " " + u.Apellidos,
                        Archivos = _context.JustificanteArchivos
                            .Where(x => x.IdJustificante == j.IdJustificante)
                            .Select(x => x.Url)
                            .ToList()
                    };
            }
            // ================= TUTOR =================
            else
            {
                query =
                    from m in _context.Maestros
                    join t in _context.Tutors on m.IdMaestro equals t.IdMaestro
                    join g in _context.Grupos on t.IdTutor equals g.IdTutor
                    join a in _context.Alumnos on g.IdGrupo equals a.IdGrupo
                    join u in _context.Usuarios on a.IdUsuario equals u.IdUsuario
                    join j in _context.Justificantes on a.IdAlumno equals j.IdAlumno
                    where m.IdUsuario == idUsuario && j.Estado != "INACTIVO"
                    select new JustificanteDto
                    {
                        IdJustificante = j.IdJustificante,
                        Fecha = j.Fecha,
                        Descripcion = j.Descripcion,
                        Estado = j.Estado,
                        IdAlumno = a.IdAlumno,
                        NombreAlumno = u.Nombre + " " + u.Apellidos,
                        Archivos = _context.JustificanteArchivos
                            .Where(x => x.IdJustificante == j.IdJustificante)
                            .Select(x => x.Url)
                            .ToList()
                    };
            }

            if (idAlumno.HasValue)
                query = query.Where(x => x.IdAlumno == idAlumno.Value);

            if (!string.IsNullOrEmpty(estado))
                query = query.Where(x => x.Estado == estado);

            var total = query.Count();

            var data = query
                .OrderByDescending(x => x.Fecha)
                .Skip((pagina - 1) * tam)
                .Take(tam)
                .ToList();

            return Ok(new { total, data });
        }

        // =========================
        // CREAR JUSTIFICANTE
        // =========================
        [HttpPost]
        [Authorize(Roles = "ALUMNO")]
        public IActionResult Crear(int idUsuario, [FromBody] JustificanteReq dto)
        {
            if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out idUsuario))
                return Unauthorized();
            string? validationError = ValidarJustificante(dto);
            if (validationError != null)
                return BadRequest(new { message = validationError });

            var alumno = _context.Alumnos.FirstOrDefault(a => a.IdUsuario == idUsuario);

            if (alumno == null)
                return NotFound("Alumno no encontrado");

            var j = new Justificante
            {
                IdAlumno = alumno.IdAlumno,
                Fecha = dto.Fecha,
                Descripcion = InputSanitizer.NormalizeMultiline(dto.Descripcion),
                Estado = "PENDIENTE",
                FechaRegistro = DateTime.Now
            };

            _context.Justificantes.Add(j);
            _context.SaveChanges();

            if (dto.Archivos != null && dto.Archivos.Any())
            {
                var archivos = dto.Archivos.Select(url => new JustificanteArchivo
                {
                    IdJustificante = j.IdJustificante,
                    Url = url
                });

                _context.JustificanteArchivos.AddRange(archivos);
                _context.SaveChanges();
            }

            return Ok(new JustificanteDto
            {
                IdJustificante = j.IdJustificante,
                Fecha = j.Fecha,
                Descripcion = j.Descripcion,
                Estado = j.Estado,
                IdAlumno = j.IdAlumno,
                NombreAlumno = "",
                Archivos = dto.Archivos ?? new List<string>()
            });
        }

        // =========================
        // ACEPTAR
        // =========================
        [HttpPut("aceptar/{id}")]
        [Authorize(Roles = "TUTOR")]
        public IActionResult Aceptar(int id)
        {
            if (!InputSanitizer.IsPositiveId(id))
                return BadRequest(new { message = "[JUSTIFICANTE_ID_INVALIDO] El identificador debe ser un entero mayor que cero." });
            if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out int idUsuario))
                return Unauthorized();

            var j = _context.Justificantes.FirstOrDefault(item =>
                item.IdJustificante == id &&
                item.Estado != "INACTIVO" &&
                item.IdAlumnoNavigation.IdGrupoNavigation.IdTutorNavigation != null &&
                item.IdAlumnoNavigation.IdGrupoNavigation.IdTutorNavigation.IdMaestroNavigation.IdUsuario == idUsuario);

            if (j == null)
                return NotFound();
            if (j.Estado != "PENDIENTE")
                return Conflict(new { message = "[JUSTIFICANTE_ESTADO_INVALIDO] Solo un justificante pendiente puede aprobarse." });

            string previousState = j.Estado;
            j.Estado = "ACEPTADO";
            _auditLogService.Record(
                "JUSTIFICANTE_ACEPTADO",
                "Justificante",
                id,
                $"Estado cambiado de {previousState} a ACEPTADO.");
            _context.SaveChanges();

            return Ok();
        }

        // =========================
        // EDITAR
        // =========================
        [HttpPut("{id}")]
        [Authorize(Roles = "ALUMNO")]
        public IActionResult Editar(int id, [FromBody] JustificanteReq dto)
        {
            if (!InputSanitizer.IsPositiveId(id))
                return BadRequest(new { message = "[JUSTIFICANTE_ID_INVALIDO] El identificador debe ser un entero mayor que cero." });
            if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out int idUsuario))
                return Unauthorized();

            string? validationError = ValidarJustificante(dto);
            if (validationError != null)
                return BadRequest(new { message = validationError });

            var j = _context.Justificantes.FirstOrDefault(item =>
                item.IdJustificante == id &&
                item.Estado != "INACTIVO" &&
                item.IdAlumnoNavigation.IdUsuario == idUsuario);

            if (j == null)
                return NotFound();
            if (j.Estado != "PENDIENTE")
                return Conflict(new { message = "[JUSTIFICANTE_ESTADO_INVALIDO] Solo un justificante pendiente puede editarse." });

            j.Descripcion = InputSanitizer.NormalizeMultiline(dto.Descripcion);
            j.Fecha = dto.Fecha;

            _context.SaveChanges();

            return Ok(j);
        }

        // =========================
        // ELIMINAR (LOGICO)
        // =========================
        [HttpDelete("{id}")]
        [Authorize(Roles = "ALUMNO")]
        public IActionResult Eliminar(int id)
        {
            if (!InputSanitizer.IsPositiveId(id))
                return BadRequest(new { message = "[JUSTIFICANTE_ID_INVALIDO] El identificador debe ser un entero mayor que cero." });
            if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out int idUsuario))
                return Unauthorized();

            var j = _context.Justificantes.FirstOrDefault(item =>
                item.IdJustificante == id &&
                item.Estado != "INACTIVO" &&
                item.IdAlumnoNavigation.IdUsuario == idUsuario);

            if (j == null)
                return NotFound();
            if (j.Estado != "PENDIENTE")
                return Conflict(new { message = "[JUSTIFICANTE_ESTADO_INVALIDO] Solo un justificante pendiente puede eliminarse." });

            string previousState = j.Estado;
            j.Estado = "INACTIVO";
            _auditLogService.Record(
                "JUSTIFICANTE_ELIMINADO",
                "Justificante",
                id,
                $"Estado cambiado de {previousState} a INACTIVO.");
            _context.SaveChanges();

            return Ok();
        }

        // =========================
        // UPLOAD ARCHIVOS
        // =========================
        [HttpPost("upload")]
        [Authorize(Roles = "ALUMNO")]
        [RequestSizeLimit(50 * 1024 * 1024)]
        public IActionResult SubirArchivos([FromForm] List<IFormFile> files)
        {
            if (files == null || files.Count == 0)
                return BadRequest("No se enviaron archivos");
            if (files.Count > 10)
                return BadRequest(new { message = "[ARCHIVOS_LIMITE] Se permiten como máximo 10 archivos." });

            string carpeta = @"C:\justificantes\";

            if (!Directory.Exists(carpeta))
                Directory.CreateDirectory(carpeta);

            var urls = new List<string>();

            foreach (var file in files)
            {
                if (file.Length <= 0 || file.Length > 10 * 1024 * 1024)
                    return BadRequest(new { message = "[ARCHIVO_TAMANO_INVALIDO] Cada archivo debe pesar entre 1 byte y 10 MB." });

                var ext = Path.GetExtension(file.FileName).ToLower();

                var validos = new[] { ".jpg", ".jpeg", ".png", ".webp", ".pdf" };

                if (!validos.Contains(ext))
                    return BadRequest("Tipo no permitido");

                var nombre = $"{Guid.NewGuid()}{ext}";
                var ruta = Path.Combine(carpeta, nombre);

                using var stream = new FileStream(ruta, FileMode.Create);
                file.CopyTo(stream);

                urls.Add($"/justificantes/{nombre}");
            }

            return Ok(urls);
        }

        [HttpGet("archivo/{nombre}")]
        [Authorize(Roles = "ALUMNO,TUTOR")]
        public async Task<IActionResult> DescargarArchivo(string nombre)
        {
            if (string.IsNullOrWhiteSpace(nombre) ||
                nombre.Length > 100 ||
                Path.GetFileName(nombre) != nombre)
            {
                return BadRequest(new { message = "[JUSTIFICANTE_ARCHIVO_INVALIDO] El archivo solicitado no es válido." });
            }

            if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out int idUsuario))
                return Unauthorized();

            string storedUrl = $"/justificantes/{nombre}";
            var archivo = await _context.JustificanteArchivos
                .AsNoTracking()
                .Include(item => item.IdJustificanteNavigation)
                    .ThenInclude(item => item.IdAlumnoNavigation)
                        .ThenInclude(item => item.IdGrupoNavigation)
                            .ThenInclude(item => item.IdTutorNavigation)
                                .ThenInclude(item => item!.IdMaestroNavigation)
                .FirstOrDefaultAsync(item => item.Url == storedUrl);

            if (archivo == null)
                return NotFound();

            var alumno = archivo.IdJustificanteNavigation.IdAlumnoNavigation;
            bool autorizado = User.IsInRole("ALUMNO")
                ? alumno.IdUsuario == idUsuario
                : User.IsInRole("TUTOR") &&
                  alumno.IdGrupoNavigation.IdTutorNavigation?.IdMaestroNavigation.IdUsuario == idUsuario;

            if (!autorizado)
                return Forbid();

            string fullPath = Path.Combine(@"C:\justificantes", nombre);
            if (!System.IO.File.Exists(fullPath))
                return NotFound();

            var contentTypes = new FileExtensionContentTypeProvider();
            if (!contentTypes.TryGetContentType(nombre, out string? contentType))
                contentType = "application/octet-stream";

            return PhysicalFile(fullPath, contentType, enableRangeProcessing: true);
        }

        private static string? ValidarJustificante(JustificanteReq dto)
        {
            if (dto.Fecha == default || dto.Fecha > DateOnly.FromDateTime(DateTime.Today))
                return "[JUSTIFICANTE_FECHA_INVALIDA] La fecha es obligatoria y no puede ser futura.";

            string? descriptionError = InputSanitizer.ValidateFreeText(dto.Descripcion, "La descripción", 1000);
            if (descriptionError != null)
                return descriptionError;

            if (dto.Archivos?.Any(url =>
                    string.IsNullOrWhiteSpace(url) ||
                    !Regex.IsMatch(
                        url,
                        @"^/justificantes/[a-fA-F0-9-]+\.(jpg|jpeg|png|webp|pdf)$",
                        RegexOptions.CultureInvariant)) == true)
            {
                return "[JUSTIFICANTE_ARCHIVO_INVALIDO] La referencia de un archivo no es válida.";
            }

            return null;
        }
    }
}
