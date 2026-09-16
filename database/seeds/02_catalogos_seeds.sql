-- =====================================================================
-- SEEDS: Catálogos Médicos y Calendario Institucional - HRO
-- =====================================================================

-- 1. Usuario de Referencia Inicial (Administrador)
INSERT INTO usuario_referencia (id_externo, nombre_mostrar, rol_principal, activo)
VALUES ('admin-hro-01', 'Administrador del Sistema HRO', 'administrador', true)
ON CONFLICT (id_externo) DO NOTHING;

-- 1.1 Usuarios de referencia por estación (para pruebas con autenticación simulada / JIT)
--     Los roles válidos son: personal_citas, enfermeria, medico, administrador, archivo.
INSERT INTO usuario_referencia (id_externo, nombre_mostrar, rol_principal, activo)
VALUES
    ('personal-citas-01', 'Operador de Ventanilla (Pruebas)', 'personal_citas', true),
    ('enfermeria-01',     'Enfermera de Consulta Externa (Pruebas)', 'enfermeria', true),
    ('medico-01',         'Médico de Consulta Externa (Pruebas)', 'medico', true),
    ('archivo-01',        'Encargado de Archivo (Pruebas)', 'archivo', true)
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
SELECT e.id, 'Pediatría Especializada', true FROM especialidad e WHERE e.nombre = 'Pediatría'
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

-- Clínica con atención restringida: Pediatría Especializada solo abre Lunes y Jueves
INSERT INTO clinica (subespecialidad_id, nombre, ubicacion, activo)
SELECT s.id, 'Clínica 203 - Pediatría Especializada', 'Edificio Consulta Externa, Nivel 2', true 
FROM subespecialidad s WHERE s.nombre = 'Pediatría Especializada' AND NOT EXISTS (SELECT 1 FROM clinica WHERE nombre = 'Clínica 203 - Pediatría Especializada');

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
--    Regla operativa: capacidad_maxima * duracion_consulta_minutos <= minutos de la jornada,
--    de modo que las horas escalonadas nunca se desborden del horario del médico.
--    Además, algunas clínicas solo abren ciertos días (p. ej. Pediatría Especializada: Lunes y Jueves).

-- Dr. Morales (COL-10452) en Clínica 101 - Medicina General: Lunes a Viernes, 07:00-13:00 (360 min)
-- 12 pacientes x 30 min = 360 min
INSERT INTO medico_clinica (medico_id, clinica_id, dia_semana, hora_inicio, hora_fin, capacidad_maxima, duracion_consulta_minutos, activo)
SELECT m.id, c.id, d.dia, '07:00:00'::time, '13:00:00'::time, 12, 30, true
FROM medico m, clinica c, (VALUES (1), (2), (3), (4), (5)) AS d(dia)
WHERE m.numero_colegiado = 'COL-10452' AND c.nombre = 'Clínica 101 - Medicina General'
ON CONFLICT (medico_id, clinica_id, dia_semana) DO UPDATE
   SET hora_inicio = EXCLUDED.hora_inicio, hora_fin = EXCLUDED.hora_fin,
       capacidad_maxima = EXCLUDED.capacidad_maxima, duracion_consulta_minutos = EXCLUDED.duracion_consulta_minutos,
       activo = EXCLUDED.activo;

-- Dra. Fuentes (COL-12890) en Clínica 102 - Cardiología: Lunes, Miércoles y Viernes, 08:00-12:00 (240 min)
-- 6 pacientes x 40 min = 240 min
INSERT INTO medico_clinica (medico_id, clinica_id, dia_semana, hora_inicio, hora_fin, capacidad_maxima, duracion_consulta_minutos, activo)
SELECT m.id, c.id, d.dia, '08:00:00'::time, '12:00:00'::time, 6, 40, true
FROM medico m, clinica c, (VALUES (1), (3), (5)) AS d(dia)
WHERE m.numero_colegiado = 'COL-12890' AND c.nombre = 'Clínica 102 - Cardiología'
ON CONFLICT (medico_id, clinica_id, dia_semana) DO UPDATE
   SET hora_inicio = EXCLUDED.hora_inicio, hora_fin = EXCLUDED.hora_fin,
       capacidad_maxima = EXCLUDED.capacidad_maxima, duracion_consulta_minutos = EXCLUDED.duracion_consulta_minutos,
       activo = EXCLUDED.activo;

