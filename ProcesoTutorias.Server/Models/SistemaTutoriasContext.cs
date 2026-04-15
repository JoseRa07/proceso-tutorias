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

    public virtual DbSet<Cuatrimestre> Cuatrimestres { get; set; }

    public virtual DbSet<Grupo> Grupos { get; set; }

    public virtual DbSet<GrupoCuatrimestre> GrupoCuatrimestres { get; set; }

    public virtual DbSet<Justificante> Justificantes { get; set; }

    public virtual DbSet<JustificanteArchivo> JustificanteArchivos { get; set; }

    public virtual DbSet<Maestro> Maestros { get; set; }

    public virtual DbSet<Rol> Rols { get; set; }

    public virtual DbSet<SesionTutorium> SesionTutoria { get; set; }

    public virtual DbSet<Tutor> Tutors { get; set; }

    public virtual DbSet<Tutorium> Tutoria { get; set; }

    public virtual DbSet<Usuario> Usuarios { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
#warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see https://go.microsoft.com/fwlink/?LinkId=723263.
        => optionsBuilder.UseSqlServer("Server=localhost;Database=SistemaTutorias;Trusted_Connection=True;TrustServerCertificate=True;");

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Alumno>(entity =>
        {
            entity.HasKey(e => e.IdAlumno).HasName("PK__Alumno__6D77A7F18340B14D");

            entity.ToTable("Alumno");

            entity.HasIndex(e => e.Matricula, "UQ__Alumno__30962D156ECEC479").IsUnique();

            entity.Property(e => e.IdAlumno).HasColumnName("id_alumno");
            entity.Property(e => e.IdGrupo).HasColumnName("id_grupo");
            entity.Property(e => e.IdUsuario).HasColumnName("id_usuario");
            entity.Property(e => e.Matricula)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("matricula");

            entity.HasOne(d => d.IdGrupoNavigation).WithMany(p => p.Alumnos)
                .HasForeignKey(d => d.IdGrupo)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Alumno__id_grupo__5DCAEF64");

            entity.HasOne(d => d.IdUsuarioNavigation).WithMany(p => p.Alumnos)
                .HasForeignKey(d => d.IdUsuario)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Alumno__id_usuar__5CD6CB2B");
        });

        modelBuilder.Entity<Carrera>(entity =>
        {
            entity.HasKey(e => e.IdCarrera).HasName("PK__Carrera__82525F260015F390");

            entity.ToTable("Carrera");

            entity.Property(e => e.IdCarrera).HasColumnName("id_carrera");
            entity.Property(e => e.Nombre)
                .HasMaxLength(100)
                .IsUnicode(false)
                .HasColumnName("nombre");
            entity.Property(e => e.Siglas)
                .HasMaxLength(10)
                .IsUnicode(false)
                .HasColumnName("siglas");
        });

        modelBuilder.Entity<Cuatrimestre>(entity =>
        {
            entity.HasKey(e => e.IdCuatrimestre).HasName("PK__Cuatrime__CA11FC7CD8EE7811");

            entity.ToTable("Cuatrimestre");

            entity.Property(e => e.IdCuatrimestre).HasColumnName("id_cuatrimestre");
            entity.Property(e => e.Activo)
                .HasDefaultValue(true)
                .HasColumnName("activo");
            entity.Property(e => e.Nombre)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("nombre");
        });

        modelBuilder.Entity<Grupo>(entity =>
        {
            entity.HasKey(e => e.IdGrupo).HasName("PK__Grupo__8B68D688B1B77E9E");

            entity.ToTable("Grupo");

            entity.Property(e => e.IdGrupo).HasColumnName("id_grupo");
            entity.Property(e => e.IdCarrera).HasColumnName("id_carrera");
            entity.Property(e => e.IdTutor).HasColumnName("id_tutor");
            entity.Property(e => e.NombreGrupo)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("nombre_grupo");

            entity.HasOne(d => d.IdCarreraNavigation).WithMany(p => p.Grupos)
                .HasForeignKey(d => d.IdCarrera)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Grupo__id_carrer__59063A47");

            entity.HasOne(d => d.IdTutorNavigation).WithMany(p => p.Grupos)
                .HasForeignKey(d => d.IdTutor)
                .HasConstraintName("FK__Grupo__id_tutor__5812160E");
        });

        modelBuilder.Entity<GrupoCuatrimestre>(entity =>
        {
            entity.HasKey(e => e.IdGrupoCuatrimestre).HasName("PK__GrupoCua__BB7489FB3C662086");

            entity.ToTable("GrupoCuatrimestre");

            entity.Property(e => e.IdGrupoCuatrimestre).HasColumnName("id_grupo_cuatrimestre");
            entity.Property(e => e.Activo)
                .HasDefaultValue(true)
                .HasColumnName("activo");
            entity.Property(e => e.IdCuatrimestre).HasColumnName("id_cuatrimestre");
            entity.Property(e => e.IdGrupo).HasColumnName("id_grupo");

            entity.HasOne(d => d.IdCuatrimestreNavigation).WithMany(p => p.GrupoCuatrimestres)
                .HasForeignKey(d => d.IdCuatrimestre)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__GrupoCuat__id_cu__2DE6D218");

            entity.HasOne(d => d.IdGrupoNavigation).WithMany(p => p.GrupoCuatrimestres)
                .HasForeignKey(d => d.IdGrupo)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__GrupoCuat__id_gr__2CF2ADDF");
        });

        modelBuilder.Entity<Justificante>(entity =>
        {
            entity.HasKey(e => e.IdJustificante).HasName("PK__Justific__860420B7DBC201D8");

            entity.ToTable("Justificante");

            entity.Property(e => e.IdJustificante).HasColumnName("id_justificante");
            entity.Property(e => e.Descripcion)
                .IsUnicode(false)
                .HasColumnName("descripcion");
            entity.Property(e => e.Estado)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("estado");
            entity.Property(e => e.Fecha).HasColumnName("fecha");
            entity.Property(e => e.FechaRegistro)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime")
                .HasColumnName("fecha_registro");
            entity.Property(e => e.IdAlumno).HasColumnName("id_alumno");
            entity.Property(e => e.IdCuatrimestre)
                .HasDefaultValue(1)
                .HasColumnName("id_cuatrimestre");

            entity.HasOne(d => d.IdAlumnoNavigation).WithMany(p => p.Justificantes)
                .HasForeignKey(d => d.IdAlumno)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Justifica__id_al__619B8048");

            entity.HasOne(d => d.IdCuatrimestreNavigation).WithMany(p => p.Justificantes)
                .HasForeignKey(d => d.IdCuatrimestre)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Justifica__id_cu__339FAB6E");
        });

        modelBuilder.Entity<JustificanteArchivo>(entity =>
        {
            entity.HasKey(e => e.IdArchivo).HasName("PK__Justific__9B69644317F28905");

            entity.ToTable("JustificanteArchivo");

            entity.Property(e => e.IdArchivo).HasColumnName("id_archivo");
            entity.Property(e => e.IdJustificante).HasColumnName("id_justificante");
            entity.Property(e => e.Url)
                .HasMaxLength(500)
                .IsUnicode(false)
                .HasColumnName("url");

            entity.HasOne(d => d.IdJustificanteNavigation).WithMany(p => p.JustificanteArchivos)
                .HasForeignKey(d => d.IdJustificante)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Justifica__id_ju__160F4887");
        });

        modelBuilder.Entity<Maestro>(entity =>
        {
            entity.HasKey(e => e.IdMaestro).HasName("PK__Maestro__5509BEDB08EDB841");

            entity.ToTable("Maestro");

            entity.HasIndex(e => e.CodEmpleado, "UQ__Maestro__2E2827A1CE023D05").IsUnique();

            entity.Property(e => e.IdMaestro).HasColumnName("id_maestro");
            entity.Property(e => e.CodEmpleado)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("cod_empleado");
            entity.Property(e => e.IdUsuario).HasColumnName("id_usuario");
            entity.Property(e => e.Vigencia).HasColumnName("vigencia");

            entity.HasOne(d => d.IdUsuarioNavigation).WithMany(p => p.Maestros)
                .HasForeignKey(d => d.IdUsuario)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Maestro__id_usua__52593CB8");
        });

        modelBuilder.Entity<Rol>(entity =>
        {
            entity.HasKey(e => e.IdRol).HasName("PK__rol__6ABCB5E0E2A1201D");

            entity.ToTable("rol");

            entity.Property(e => e.IdRol).HasColumnName("id_rol");
            entity.Property(e => e.Nombre)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("nombre");
        });

        modelBuilder.Entity<SesionTutorium>(entity =>
        {
            entity.HasKey(e => e.IdSesion).HasName("PK__sesion_t__8D3F9DFEF89A577D");

            entity.ToTable("sesion_tutoria");

            entity.Property(e => e.IdSesion).HasColumnName("id_sesion");
            entity.Property(e => e.CompromisosAcuerdos)
                .IsUnicode(false)
                .HasColumnName("compromisos_acuerdos");
            entity.Property(e => e.Estado)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("estado");
            entity.Property(e => e.Fecha).HasColumnName("fecha");
            entity.Property(e => e.HoraFin).HasColumnName("hora_fin");
            entity.Property(e => e.HoraIni).HasColumnName("hora_ini");
            entity.Property(e => e.IdTutoria).HasColumnName("id_tutoria");
            entity.Property(e => e.Motivo)
                .HasMaxLength(255)
                .IsUnicode(false)
                .HasColumnName("motivo");
            entity.Property(e => e.PtsRelevantes)
                .IsUnicode(false)
                .HasColumnName("pts_relevantes");

            entity.HasOne(d => d.IdTutoriaNavigation).WithMany(p => p.SesionTutoria)
                .HasForeignKey(d => d.IdTutoria)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__sesion_tu__id_tu__68487DD7");
        });

        modelBuilder.Entity<Tutor>(entity =>
        {
            entity.HasKey(e => e.IdTutor).HasName("PK__Tutor__C176593DED7C9890");

            entity.ToTable("Tutor");

            entity.Property(e => e.IdTutor).HasColumnName("id_tutor");
            entity.Property(e => e.IdMaestro).HasColumnName("id_maestro");

            entity.HasOne(d => d.IdMaestroNavigation).WithMany(p => p.Tutors)
                .HasForeignKey(d => d.IdMaestro)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Tutor__id_maestr__5535A963");
        });

        modelBuilder.Entity<Tutorium>(entity =>
        {
            entity.HasKey(e => e.IdTutoria).HasName("PK__Tutoria__BA76F5A75DF0C432");

            entity.Property(e => e.IdTutoria).HasColumnName("id_tutoria");
            entity.Property(e => e.IdAlumno).HasColumnName("id_alumno");
            entity.Property(e => e.IdGrupoCuatrimestre)
                .HasDefaultValue(1)
                .HasColumnName("id_grupo_cuatrimestre");
            entity.Property(e => e.IdTutor).HasColumnName("id_tutor");

            entity.HasOne(d => d.IdAlumnoNavigation).WithMany(p => p.Tutoria)
                .HasForeignKey(d => d.IdAlumno)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Tutoria__id_alum__6477ECF3");

            entity.HasOne(d => d.IdGrupoCuatrimestreNavigation).WithMany(p => p.Tutoria)
                .HasForeignKey(d => d.IdGrupoCuatrimestre)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Tutoria__id_grup__30C33EC3");

            entity.HasOne(d => d.IdTutorNavigation).WithMany(p => p.Tutoria)
                .HasForeignKey(d => d.IdTutor)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Tutoria__id_tuto__656C112C");
        });

        modelBuilder.Entity<Usuario>(entity =>
        {
            entity.HasKey(e => e.IdUsuario).HasName("PK__Usuario__4E3E04AD9389CA81");

            entity.ToTable("Usuario");

            entity.HasIndex(e => e.Correo, "UQ__Usuario__2A586E0BCB21CD90").IsUnique();

            entity.Property(e => e.IdUsuario).HasColumnName("id_usuario");
            entity.Property(e => e.Apellidos)
                .HasMaxLength(100)
                .IsUnicode(false)
                .HasColumnName("apellidos");
            entity.Property(e => e.ContrasenaHash)
                .HasMaxLength(255)
                .IsUnicode(false)
                .HasColumnName("contrasena_hash");
            entity.Property(e => e.Correo)
                .HasMaxLength(150)
                .IsUnicode(false)
                .HasColumnName("correo");
            entity.Property(e => e.IdRol).HasColumnName("id_rol");
            entity.Property(e => e.Nombre)
                .HasMaxLength(100)
                .IsUnicode(false)
                .HasColumnName("nombre");
            entity.Property(e => e.ReqCambioContra)
                .HasDefaultValue(true)
                .HasColumnName("req_cambio_contra");
            entity.Property(e => e.Telefono)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasColumnName("telefono");

            entity.HasOne(d => d.IdRolNavigation).WithMany(p => p.Usuarios)
                .HasForeignKey(d => d.IdRol)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Usuario__id_rol__4E88ABD4");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
