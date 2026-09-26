-- =====================================================================
-- SEEDS: Catálogos Médicos, Espacios Físicos y Calendario Institucional - HRO
-- (Adaptado al modelo V4: espacio físico separado de la subespecialidad)
-- =====================================================================

-- 1. Usuarios de Referencia
INSERT INTO usuario_referencia (id_externo, nombre_mostrar, rol_principal, activo)
VALUES ('admin-hro-01', 'Administrador del Sistema HRO', 'administrador', true)
ON CONFLICT (id_externo) DO NOTHING;

INSERT INTO usuario_referencia (id_externo, nombre_mostrar, rol_principal, activo)
VALUES
    ('personal-citas-01',   'Operador de Ventanilla (Pruebas)', 'personal_citas', true),
    ('enfermeria-01',       'Enfermera de Consulta Externa (Pruebas)', 'enfermeria', true),
    ('jefe-enfermeria-01',  'Jefe de Enfermería (Pruebas)', 'jefe_enfermeria', true),
    ('medico-01',           'Médico de Consulta Externa (Pruebas)', 'medico', true),
    ('archivo-01',          'Encargado de Archivo (Pruebas)', 'archivo', true)
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

-- 4. Espacios físicos (salas/consultorios). Ya NO se ligan a una subespecialidad.
INSERT INTO espacio_fisico (numero, nivel, capacidad_camillas, nombre, ubicacion, activo)
VALUES
    ('101', 1, 1, 'Sala 101', 'Edificio Consulta Externa, Nivel 1', true),
    ('102', 1, 1, 'Sala 102', 'Edificio Consulta Externa, Nivel 1', true),
    ('201', 2, 1, 'Sala 201', 'Edificio Consulta Externa, Nivel 2', true),
    ('202', 2, 1, 'Sala 202', 'Edificio Consulta Externa, Nivel 2', true),
    ('203', 2, 2, 'Sala 203', 'Edificio Consulta Externa, Nivel 2', true),
    ('301', 3, 1, 'Sala 301', 'Edificio Consulta Externa, Nivel 3', true),
    ('401', 4, 1, 'Sala 401', 'Edificio Consulta Externa, Nivel 4', true),
    ('402', 4, 1, 'Sala 402', 'Edificio Consulta Externa, Nivel 4', true)
ON CONFLICT (numero) DO NOTHING;

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

-- 6. Programación médico-subespecialidad (día, horario y capacidad).
--    Regla: capacidad_maxima * duracion <= minutos de la jornada.
--    Algunas subespecialidades solo abren ciertos días.

-- Dr. Morales (COL-10452) en Medicina General: Lunes a Viernes, 07:00-13:00 (360 min) -> 12 x 30
INSERT INTO medico_subespecialidad (medico_id, subespecialidad_id, dia_semana, hora_inicio, hora_fin, capacidad_maxima, duracion_consulta_minutos, activo)
SELECT m.id, s.id, d.dia, '07:00:00'::time, '13:00:00'::time, 12, 30, true
FROM medico m, subespecialidad s, (VALUES (1), (2), (3), (4), (5)) AS d(dia)
WHERE m.numero_colegiado = 'COL-10452' AND s.nombre = 'Medicina General'
ON CONFLICT (medico_id, subespecialidad_id, dia_semana) DO UPDATE
   SET hora_inicio = EXCLUDED.hora_inicio, hora_fin = EXCLUDED.hora_fin,
       capacidad_maxima = EXCLUDED.capacidad_maxima, duracion_consulta_minutos = EXCLUDED.duracion_consulta_minutos,
       activo = EXCLUDED.activo;