-- Dr. Arreaga (COL-08741) en Clínica 201 - Pediatría: Lunes a Viernes, 07:30-13:30 (360 min)
-- 14 pacientes x 25 min = 350 min
INSERT INTO medico_clinica (medico_id, clinica_id, dia_semana, hora_inicio, hora_fin, capacidad_maxima, duracion_consulta_minutos, activo)
SELECT m.id, c.id, d.dia, '07:30:00'::time, '13:30:00'::time, 14, 25, true
FROM medico m, clinica c, (VALUES (1), (2), (3), (4), (5)) AS d(dia)
WHERE m.numero_colegiado = 'COL-08741' AND c.nombre = 'Clínica 201 - Pediatría'
ON CONFLICT (medico_id, clinica_id, dia_semana) DO UPDATE
   SET hora_inicio = EXCLUDED.hora_inicio, hora_fin = EXCLUDED.hora_fin,
       capacidad_maxima = EXCLUDED.capacidad_maxima, duracion_consulta_minutos = EXCLUDED.duracion_consulta_minutos,
       activo = EXCLUDED.activo;

-- Dra. Citalán (COL-14562) en Clínica 301 - Ginecología: Lunes, Miércoles y Viernes, 07:00-13:00 (360 min)
-- 12 pacientes x 30 min = 360 min
INSERT INTO medico_clinica (medico_id, clinica_id, dia_semana, hora_inicio, hora_fin, capacidad_maxima, duracion_consulta_minutos, activo)
SELECT m.id, c.id, d.dia, '07:00:00'::time, '13:00:00'::time, 12, 30, true
FROM medico m, clinica c, (VALUES (1), (3), (5)) AS d(dia)
WHERE m.numero_colegiado = 'COL-14562' AND c.nombre = 'Clínica 301 - Ginecología'
ON CONFLICT (medico_id, clinica_id, dia_semana) DO UPDATE
   SET hora_inicio = EXCLUDED.hora_inicio, hora_fin = EXCLUDED.hora_fin,
       capacidad_maxima = EXCLUDED.capacidad_maxima, duracion_consulta_minutos = EXCLUDED.duracion_consulta_minutos,
       activo = EXCLUDED.activo;

-- Dr. Vásquez (COL-09874) en Clínica 202 - Niño Sano: SOLO Lunes y Jueves, 08:00-12:00 (240 min)
-- 8 pacientes x 30 min = 240 min
INSERT INTO medico_clinica (medico_id, clinica_id, dia_semana, hora_inicio, hora_fin, capacidad_maxima, duracion_consulta_minutos, activo)
SELECT m.id, c.id, d.dia, '08:00:00'::time, '12:00:00'::time, 8, 30, true
FROM medico m, clinica c, (VALUES (1), (4)) AS d(dia)
WHERE m.numero_colegiado = 'COL-09874' AND c.nombre = 'Clínica 202 - Niño Sano'
ON CONFLICT (medico_id, clinica_id, dia_semana) DO UPDATE
   SET hora_inicio = EXCLUDED.hora_inicio, hora_fin = EXCLUDED.hora_fin,
       capacidad_maxima = EXCLUDED.capacidad_maxima, duracion_consulta_minutos = EXCLUDED.duracion_consulta_minutos,
       activo = EXCLUDED.activo;

-- Dra. Gómez (COL-13245) en Clínica 203 - Pediatría Especializada: SOLO Lunes y Jueves, 08:00-13:00 (300 min)
-- 10 pacientes x 30 min = 300 min
INSERT INTO medico_clinica (medico_id, clinica_id, dia_semana, hora_inicio, hora_fin, capacidad_maxima, duracion_consulta_minutos, activo)
SELECT m.id, c.id, d.dia, '08:00:00'::time, '13:00:00'::time, 10, 30, true
FROM medico m, clinica c, (VALUES (1), (4)) AS d(dia)
WHERE m.numero_colegiado = 'COL-13245' AND c.nombre = 'Clínica 203 - Pediatría Especializada'
ON CONFLICT (medico_id, clinica_id, dia_semana) DO UPDATE
   SET hora_inicio = EXCLUDED.hora_inicio, hora_fin = EXCLUDED.hora_fin,
       capacidad_maxima = EXCLUDED.capacidad_maxima, duracion_consulta_minutos = EXCLUDED.duracion_consulta_minutos,
       activo = EXCLUDED.activo;

