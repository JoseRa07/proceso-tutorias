USE SistemaTutorias;
GO

-- =========================
-- ROLES
-- =========================
INSERT INTO rol (nombre) VALUES 
('ADMIN'),
('ALUMNO'),
('TUTOR'),
('MAESTRO');

-- =========================
-- CARRERAS
-- =========================
INSERT INTO Carrera (nombre, siglas) VALUES 
('Ingeniería en Desarrollo y Gestión de Software', 'IDGS'),
('Ingeniería Civil', 'IC');

-- =========================
-- CUATRIMESTRE
-- =========================
INSERT INTO Cuatrimestre (nombre, activo)
VALUES ('ENE-ABRIL-2026', 1);

-- =========================
-- USUARIOS
-- =========================

-- ADMIN (id_rol = 1)
INSERT INTO Usuario (nombre, apellidos, correo, telefono, contrasena_hash, id_rol)
VALUES ('Juan', 'Pérez López', 'admin@utnay.edu.mx', '3111234567', 'admin', 1);

-- ALUMNO (id_rol = 2)
INSERT INTO Usuario (nombre, apellidos, correo, telefono, contrasena_hash, id_rol)
VALUES ('José', 'Av', 'alumno@utnay.edu.mx', '3111234567', 'alumno', 2);

-- TUTOR (id_rol = 3)
INSERT INTO Usuario (nombre, apellidos, correo, telefono, contrasena_hash, id_rol)
VALUES ('Juan', 'Tovar', 'tutor@utnay.edu.mx', '3111234567', 'tutor', 3);

-- MAESTRO SIN TUTOR (id_rol = 4)
INSERT INTO Usuario (nombre, apellidos, correo, telefono, contrasena_hash, id_rol)
VALUES ('Silvia', 'Castrejón', 'maestro@utnay.edu.mx', '3111234567', 'admin', 4);

-- OTRO ALUMNO
INSERT INTO Usuario (nombre, apellidos, correo, telefono, contrasena_hash, id_rol)
VALUES ('Pedrito', 'Pérez López', 'alumno2@utnay.edu.mx', '3111234567', 'alumno2', 2);

-- =========================
-- MAESTROS
-- =========================
INSERT INTO Maestro (id_usuario, cod_empleado, vigencia)
VALUES 
(3, 'EMP-001', '2028-12-04'),
(4, 'EMP-002', '2028-12-04');

-- =========================
-- TUTOR
-- =========================
INSERT INTO Tutor (id_maestro)
VALUES (1);

-- =========================
-- GRUPO
-- =========================
INSERT INTO Grupo (nombre_grupo, id_tutor, id_carrera)
VALUES ('81', 1, 1);

-- =========================
-- ALUMNOS
-- =========================
INSERT INTO Alumno (id_usuario, matricula, id_grupo)
VALUES 
(2, 'TIC-31123', 1);

-- =========================
-- GRUPO CUATRIMESTRE
-- =========================
INSERT INTO GrupoCuatrimestre (id_grupo, id_cuatrimestre, activo)
VALUES (1, 1, 1);