-- Dra. Fuentes (COL-12890) en Cardiología Clínica: Lunes, Miércoles y Viernes, 08:00-12:00 -> 6 x 40
INSERT INTO medico_subespecialidad (medico_id, subespecialidad_id, dia_semana, hora_inicio, hora_fin, capacidad_maxima, duracion_consulta_minutos, activo)
SELECT m.id, s.id, d.dia, '08:00:00'::time, '12:00:00'::time, 6, 40, true
FROM medico m, subespecialidad s, (VALUES (1), (3), (5)) AS d(dia)
WHERE m.numero_colegiado = 'COL-12890' AND s.nombre = 'Cardiología Clínica'
ON CONFLICT (medico_id, subespecialidad_id, dia_semana) DO UPDATE
   SET hora_inicio = EXCLUDED.hora_inicio, hora_fin = EXCLUDED.hora_fin,
       capacidad_maxima = EXCLUDED.capacidad_maxima, duracion_consulta_minutos = EXCLUDED.duracion_consulta_minutos,
       activo = EXCLUDED.activo;

-- Dr. Arreaga (COL-08741) en Pediatría General: Lunes a Viernes, 07:30-13:30 -> 14 x 25
INSERT INTO medico_subespecialidad (medico_id, subespecialidad_id, dia_semana, hora_inicio, hora_fin, capacidad_maxima, duracion_consulta_minutos, activo)
SELECT m.id, s.id, d.dia, '07:30:00'::time, '13:30:00'::time, 14, 25, true
FROM medico m, subespecialidad s, (VALUES (1), (2), (3), (4), (5)) AS d(dia)
WHERE m.numero_colegiado = 'COL-08741' AND s.nombre = 'Pediatría General'
ON CONFLICT (medico_id, subespecialidad_id, dia_semana) DO UPDATE
   SET hora_inicio = EXCLUDED.hora_inicio, hora_fin = EXCLUDED.hora_fin,
       capacidad_maxima = EXCLUDED.capacidad_maxima, duracion_consulta_minutos = EXCLUDED.duracion_consulta_minutos,
       activo = EXCLUDED.activo;

-- Dra. Citalán (COL-14562) en Ginecología General: Lunes, Miércoles y Viernes, 07:00-13:00 -> 12 x 30
INSERT INTO medico_subespecialidad (medico_id, subespecialidad_id, dia_semana, hora_inicio, hora_fin, capacidad_maxima, duracion_consulta_minutos, activo)
SELECT m.id, s.id, d.dia, '07:00:00'::time, '13:00:00'::time, 12, 30, true
FROM medico m, subespecialidad s, (VALUES (1), (3), (5)) AS d(dia)
WHERE m.numero_colegiado = 'COL-14562' AND s.nombre = 'Ginecología General'
ON CONFLICT (medico_id, subespecialidad_id, dia_semana) DO UPDATE
   SET hora_inicio = EXCLUDED.hora_inicio, hora_fin = EXCLUDED.hora_fin,
       capacidad_maxima = EXCLUDED.capacidad_maxima, duracion_consulta_minutos = EXCLUDED.duracion_consulta_minutos,
       activo = EXCLUDED.activo;

-- Dr. Vásquez (COL-09874) en Control de Niño Sano: SOLO Lunes y Jueves, 08:00-12:00 -> 8 x 30
INSERT INTO medico_subespecialidad (medico_id, subespecialidad_id, dia_semana, hora_inicio, hora_fin, capacidad_maxima, duracion_consulta_minutos, activo)
SELECT m.id, s.id, d.dia, '08:00:00'::time, '12:00:00'::time, 8, 30, true
FROM medico m, subespecialidad s, (VALUES (1), (4)) AS d(dia)
WHERE m.numero_colegiado = 'COL-09874' AND s.nombre = 'Control de Niño Sano'
ON CONFLICT (medico_id, subespecialidad_id, dia_semana) DO UPDATE
   SET hora_inicio = EXCLUDED.hora_inicio, hora_fin = EXCLUDED.hora_fin,
       capacidad_maxima = EXCLUDED.capacidad_maxima, duracion_consulta_minutos = EXCLUDED.duracion_consulta_minutos,
       activo = EXCLUDED.activo;

