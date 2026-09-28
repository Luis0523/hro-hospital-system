-- =====================================================================
-- SEEDS: Estaciones de enfermería y asignación de subespecialidades - HRO
-- Requiere haber aplicado la migración V12.
--
-- 4 estaciones de ejemplo. Cada subespecialidad queda asignada a una sola
-- estación (pertenencia única). Idempotente (ON CONFLICT DO NOTHING).
-- =====================================================================

-- 1. Estaciones
INSERT INTO estacion_enfermeria (codigo, nombre, ubicacion, activo)
VALUES
    ('EST-01', 'Consulta Externa — Medicina y Cardiología',        'Edificio Consulta Externa, Nivel 1', true),
    ('EST-02', 'Consulta Externa — Pediatría',                     'Edificio Consulta Externa, Nivel 2', true),
    ('EST-03', 'Consulta Externa — Ginecología y Obstetricia',     'Edificio Consulta Externa, Nivel 3', true),
    ('EST-04', 'Consulta Externa — Cirugía y Traumatología',       'Edificio Consulta Externa, Nivel 4', true)
ON CONFLICT (codigo) DO NOTHING;

-- 2. Asignación de subespecialidades por estación (pertenencia única)
-- EST-01: Medicina Interna / Cardiología
INSERT INTO estacion_subespecialidad (estacion_id, subespecialidad_id)
SELECT e.id, s.id
FROM estacion_enfermeria e, subespecialidad s
WHERE e.codigo = 'EST-01'
  AND s.nombre IN ('Medicina General', 'Cardiología Clínica')
ON CONFLICT DO NOTHING;

-- EST-02: Pediatría
INSERT INTO estacion_subespecialidad (estacion_id, subespecialidad_id)
SELECT e.id, s.id
FROM estacion_enfermeria e, subespecialidad s
WHERE e.codigo = 'EST-02'
  AND s.nombre IN ('Pediatría General', 'Control de Niño Sano', 'Pediatría Especializada')
ON CONFLICT DO NOTHING;

-- EST-03: Ginecología y Obstetricia
INSERT INTO estacion_subespecialidad (estacion_id, subespecialidad_id)
SELECT e.id, s.id
FROM estacion_enfermeria e, subespecialidad s
WHERE e.codigo = 'EST-03'
  AND s.nombre IN ('Ginecología General')
ON CONFLICT DO NOTHING;

-- EST-04: Cirugía y Traumatología
INSERT INTO estacion_subespecialidad (estacion_id, subespecialidad_id)
SELECT e.id, s.id
FROM estacion_enfermeria e, subespecialidad s
WHERE e.codigo = 'EST-04'
  AND s.nombre IN ('Cirugía General', 'Traumatología General')
ON CONFLICT DO NOTHING;

-- 3. Verificación: subespecialidades activas sin estación asignada
--    (consulta de control; no inserta datos)
-- SELECT s.id, s.nombre
--   FROM subespecialidad s
--  WHERE s.activo = TRUE
--    AND NOT EXISTS (SELECT 1 FROM estacion_subespecialidad es WHERE es.subespecialidad_id = s.id)
--  ORDER BY s.nombre;
