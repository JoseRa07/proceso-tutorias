IF OBJECT_ID(N'dbo.Seguimiento', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Seguimiento
    (
        id_seguimiento INT IDENTITY(1, 1) NOT NULL,
        id_alumno INT NOT NULL,
        id_tutor INT NOT NULL,
        titulo NVARCHAR(150) NOT NULL,
        descripcion NVARCHAR(500) NULL,
        estado VARCHAR(20) NOT NULL
            CONSTRAINT DF_Seguimiento_Estado DEFAULT ('ACTIVO'),
        fecha_creacion DATETIME2 NOT NULL
            CONSTRAINT DF_Seguimiento_FechaCreacion DEFAULT (SYSUTCDATETIME()),
        fecha_actualizacion DATETIME2 NOT NULL
            CONSTRAINT DF_Seguimiento_FechaActualizacion DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT PK_Seguimiento PRIMARY KEY (id_seguimiento),
        CONSTRAINT FK_Seguimiento_Alumno
            FOREIGN KEY (id_alumno) REFERENCES dbo.Alumno (id_alumno),
        CONSTRAINT FK_Seguimiento_Tutor
            FOREIGN KEY (id_tutor) REFERENCES dbo.Tutor (id_tutor),
        CONSTRAINT CK_Seguimiento_Estado
            CHECK (estado IN ('ACTIVO', 'FINALIZADO', 'CANCELADO'))
    );
END;

IF NOT EXISTS
(
    SELECT 1
    FROM sys.foreign_keys
    WHERE name = N'FK_Seguimiento_Alumno'
      AND parent_object_id = OBJECT_ID(N'dbo.Seguimiento')
)
BEGIN
    ALTER TABLE dbo.Seguimiento
        ADD CONSTRAINT FK_Seguimiento_Alumno
        FOREIGN KEY (id_alumno)
        REFERENCES dbo.Alumno (id_alumno);
END;

IF NOT EXISTS
(
    SELECT 1
    FROM sys.foreign_keys
    WHERE name = N'FK_Seguimiento_Tutor'
      AND parent_object_id = OBJECT_ID(N'dbo.Seguimiento')
)
BEGIN
    ALTER TABLE dbo.Seguimiento
        ADD CONSTRAINT FK_Seguimiento_Tutor
        FOREIGN KEY (id_tutor)
        REFERENCES dbo.Tutor (id_tutor);
END;

IF NOT EXISTS
(
    SELECT 1
    FROM sys.check_constraints
    WHERE name = N'CK_Seguimiento_Estado'
      AND parent_object_id = OBJECT_ID(N'dbo.Seguimiento')
)
BEGIN
    ALTER TABLE dbo.Seguimiento
        ADD CONSTRAINT CK_Seguimiento_Estado
        CHECK (estado IN ('ACTIVO', 'FINALIZADO', 'CANCELADO'));
END;

IF NOT EXISTS
(
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_Seguimiento_Tutor_Alumno_Estado'
      AND object_id = OBJECT_ID(N'dbo.Seguimiento')
)
BEGIN
    CREATE INDEX IX_Seguimiento_Tutor_Alumno_Estado
        ON dbo.Seguimiento (id_tutor, id_alumno, estado);
END;

IF COL_LENGTH(N'dbo.sesion_tutoria', N'id_seguimiento') IS NULL
BEGIN
    ALTER TABLE dbo.sesion_tutoria
        ADD id_seguimiento INT NULL;
END;

-- SQL Server compila las referencias de índice por lote. La columna recién
-- agregada debe estar en un lote anterior antes de crear el índice filtrado.
GO

IF NOT EXISTS
(
    SELECT 1
    FROM sys.foreign_keys
    WHERE name = N'FK_SesionTutoria_Seguimiento'
      AND parent_object_id = OBJECT_ID(N'dbo.sesion_tutoria')
)
BEGIN
    ALTER TABLE dbo.sesion_tutoria
        ADD CONSTRAINT FK_SesionTutoria_Seguimiento
        FOREIGN KEY (id_seguimiento)
        REFERENCES dbo.Seguimiento (id_seguimiento)
        ON DELETE SET NULL;
END;

IF NOT EXISTS
(
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_SesionTutoria_IdSeguimiento'
      AND object_id = OBJECT_ID(N'dbo.sesion_tutoria')
)
BEGIN
    CREATE INDEX IX_SesionTutoria_IdSeguimiento
        ON dbo.sesion_tutoria (id_seguimiento)
        WHERE id_seguimiento IS NOT NULL;
END;
GO
