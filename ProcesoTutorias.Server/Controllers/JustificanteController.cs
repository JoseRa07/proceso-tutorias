using Microsoft.AspNetCore.Mvc;
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

            if (idRol == 2) // ALUMNO
            {
                query = from a in _context.Alumnos
                        join u in _context.Usuarios on a.id_usuario equals u.id_usuario
                        join j in _context.Justificantes on a.id_alumno equals j.id_alumno
                        where a.id_usuario == idUsuario && j.estado != "INACTIVO"
                        select new JustificanteDto
                        {
                            IdJustificante = j.id_justificante,
                            Fecha = j.fecha,
                            Descripcion = j.descripcion,
                            Estado = j.estado,
                            IdAlumno = a.id_alumno,
                            NombreAlumno = u.nombre + " " + u.apellidos,
                            Archivos = _context.JustificanteArchivos
                                .Where(x => x.id_justificante == j.id_justificante)
                                .Select(x => x.url)
                                .ToList()
                        };
            }
            else // TUTOR
            {
                query = from m in _context.Maestros
                        join tu in _context.Tutors on m.id_maestro equals tu.id_maestro
                        join g in _context.Grupos on tu.id_tutor equals g.id_tutor
                        join a in _context.Alumnos on g.id_grupo equals a.id_grupo
                        join u in _context.Usuarios on a.id_usuario equals u.id_usuario
                        join j in _context.Justificantes on a.id_alumno equals j.id_alumno
                        where m.id_usuario == idUsuario && j.estado != "INACTIVO"
                        select new JustificanteDto
                        {
                            IdJustificante = j.id_justificante,
                            Fecha = j.fecha,
                            Descripcion = j.descripcion,
                            Estado = j.estado,
                            IdAlumno = a.id_alumno,
                            NombreAlumno = u.nombre + " " + u.apellidos,
                            Archivos = _context.JustificanteArchivos
                                .Where(x => x.id_justificante == j.id_justificante)
                                .Select(x => x.url)
                                .ToList()
                        };
            }

            if (idAlumno.HasValue)
                query = query.Where(x => x.IdAlumno == idAlumno.Value);

            if (!string.IsNullOrEmpty(estado))
                query = query.Where(x => x.Estado == estado);

            query = query.OrderByDescending(x => x.Fecha);

            var total = query.Count();

            var data = query
                .Skip((pagina - 1) * tam)
                .Take(tam)
                .ToList();

            return Ok(new { total, data });
        }

        [HttpPost]
        public IActionResult Crear(int idUsuario, [FromBody] JustificanteReq dto)
        {
            var alumno = _context.Alumnos.FirstOrDefault(a => a.id_usuario == idUsuario);

            if (alumno == null)
                return NotFound("Alumno no encontrado");

            var j = new Justificante
            {
                id_alumno = alumno.id_alumno,
                fecha = dto.Fecha,
                descripcion = dto.Descripcion,
                estado = "PENDIENTE"
            };

            _context.Justificantes.Add(j);
            _context.SaveChanges();

            // guardar archivos
            if (dto.Archivos != null && dto.Archivos.Any())
            {
                var archivos = dto.Archivos.Select(url => new JustificanteArchivo
                {
                    id_justificante = j.id_justificante,
                    url = url
                });

                _context.JustificanteArchivos.AddRange(archivos);
                _context.SaveChanges();
            }

            // 🔥 RESPUESTA SIN CICLOS
            var result = new JustificanteDto
            {
                IdJustificante = j.id_justificante,
                Fecha = j.fecha,
                Descripcion = j.descripcion,
                Estado = j.estado,
                IdAlumno = j.id_alumno,
                NombreAlumno = "", // opcional aquí
                Archivos = dto.Archivos ?? new List<string>()
            };

            return Ok(result);
        }

        [HttpPut("aceptar/{id}")]
        public IActionResult Aceptar(int id)
        {
            var j = _context.Justificantes.Find(id);

            if (j == null)
                return NotFound();

            j.estado = "ACEPTADO";

            _context.SaveChanges();

            return Ok();
        }

        [HttpPut("{id}")]
        public IActionResult Editar(int id, [FromBody] JustificanteReq dto)
        {
            var j = _context.Justificantes.Find(id);

            if (j == null)
                return NotFound();

            j.descripcion = dto.Descripcion;
            j.fecha = dto.Fecha;

            _context.SaveChanges();

            return Ok(new
            {
                j.id_justificante,
                j.descripcion,
                j.fecha
            });
        }

        [HttpDelete("{id}")]
        public IActionResult Eliminar(int id)
        {
            var j = _context.Justificantes.Find(id);

            if (j == null)
                return NotFound();

            j.estado = "INACTIVO";

            _context.SaveChanges();

            return Ok();
        }

        [HttpPost("upload")]
        [RequestSizeLimit(50 * 1024 * 1024)]
        public IActionResult SubirArchivos([FromForm] List<IFormFile> files)
        {
            try
            {
                if (files == null || files.Count == 0)
                    return BadRequest("No se enviaron archivos");

                if (files.Count > 10)
                    return BadRequest("Máximo 10 archivos permitidos");

                string carpeta = @"C:\justificantes\";

                if (!Directory.Exists(carpeta))
                    Directory.CreateDirectory(carpeta);

                var urls = new List<string>();

                foreach (var file in files)
                {
                    if (file.Length > 5 * 1024 * 1024)
                        return BadRequest($"El archivo {file.FileName} excede 5MB");

                    var extensiones = new[] { ".jpg", ".jpeg", ".png", ".webp" };
                    var ext = Path.GetExtension(file.FileName).ToLower();

                    if (!extensiones.Contains(ext))
                        return BadRequest($"Tipo no permitido: {file.FileName}");

                    var nombre = $"{Guid.NewGuid()}{ext}";
                    var ruta = Path.Combine(carpeta, nombre);

                    using var stream = new FileStream(ruta, FileMode.Create);
                    file.CopyTo(stream);

                    urls.Add($"/justificantes/{nombre}");
                }

                return Ok(urls);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}