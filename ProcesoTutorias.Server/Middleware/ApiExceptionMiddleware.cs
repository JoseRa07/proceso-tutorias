using System.Text.Json;
using Microsoft.EntityFrameworkCore;

namespace ProcesoTutorias.Server.Middleware;

public sealed class ApiExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ApiExceptionMiddleware> _logger;

    public ApiExceptionMiddleware(
        RequestDelegate next,
        ILogger<ApiExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (OperationCanceledException) when (context.RequestAborted.IsCancellationRequested)
        {
            _logger.LogInformation(
                "Solicitud cancelada por el cliente. TraceId: {TraceId}",
                context.TraceIdentifier);
        }
        catch (Exception exception)
        {
            if (context.Response.HasStarted)
                throw;

            var error = Describe(exception);
            _logger.LogError(
                exception,
                "Error no controlado {Code} en {Method} {Path}. TraceId: {TraceId}",
                error.Code,
                context.Request.Method,
                context.Request.Path,
                context.TraceIdentifier);

            context.Response.Clear();
            context.Response.StatusCode = error.StatusCode;
            context.Response.ContentType = "application/json; charset=utf-8";
            context.Response.Headers.CacheControl = "no-store";

            await context.Response.WriteAsJsonAsync(new
            {
                code = error.Code,
                message = error.Message,
                traceId = context.TraceIdentifier
            });
        }
    }

    private static ApiErrorDescriptor Describe(Exception exception) => exception switch
    {
        BadHttpRequestException or JsonException => new(
            StatusCodes.Status400BadRequest,
            "SOLICITUD_INVALIDA",
            "La solicitud contiene datos inválidos o no pudo procesarse."),
        DbUpdateConcurrencyException => new(
            StatusCodes.Status409Conflict,
            "DATOS_DESACTUALIZADOS",
            "La información cambió mientras se realizaba la operación. Actualiza la página e inténtalo nuevamente."),
        DbUpdateException => new(
            StatusCodes.Status409Conflict,
            "CONFLICTO_DATOS",
            "No fue posible guardar los cambios porque existe un conflicto con los datos registrados."),
        TimeoutException => new(
            StatusCodes.Status503ServiceUnavailable,
            "SERVICIO_NO_DISPONIBLE",
            "La operación tardó demasiado. Inténtalo nuevamente en unos momentos."),
        IOException or UnauthorizedAccessException => new(
            StatusCodes.Status503ServiceUnavailable,
            "ARCHIVO_NO_DISPONIBLE",
            "No fue posible completar la operación con el archivo solicitado."),
        _ => new(
            StatusCodes.Status500InternalServerError,
            "ERROR_INTERNO",
            "Ocurrió un error inesperado. Inténtalo nuevamente; si continúa, proporciona la referencia al administrador.")
    };

    private sealed record ApiErrorDescriptor(int StatusCode, string Code, string Message);
}
