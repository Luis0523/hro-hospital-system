-- =====================================================================
-- SEEDS: Catálogos Médicos y Calendario Institucional - HRO
-- =====================================================================

-- 1. Usuario de Referencia Inicial (Administrador)
INSERT INTO usuario_referencia (id_externo, nombre_mostrar, rol_principal, activo)
VALUES ('admin-hro-01', 'Administrador del Sistema HRO', 'administrador', true)
ON CONFLICT (id_externo) DO NOTHING;

-- 2. Especialidades Médicas
INSERT INTO especialidad (nombre, activo)
VALUES 
    ('Medicina Interna', true),
    ('Pediatría', true),
    ('Ginecología y Obstetricia', true),
    ('Cirugía General', true),
    ('Traumatología y Ortopedia', true),
    ('Cardiología', true)
ON CONFLICT (nombre) DO NOTHING;

-- 3. Subespecialidades
INSERT INTO subespecialidad (especialidad_id, nombre, activo)
SELECT e.id, 'Medicina General', true FROM especialidad e WHERE e.nombre = 'Medicina Interna'
ON CONFLICT (especialidad_id, nombre) DO NOTHING;

INSERT INTO subespecialidad (especialidad_id, nombre, activo)
SELECT e.id, 'Cardiología Clínica', true FROM especialidad e WHERE e.nombre = 'Cardiología'
ON CONFLICT (especialidad_id, nombre) DO NOTHING;

INSERT INTO subespecialidad (especialidad_id, nombre, activo)
SELECT e.id, 'Pediatría General', true FROM especialidad e WHERE e.nombre = 'Pediatría'
ON CONFLICT (especialidad_id, nombre) DO NOTHING;

INSERT INTO subespecialidad (especialidad_id, nombre, activo)
SELECT e.id, 'Control de Niño Sano', true FROM especialidad e WHERE e.nombre = 'Pediatría'
ON CONFLICT (especialidad_id, nombre) DO NOTHING;

INSERT INTO subespecialidad (especialidad_id, nombre, activo)
SELECT e.id, 'Ginecología General', true FROM especialidad e WHERE e.nombre = 'Ginecología y Obstetricia'
ON CONFLICT (especialidad_id, nombre) DO NOTHING;

INSERT INTO subespecialidad (especialidad_id, nombre, activo)
SELECT e.id, 'Cirugía General', true FROM especialidad e WHERE e.nombre = 'Cirugía General'
ON CONFLICT (especialidad_id, nombre) DO NOTHING;

INSERT INTO subespecialidad (especialidad_id, nombre, activo)
SELECT e.id, 'Traumatología General', true FROM especialidad e WHERE e.nombre = 'Traumatología y Ortopedia'
ON CONFLICT (especialidad_id, nombre) DO NOTHING;

-- 4. Clínicas / Consultorios
INSERT INTO clinica (subespecialidad_id, nombre, ubicacion, activo)
SELECT s.id, 'Clínica 101 - Medicina General', 'Edificio Consulta Externa, Nivel 1', true 
FROM subespecialidad s WHERE s.nombre = 'Medicina General' AND NOT EXISTS (SELECT 1 FROM clinica WHERE nombre = 'Clínica 101 - Medicina General');

INSERT INTO clinica (subespecialidad_id, nombre, ubicacion, activo)
SELECT s.id, 'Clínica 102 - Cardiología', 'Edificio Consulta Externa, Nivel 1', true 
FROM subespecialidad s WHERE s.nombre = 'Cardiología Clínica' AND NOT EXISTS (SELECT 1 FROM clinica WHERE nombre = 'Clínica 102 - Cardiología');

INSERT INTO clinica (subespecialidad_id, nombre, ubicacion, activo)
SELECT s.id, 'Clínica 201 - Pediatría', 'Edificio Consulta Externa, Nivel 2', true 
FROM subespecialidad s WHERE s.nombre = 'Pediatría General' AND NOT EXISTS (SELECT 1 FROM clinica WHERE nombre = 'Clínica 201 - Pediatría');

INSERT INTO clinica (subespecialidad_id, nombre, ubicacion, activo)
SELECT s.id, 'Clínica 202 - Niño Sano', 'Edificio Consulta Externa, Nivel 2', true 
FROM subespecialidad s WHERE s.nombre = 'Control de Niño Sano' AND NOT EXISTS (SELECT 1 FROM clinica WHERE nombre = 'Clínica 202 - Niño Sano');

INSERT INTO clinica (subespecialidad_id, nombre, ubicacion, activo)
SELECT s.id, 'Clínica 301 - Ginecología', 'Edificio Consulta Externa, Nivel 3', true 
FROM subespecialidad s WHERE s.nombre = 'Ginecología General' AND NOT EXISTS (SELECT 1 FROM clinica WHERE nombre = 'Clínica 301 - Ginecología');