-- Dra. Gómez (COL-13245) en Pediatría Especializada: SOLO Lunes y Jueves, 08:00-13:00 -> 10 x 30
INSERT INTO medico_subespecialidad (medico_id, subespecialidad_id, dia_semana, hora_inicio, hora_fin, capacidad_maxima, duracion_consulta_minutos, activo)
SELECT m.id, s.id, d.dia, '08:00:00'::time, '13:00:00'::time, 10, 30, true
FROM medico m, subespecialidad s, (VALUES (1), (4)) AS d(dia)
WHERE m.numero_colegiado = 'COL-13245' AND s.nombre = 'Pediatría Especializada'
ON CONFLICT (medico_id, subespecialidad_id, dia_semana) DO UPDATE
   SET hora_inicio = EXCLUDED.hora_inicio, hora_fin = EXCLUDED.hora_fin,
       capacidad_maxima = EXCLUDED.capacidad_maxima, duracion_consulta_minutos = EXCLUDED.duracion_consulta_minutos,
       activo = EXCLUDED.activo;

-- Dr. Vásquez (COL-09874) en Traumatología General: Martes y Viernes, 07:00-12:00 -> 10 x 30
INSERT INTO medico_subespecialidad (medico_id, subespecialidad_id, dia_semana, hora_inicio, hora_fin, capacidad_maxima, duracion_consulta_minutos, activo)
SELECT m.id, s.id, d.dia, '07:00:00'::time, '12:00:00'::time, 10, 30, true
FROM medico m, subespecialidad s, (VALUES (2), (5)) AS d(dia)
WHERE m.numero_colegiado = 'COL-09874' AND s.nombre = 'Traumatología General'
ON CONFLICT (medico_id, subespecialidad_id, dia_semana) DO UPDATE
   SET hora_inicio = EXCLUDED.hora_inicio, hora_fin = EXCLUDED.hora_fin,
       capacidad_maxima = EXCLUDED.capacidad_maxima, duracion_consulta_minutos = EXCLUDED.duracion_consulta_minutos,
       activo = EXCLUDED.activo;

-- Dra. Citalán (COL-14562) en Cirugía General: Martes y Jueves, 08:00-12:00 -> 6 x 40
INSERT INTO medico_subespecialidad (medico_id, subespecialidad_id, dia_semana, hora_inicio, hora_fin, capacidad_maxima, duracion_consulta_minutos, activo)
SELECT m.id, s.id, d.dia, '08:00:00'::time, '12:00:00'::time, 6, 40, true
FROM medico m, subespecialidad s, (VALUES (2), (4)) AS d(dia)
WHERE m.numero_colegiado = 'COL-14562' AND s.nombre = 'Cirugía General'
ON CONFLICT (medico_id, subespecialidad_id, dia_semana) DO UPDATE
   SET hora_inicio = EXCLUDED.hora_inicio, hora_fin = EXCLUDED.hora_fin,
       capacidad_maxima = EXCLUDED.capacidad_maxima, duracion_consulta_minutos = EXCLUDED.duracion_consulta_minutos,
       activo = EXCLUDED.activo;

-- 6.1 Enlazar el usuario de referencia de pruebas con el Dr. Arreaga (COL-08741)
UPDATE medico m
   SET usuario_referencia_id = u.id
  FROM usuario_referencia u
 WHERE m.numero_colegiado = 'COL-08741'
   AND u.id_externo = 'medico-01';

-- 7. Permisos por subespecialidad (no por sala física)
INSERT INTO permiso_subespecialidad (usuario_referencia_id, subespecialidad_id, tipo_permiso)
SELECT u.id, s.id, 'avanzar_turno'
FROM usuario_referencia u, subespecialidad s
WHERE u.id_externo = 'enfermeria-01'
  AND s.nombre IN ('Medicina General', 'Pediatría General', 'Control de Niño Sano', 'Pediatría Especializada')
ON CONFLICT (usuario_referencia_id, subespecialidad_id, tipo_permiso) DO NOTHING;

INSERT INTO permiso_subespecialidad (usuario_referencia_id, subespecialidad_id, tipo_permiso)
SELECT u.id, s.id, 'autorizar_cupo'
FROM usuario_referencia u, subespecialidad s
WHERE u.id_externo = 'personal-citas-01'
  AND s.nombre = 'Medicina General'
ON CONFLICT (usuario_referencia_id, subespecialidad_id, tipo_permiso) DO NOTHING;

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
