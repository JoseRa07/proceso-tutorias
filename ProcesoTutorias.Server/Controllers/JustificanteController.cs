using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProcesoTutorias.Server.Models;
using ProcesoTutorias.Server.DTOs;

namespace ProcesoTutorias.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class JustificanteController : ControllerBase
    {
        private readonly SistemaTutoriasContext _context;

        public JustificanteController(SistemaTutoriasContext context)
        {
            _context = context;
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
        public IActionResult Crear(int idUsuario, [FromBody] JustificanteReq dto)
        {
            var alumno = _context.Alumnos.FirstOrDefault(a => a.IdUsuario == idUsuario);

            if (alumno == null)
                return NotFound("Alumno no encontrado");

            var j = new Justificante
            {
                IdAlumno = alumno.IdAlumno,
                Fecha = dto.Fecha,
                Descripcion = dto.Descripcion,
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
        public IActionResult Aceptar(int id)
        {
            var j = _context.Justificantes.Find(id);

            if (j == null)
                return NotFound();

            j.Estado = "ACEPTADO";
            _context.SaveChanges();

            return Ok();
        }

        // =========================
        // EDITAR
        // =========================
        [HttpPut("{id}")]
        public IActionResult Editar(int id, [FromBody] JustificanteReq dto)
        {
            var j = _context.Justificantes.Find(id);

            if (j == null)
                return NotFound();

            j.Descripcion = dto.Descripcion;
            j.Fecha = dto.Fecha;

            _context.SaveChanges();

            return Ok(j);
        }

        // =========================
        // ELIMINAR (LOGICO)
        // =========================
        [HttpDelete("{id}")]
        public IActionResult Eliminar(int id)
        {
            var j = _context.Justificantes.Find(id);

            if (j == null)
                return NotFound();

            j.Estado = "INACTIVO";
            _context.SaveChanges();

            return Ok();
        }

        // =========================
        // UPLOAD ARCHIVOS
        // =========================
        [HttpPost("upload")]
        [RequestSizeLimit(50 * 1024 * 1024)]
        public IActionResult SubirArchivos([FromForm] List<IFormFile> files)
        {
            if (files == null || files.Count == 0)
                return BadRequest("No se enviaron archivos");

            string carpeta = @"C:\justificantes\";

            if (!Directory.Exists(carpeta))
                Directory.CreateDirectory(carpeta);

            var urls = new List<string>();

            foreach (var file in files)
            {
                var ext = Path.GetExtension(file.FileName).ToLower();

                var validos = new[] { ".jpg", ".jpeg", ".png", ".webp" };

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
    }
}