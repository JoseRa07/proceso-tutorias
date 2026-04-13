using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace ProcesoTutorias.Server.Models;

public partial class SistemaTutoriasContext : DbContext
{
    public SistemaTutoriasContext()
    {
    }

    public SistemaTutoriasContext(DbContextOptions<SistemaTutoriasContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Alumno> Alumnos { get; set; }

    public virtual DbSet<Carrera> Carreras { get; set; }

    public virtual DbSet<Grupo> Grupos { get; set; }

    public virtual DbSet<Justificante> Justificantes { get; set; }
    public DbSet<JustificanteArchivo> JustificanteArchivos { get; set; }

    public virtual DbSet<Maestro> Maestros { get; set; }

    public virtual DbSet<Tutor> Tutors { get; set; }

    public virtual DbSet<Tutorium> Tutoria { get; set; }

    public virtual DbSet<Usuario> Usuarios { get; set; }

    public virtual DbSet<rol> rols { get; set; }

    public virtual DbSet<sesion_tutorium> sesion_tutoria { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
#warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see https://go.microsoft.com/fwlink/?LinkId=723263.
        => optionsBuilder.UseSqlServer("Server=.\\SQLEXPRESS;Database=SistemaTutorias;Trusted_Connection=True;TrustServerCertificate=True;");

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Alumno>(entity =>
        {
            entity.HasKey(e => e.id_alumno).HasName("PK__Alumno__6D77A7F18340B14D");

            entity.ToTable("Alumno");

            entity.HasIndex(e => e.matricula, "UQ__Alumno__30962D156ECEC479").IsUnique();

            entity.Property(e => e.matricula)
                .HasMaxLength(50)
                .IsUnicode(false);

            entity.HasOne(d => d.id_grupoNavigation).WithMany(p => p.Alumnos)
                .HasForeignKey(d => d.id_grupo)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Alumno__id_grupo__5DCAEF64");

            entity.HasOne(d => d.id_usuarioNavigation).WithMany(p => p.Alumnos)
                .HasForeignKey(d => d.id_usuario)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Alumno__id_usuar__5CD6CB2B");
        });

        modelBuilder.Entity<Carrera>(entity =>
        {
            entity.HasKey(e => e.id_carrera).HasName("PK__Carrera__82525F260015F390");

            entity.ToTable("Carrera");

            entity.Property(e => e.nombre)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.siglas)
                .HasMaxLength(10)
                .IsUnicode(false);
        });

        modelBuilder.Entity<Grupo>(entity =>
        {
            entity.HasKey(e => e.id_grupo).HasName("PK__Grupo__8B68D688B1B77E9E");

            entity.ToTable("Grupo");

            entity.Property(e => e.nombre_grupo)
                .HasMaxLength(50)
                .IsUnicode(false);

            entity.HasOne(d => d.id_carreraNavigation).WithMany(p => p.Grupos)
                .HasForeignKey(d => d.id_carrera)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Grupo__id_carrer__59063A47");

            entity.HasOne(d => d.id_tutorNavigation).WithMany(p => p.Grupos)
                .HasForeignKey(d => d.id_tutor)
                .HasConstraintName("FK__Grupo__id_tutor__5812160E");
        });

        modelBuilder.Entity<Justificante>(entity =>
        {
            entity.HasKey(e => e.id_justificante).HasName("PK__Justific__860420B7DBC201D8");

            entity.ToTable("Justificante");

            entity.Property(e => e.descripcion).IsUnicode(false);
            entity.Property(e => e.estado)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.fecha_registro)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.url_archivo)
                .HasMaxLength(500)
                .IsUnicode(false);

            entity.HasOne(d => d.id_alumnoNavigation).WithMany(p => p.Justificantes)
                .HasForeignKey(d => d.id_alumno)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Justifica__id_al__619B8048");
        });

        modelBuilder.Entity<Maestro>(entity =>
        {
            entity.HasKey(e => e.id_maestro).HasName("PK__Maestro__5509BEDB08EDB841");

            entity.ToTable("Maestro");

            entity.HasIndex(e => e.cod_empleado, "UQ__Maestro__2E2827A1CE023D05").IsUnique();

            entity.Property(e => e.cod_empleado)
                .HasMaxLength(50)
                .IsUnicode(false);

            entity.HasOne(d => d.id_usuarioNavigation).WithMany(p => p.Maestros)
                .HasForeignKey(d => d.id_usuario)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Maestro__id_usua__52593CB8");
        });

        modelBuilder.Entity<Tutor>(entity =>
        {
            entity.HasKey(e => e.id_tutor).HasName("PK__Tutor__C176593DED7C9890");

            entity.ToTable("Tutor");

            entity.HasOne(d => d.id_maestroNavigation).WithMany(p => p.Tutors)
                .HasForeignKey(d => d.id_maestro)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Tutor__id_maestr__5535A963");
        });

        modelBuilder.Entity<Tutorium>(entity =>
        {
            entity.HasKey(e => e.id_tutoria).HasName("PK__Tutoria__BA76F5A75DF0C432");

            entity.HasOne(d => d.id_alumnoNavigation).WithMany(p => p.Tutoria)
                .HasForeignKey(d => d.id_alumno)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Tutoria__id_alum__6477ECF3");

            entity.HasOne(d => d.id_tutorNavigation).WithMany(p => p.Tutoria)
                .HasForeignKey(d => d.id_tutor)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Tutoria__id_tuto__656C112C");
        });

        modelBuilder.Entity<Usuario>(entity =>
        {
            entity.HasKey(e => e.id_usuario).HasName("PK__Usuario__4E3E04AD9389CA81");

            entity.ToTable("Usuario");

            entity.HasIndex(e => e.correo, "UQ__Usuario__2A586E0BCB21CD90").IsUnique();

            entity.Property(e => e.apellidos)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.contrasena_hash)
                .HasMaxLength(255)
                .IsUnicode(false);
            entity.Property(e => e.correo)
                .HasMaxLength(150)
                .IsUnicode(false);
            entity.Property(e => e.nombre)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.telefono)
                .HasMaxLength(20)
                .IsUnicode(false);

            entity.HasOne(d => d.id_rolNavigation).WithMany(p => p.Usuarios)
                .HasForeignKey(d => d.id_rol)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Usuario__id_rol__4E88ABD4");
        });

        modelBuilder.Entity<rol>(entity =>
        {
            entity.HasKey(e => e.id_rol).HasName("PK__rol__6ABCB5E0E2A1201D");

            entity.ToTable("rol");

            entity.Property(e => e.nombre)
                .HasMaxLength(50)
                .IsUnicode(false);
        });

        modelBuilder.Entity<JustificanteArchivo>(entity =>
        {
            entity.HasKey(e => e.id_archivo);

            entity.ToTable("JustificanteArchivo");

            entity.Property(e => e.url)
                .HasMaxLength(500)
                .IsUnicode(false);

            entity.HasOne(e => e.Justificante)
                .WithMany()
                .HasForeignKey(e => e.id_justificante)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<sesion_tutorium>(entity =>
        {
            entity.HasKey(e => e.id_sesion).HasName("PK__sesion_t__8D3F9DFEF89A577D");

            entity.Property(e => e.compromisos_acuerdos).IsUnicode(false);
            entity.Property(e => e.estado)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.motivo)
                .HasMaxLength(255)
                .IsUnicode(false);
            entity.Property(e => e.pts_relevantes).IsUnicode(false);

            entity.HasOne(d => d.id_tutoriaNavigation).WithMany(p => p.sesion_tutoria)
                .HasForeignKey(d => d.id_tutoria)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__sesion_tu__id_tu__68487DD7");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
