USE SistemaTutorias;
GO

IF COL_LENGTH(N'dbo.Usuario', N'session_version') IS NULL
BEGIN
    ALTER TABLE dbo.Usuario
        ADD session_version int NOT NULL
            CONSTRAINT DF_Usuario_SessionVersion DEFAULT (1);
END;
GO

IF OBJECT_ID(N'dbo.AuthSession', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AuthSession
    (
        id_session uniqueidentifier NOT NULL,
        id_usuario int NOT NULL,
        session_version int NOT NULL,
        jti varchar(64) NOT NULL,
        refresh_token_hash varchar(64) NOT NULL,
        created_at datetime2 NOT NULL,
        expires_at datetime2 NOT NULL,
        revoked_at datetime2 NULL,
        CONSTRAINT PK_AuthSession PRIMARY KEY (id_session),
        CONSTRAINT FK_AuthSession_Usuario FOREIGN KEY (id_usuario)
            REFERENCES dbo.Usuario(id_usuario) ON DELETE CASCADE,
        CONSTRAINT UQ_AuthSession_RefreshTokenHash UNIQUE (refresh_token_hash)
    );

    CREATE INDEX IX_AuthSession_Usuario_RevokedAt
        ON dbo.AuthSession (id_usuario, revoked_at);
END;
GO

IF COL_LENGTH(N'dbo.AuthSession', N'session_version') IS NULL
BEGIN
    ALTER TABLE dbo.AuthSession
        ADD session_version int NOT NULL
            CONSTRAINT DF_AuthSession_SessionVersion DEFAULT (1);
END;
GO
