using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using ProcesoTutorias.Server.Models;
using ProcesoTutorias.Server.Services;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

var builder = WebApplication.CreateBuilder(args);



builder.Services.AddControllers(options =>
{
    options.Filters.Add(new AuthorizeFilter());
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
            }
        };
    });

builder.Services.AddAuthorization();

var app = builder.Build();

await DatabaseSchemaInitializer.ApplyAsync(app.Services);

app.UseCors("AllowReact");
app.UseDefaultFiles();
app.UseStaticFiles();


app.UseSwagger();
app.UseSwaggerUI();

// app.UseHttpsRedirection(); 

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapFallbackToFile("/index.html");


app.Run();
