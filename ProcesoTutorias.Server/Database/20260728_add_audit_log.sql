USE SistemaTutorias;
GO

IF OBJECT_ID(N'dbo.AuditLog', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AuditLog
    (
        id_audit_log bigint IDENTITY(1,1) NOT NULL,
        created_at_utc datetime2 NOT NULL
            CONSTRAINT DF_AuditLog_CreatedAtUtc DEFAULT (SYSUTCDATETIME()),
        actor_user_id int NULL,
        actor_email varchar(150) NULL,
        actor_role varchar(50) NULL,
        action varchar(80) NOT NULL,
        entity varchar(80) NOT NULL,
        entity_id varchar(64) NULL,
        detail nvarchar(500) NULL,
        ip_address varchar(45) NULL,
        CONSTRAINT PK_AuditLog PRIMARY KEY (id_audit_log)
    );

    CREATE INDEX IX_AuditLog_CreatedAtUtc
        ON dbo.AuditLog (created_at_utc DESC);

    CREATE INDEX IX_AuditLog_Action
        ON dbo.AuditLog (action);
END;
GO

-- La tabla no tiene claves foráneas deliberadamente:
-- conserva el historial aunque el usuario o la entidad auditada se eliminen.