INSERT INTO clinica (subespecialidad_id, nombre, ubicacion, activo)
SELECT s.id, 'Clínica 401 - Cirugía General', 'Edificio Consulta Externa, Nivel 4', true 
FROM subespecialidad s WHERE s.nombre = 'Cirugía General' AND NOT EXISTS (SELECT 1 FROM clinica WHERE nombre = 'Clínica 401 - Cirugía General');

INSERT INTO clinica (subespecialidad_id, nombre, ubicacion, activo)
SELECT s.id, 'Clínica 402 - Traumatología', 'Edificio Consulta Externa, Nivel 4', true 
FROM subespecialidad s WHERE s.nombre = 'Traumatología General' AND NOT EXISTS (SELECT 1 FROM clinica WHERE nombre = 'Clínica 402 - Traumatología');

-- 5. Médicos Especialistas
INSERT INTO medico (nombres, numero_colegiado, activo)
VALUES
    ('Dr. Juan Luis Morales Castillo', 'COL-10452', true),
    ('Dra. Carmen Lucía Fuentes Ramos', 'COL-12890', true),
    ('Dr. Otto René Arreaga Cifuentes', 'COL-08741', true),
    ('Dra. Ana Patricia Citalán Rodas', 'COL-14562', true),
    ('Dr. Hugo Rolando Vásquez Méndez', 'COL-09874', true),
    ('Dra. Sofía Marisol Gómez López', 'COL-13245', true)
ON CONFLICT (numero_colegiado) DO NOTHING;

-- 6. Asignación Médico - Clínica con Horarios y Cupos
-- Dr. Morales en Clínica 101 (Lunes a Viernes, 07:00 a 13:00, cap. 20)
INSERT INTO medico_clinica (medico_id, clinica_id, dia_semana, hora_inicio, hora_fin, capacidad_maxima, duracion_consulta_minutos, activo)
SELECT m.id, c.id, d.dia, '07:00:00'::time, '13:00:00'::time, 20, 30, true
FROM medico m, clinica c, (VALUES (1), (2), (3), (4), (5)) AS d(dia)
WHERE m.numero_colegiado = 'COL-10452' AND c.nombre = 'Clínica 101 - Medicina General'
ON CONFLICT (medico_id, clinica_id, dia_semana) DO NOTHING;

-- Dra. Fuentes en Clínica 102 (Lunes, Miércoles, Viernes, 08:00 a 12:00, cap. 12)
INSERT INTO medico_clinica (medico_id, clinica_id, dia_semana, hora_inicio, hora_fin, capacidad_maxima, duracion_consulta_minutos, activo)
SELECT m.id, c.id, d.dia, '08:00:00'::time, '12:00:00'::time, 12, 40, true
FROM medico m, clinica c, (VALUES (1), (3), (5)) AS d(dia)
WHERE m.numero_colegiado = 'COL-12890' AND c.nombre = 'Clínica 102 - Cardiología'
ON CONFLICT (medico_id, clinica_id, dia_semana) DO NOTHING;

-- Dr. Arreaga en Clínica 201 (Lunes a Viernes, 07:30 a 13:30, cap. 25)
INSERT INTO medico_clinica (medico_id, clinica_id, dia_semana, hora_inicio, hora_fin, capacidad_maxima, duracion_consulta_minutos, activo)
SELECT m.id, c.id, d.dia, '07:30:00'::time, '13:30:00'::time, 25, 25, true
FROM medico m, clinica c, (VALUES (1), (2), (3), (4), (5)) AS d(dia)
WHERE m.numero_colegiado = 'COL-08741' AND c.nombre = 'Clínica 201 - Pediatría'
ON CONFLICT (medico_id, clinica_id, dia_semana) DO NOTHING;

-- 7. Días No Laborables Iniciales (Feriados Nacionales)
INSERT INTO dia_no_laborable (fecha, motivo, creado_por)
SELECT '2026-09-15', 'Día de la Independencia Patria', u.id
FROM usuario_referencia u WHERE u.id_externo = 'admin-hro-01'
ON CONFLICT (fecha) DO NOTHING;

INSERT INTO dia_no_laborable (fecha, motivo, creado_por)
SELECT '2026-10-20', 'Día de la Revolución de Octubre', u.id
FROM usuario_referencia u WHERE u.id_externo = 'admin-hro-01'
ON CONFLICT (fecha) DO NOTHING;

INSERT INTO dia_no_laborable (fecha, motivo, creado_por)
SELECT '2026-11-01', 'Día de Todos los Santos', u.id
FROM usuario_referencia u WHERE u.id_externo = 'admin-hro-01'
ON CONFLICT (fecha) DO NOTHING;

INSERT INTO dia_no_laborable (fecha, motivo, creado_por)
SELECT '2026-12-25', 'Fiesta de Navidad', u.id
FROM usuario_referencia u WHERE u.id_externo = 'admin-hro-01'
ON CONFLICT (fecha) DO NOTHING;
