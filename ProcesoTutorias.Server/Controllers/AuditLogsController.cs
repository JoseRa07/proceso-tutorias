using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProcesoTutorias.Server.Models;

namespace ProcesoTutorias.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "ADMIN")]
public sealed class AuditLogsController : ControllerBase
{
    private readonly SistemaTutoriasContext _context;

    public AuditLogsController(SistemaTutoriasContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> Get(int pagina = 1, int tam = 50)
    {
        if (pagina < 1 || tam is < 1 or > 100)
        {
            return BadRequest(new
            {
                message = "[PAGINACION_INVALIDA] La página y el tamaño deben ser positivos; el tamaño máximo es 100."
            });
        }

        IQueryable<AuditLog> query = _context.AuditLogs.AsNoTracking();
        int total = await query.CountAsync();
        List<AuditLog> data = await query
            .OrderByDescending(item => item.CreatedAtUtc)
            .Skip((pagina - 1) * tam)
            .Take(tam)
            .ToListAsync();

        return Ok(new { total, data });
    }
}
