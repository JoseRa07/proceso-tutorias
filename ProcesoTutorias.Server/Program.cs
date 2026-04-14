using Microsoft.EntityFrameworkCore;
using ProcesoTutorias.Server.Models;
using System;

var builder = WebApplication.CreateBuilder(args);



builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();


builder.Services.AddDbContext<SistemaTutoriasContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));


builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReact", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();



app.UseCors("AllowReact");
app.UseDefaultFiles();
app.UseStaticFiles();


app.UseSwagger();
app.UseSwaggerUI();

// app.UseHttpsRedirection(); 

app.UseAuthorization();

app.MapControllers();
app.MapFallbackToFile("/index.html");


app.Run();