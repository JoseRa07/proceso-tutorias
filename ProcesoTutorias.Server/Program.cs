using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using ProcesoTutorias.Server.Models;
using ProcesoTutorias.Server.Middleware;
using ProcesoTutorias.Server.Services;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Railway supplies the public port at runtime. Binding explicitly keeps local
// development unchanged while making the container reachable in production.
string? railwayPort = Environment.GetEnvironmentVariable("PORT");
if (!string.IsNullOrWhiteSpace(railwayPort))
{
    builder.WebHost.UseUrls($"http://0.0.0.0:{railwayPort}");
}



builder.Services.AddControllers(options =>
{
    options.Filters.Add(new AuthorizeFilter());
});
builder.Services.Configure<ApiBehaviorOptions>(options =>
{
    options.InvalidModelStateResponseFactory = context =>
    {
        context.HttpContext.Response.Headers.CacheControl = "no-store";
        return new BadRequestObjectResult(new
        {
            code = "SOLICITUD_INVALIDA",
            message = "La solicitud contiene datos inválidos. Revisa los campos e inténtalo nuevamente.",
            traceId = context.HttpContext.TraceIdentifier
        });
    };
});
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddScoped<LogicalBackupService>();
builder.Services.AddScoped<SessionTokenService>();
builder.Services.AddScoped<AuditLogService>();
builder.Services.AddHttpContextAccessor();
builder.Services.AddHostedService<BackupWorker>();


builder.Services.AddDbContext<SistemaTutoriasContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));


builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReact", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

string jwtSecret = builder.Configuration["JwtSettings:SecretKey"]
    ?? throw new InvalidOperationException("JwtSettings:SecretKey no está configurado.");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidateLifetime = true,
            ValidIssuer = builder.Configuration["JwtSettings:Issuer"],
            ValidAudience = builder.Configuration["JwtSettings:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtSecret)
            ),
            ClockSkew = TimeSpan.Zero
        };
        options.Events = new JwtBearerEvents
        {
            OnTokenValidated = async context =>
            {
                string? sessionIdValue = context.Principal?.FindFirstValue("sid")
                    ?? context.Principal?.FindFirstValue(ClaimTypes.Sid);
                string? userIdValue = context.Principal?.FindFirstValue(ClaimTypes.NameIdentifier);
                string? jti = context.Principal?.FindFirstValue(JwtRegisteredClaimNames.Jti);
                string? versionValue = context.Principal?.FindFirstValue("session_version");

                if (!Guid.TryParse(sessionIdValue, out Guid sessionId) ||
                    !int.TryParse(userIdValue, out int userId) ||
                    !int.TryParse(versionValue, out int sessionVersion) ||
                    string.IsNullOrWhiteSpace(jti))
                {
                    context.Fail("La sesión no contiene identificadores válidos.");
                    return;
                }

                var sessionService = context.HttpContext.RequestServices
                    .GetRequiredService<SessionTokenService>();
                if (!await sessionService.ValidateAccessSessionAsync(
                        sessionId,
                        userId,
                        jti,
                        sessionVersion))
                {
                    context.Fail("La sesión fue revocada.");
                }
            },
            OnChallenge = async context =>
            {
                if (context.Response.HasStarted)
                    return;

                context.HandleResponse();
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                context.Response.ContentType = "application/json; charset=utf-8";
                context.Response.Headers.CacheControl = "no-store";
                await context.Response.WriteAsJsonAsync(new
                {
                    code = "SESION_NO_VALIDA",
                    message = "La sesión no es válida o ha expirado. Inicia sesión nuevamente.",
                    traceId = context.HttpContext.TraceIdentifier
                });
            },
            OnForbidden = async context =>
            {
                if (context.Response.HasStarted)
                    return;

                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                context.Response.ContentType = "application/json; charset=utf-8";
                context.Response.Headers.CacheControl = "no-store";
                await context.Response.WriteAsJsonAsync(new
                {
                    code = "ACCESO_DENEGADO",
                    message = "No tienes permiso para realizar esta operación.",
                    traceId = context.HttpContext.TraceIdentifier
                });
            }
        };
    });

builder.Services.AddAuthorization();

var app = builder.Build();

await DatabaseSchemaInitializer.ApplyAsync(app.Services);

app.UseMiddleware<ApiExceptionMiddleware>();
app.UseCors("AllowReact");
app.UseDefaultFiles();
app.UseStaticFiles();


app.UseSwagger();
app.UseSwaggerUI();

// app.UseHttpsRedirection(); 

app.UseAuthentication();
app.UseAuthorization();

app.MapGet("/health", () => Results.Ok(new { status = "ok" }));
app.MapControllers();
app.MapFallbackToFile("/index.html");


app.Run();