-- Dr. Vásquez (COL-09874) en Clínica 402 - Traumatología: Martes y Viernes, 07:00-12:00 (300 min)
-- 10 pacientes x 30 min = 300 min
INSERT INTO medico_clinica (medico_id, clinica_id, dia_semana, hora_inicio, hora_fin, capacidad_maxima, duracion_consulta_minutos, activo)
SELECT m.id, c.id, d.dia, '07:00:00'::time, '12:00:00'::time, 10, 30, true
FROM medico m, clinica c, (VALUES (2), (5)) AS d(dia)
WHERE m.numero_colegiado = 'COL-09874' AND c.nombre = 'Clínica 402 - Traumatología'
ON CONFLICT (medico_id, clinica_id, dia_semana) DO UPDATE
   SET hora_inicio = EXCLUDED.hora_inicio, hora_fin = EXCLUDED.hora_fin,
       capacidad_maxima = EXCLUDED.capacidad_maxima, duracion_consulta_minutos = EXCLUDED.duracion_consulta_minutos,
       activo = EXCLUDED.activo;

-- Dra. Citalán (COL-14562) en Clínica 401 - Cirugía General: Martes y Jueves, 08:00-12:00 (240 min)
-- 6 pacientes x 40 min = 240 min
INSERT INTO medico_clinica (medico_id, clinica_id, dia_semana, hora_inicio, hora_fin, capacidad_maxima, duracion_consulta_minutos, activo)
SELECT m.id, c.id, d.dia, '08:00:00'::time, '12:00:00'::time, 6, 40, true
FROM medico m, clinica c, (VALUES (2), (4)) AS d(dia)
WHERE m.numero_colegiado = 'COL-14562' AND c.nombre = 'Clínica 401 - Cirugía General'
ON CONFLICT (medico_id, clinica_id, dia_semana) DO UPDATE
   SET hora_inicio = EXCLUDED.hora_inicio, hora_fin = EXCLUDED.hora_fin,
       capacidad_maxima = EXCLUDED.capacidad_maxima, duracion_consulta_minutos = EXCLUDED.duracion_consulta_minutos,
       activo = EXCLUDED.activo;

-- 6.1 Enlazar el usuario de referencia de pruebas con el Dr. Arreaga (COL-08741)
UPDATE medico m
   SET usuario_referencia_id = u.id
  FROM usuario_referencia u
 WHERE m.numero_colegiado = 'COL-08741'
   AND u.id_externo = 'medico-01';

-- 7. Permisos por clínica (para pruebas de autorización por estación)
--    Enfermería puede avanzar turnos en las clínicas de consulta externa.
INSERT INTO permiso_clinica (usuario_referencia_id, clinica_id, tipo_permiso)
SELECT u.id, c.id, 'avanzar_turno'
FROM usuario_referencia u, clinica c
WHERE u.id_externo = 'enfermeria-01'
  AND c.nombre IN (
      'Clínica 101 - Medicina General',
      'Clínica 201 - Pediatría',
      'Clínica 202 - Niño Sano',
      'Clínica 203 - Pediatría Especializada')
ON CONFLICT (usuario_referencia_id, clinica_id, tipo_permiso) DO NOTHING;

-- Ventanilla de citas puede autorizar cupos en Medicina General.
INSERT INTO permiso_clinica (usuario_referencia_id, clinica_id, tipo_permiso)
SELECT u.id, c.id, 'autorizar_cupo'
FROM usuario_referencia u, clinica c
WHERE u.id_externo = 'personal-citas-01'
  AND c.nombre = 'Clínica 101 - Medicina General'
ON CONFLICT (usuario_referencia_id, clinica_id, tipo_permiso) DO NOTHING;

-- 8. Días No Laborables Iniciales (Feriados Nacionales)
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
