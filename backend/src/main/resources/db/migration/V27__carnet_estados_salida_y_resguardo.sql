-- =====================================================================
-- Migración V27: Nuevo circuito de estados del carnet
-- Hospital Regional de Occidente (HRO)
--
-- Redefinición operativa: ya no se marca la recepción en enfermería; el
-- circuito queda:
--   registrado -> encontrado | no_localizado
--   encontrado -> salida_archivo
--   salida_archivo -> salida_enfermeria
--   salida_enfermeria -> resguardado
--
-- Mapeo de los literales anteriores:
--   despachado        -> salida_archivo
--   recibido_estacion -> salida_archivo     (ya no se marca la recepción)
--   devuelto_estacion -> salida_enfermeria
--   recibido_archivo  -> resguardado
--
-- También se renombran las columnas de hitos para que reflejen el nuevo
-- significado, y se eliminan las que dejan de usarse (recepción en estación).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. Snapshot de seguridad (rollback manual). Se puede eliminar tras validar.
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS carnet_backup_v27;
CREATE TABLE carnet_backup_v27 AS SELECT * FROM carnet;

DROP TABLE IF EXISTS carnet_movimiento_backup_v27;
CREATE TABLE carnet_movimiento_backup_v27 AS SELECT * FROM carnet_movimiento;

-- ---------------------------------------------------------------------
-- 1. Renombrar columnas de hitos del carnet
-- ---------------------------------------------------------------------
ALTER TABLE carnet RENAME COLUMN despachado_por_id          TO salida_archivo_por_id;
ALTER TABLE carnet RENAME COLUMN despachado_en              TO salida_archivo_en;
ALTER TABLE carnet RENAME COLUMN devuelto_por_id            TO salida_enfermeria_por_id;
ALTER TABLE carnet RENAME COLUMN devuelto_en                TO salida_enfermeria_en;
ALTER TABLE carnet RENAME COLUMN recibido_archivo_por_id    TO resguardado_por_id;
ALTER TABLE carnet RENAME COLUMN recibido_archivo_en        TO resguardado_en;

-- Recepción en estación: ya no existe en el circuito.
ALTER TABLE carnet DROP COLUMN recibido_por_id;
ALTER TABLE carnet DROP COLUMN recibido_en;

-- ---------------------------------------------------------------------
-- 2. Quitar el CHECK viejo ANTES de remapear (si no, el UPDATE viola el CHECK)
-- ---------------------------------------------------------------------
ALTER TABLE carnet DROP CONSTRAINT IF EXISTS carnet_estado_check;

-- ---------------------------------------------------------------------
-- 3. Mapear los estados existentes al nuevo vocabulario
-- ---------------------------------------------------------------------
UPDATE carnet SET estado = 'salida_archivo'
 WHERE estado IN ('despachado', 'recibido_estacion');
UPDATE carnet SET estado = 'salida_enfermeria'
 WHERE estado = 'devuelto_estacion';
UPDATE carnet SET estado = 'resguardado'
 WHERE estado = 'recibido_archivo';

-- ---------------------------------------------------------------------
-- 4. Recrear el CHECK con los estados nuevos
-- ---------------------------------------------------------------------
ALTER TABLE carnet ADD CONSTRAINT carnet_estado_check
    CHECK (estado IN (
        'registrado','encontrado','no_localizado',
        'salida_archivo','salida_enfermeria','resguardado'
    ));

-- ---------------------------------------------------------------------
-- 4. Normalizar la bitácora (sin CHECK, pero por consistencia)
-- ---------------------------------------------------------------------
UPDATE carnet_movimiento SET estado_anterior = 'salida_archivo'
 WHERE estado_anterior IN ('despachado', 'recibido_estacion');
UPDATE carnet_movimiento SET estado_nuevo = 'salida_archivo'
 WHERE estado_nuevo IN ('despachado', 'recibido_estacion');

UPDATE carnet_movimiento SET estado_anterior = 'salida_enfermeria'
 WHERE estado_anterior = 'devuelto_estacion';
UPDATE carnet_movimiento SET estado_nuevo = 'salida_enfermeria'
 WHERE estado_nuevo = 'devuelto_estacion';

UPDATE carnet_movimiento SET estado_anterior = 'resguardado'
 WHERE estado_anterior = 'recibido_archivo';
UPDATE carnet_movimiento SET estado_nuevo = 'resguardado'
 WHERE estado_nuevo = 'recibido_archivo';

-- ---------------------------------------------------------------------
-- 5. Comentario del CHECK
-- ---------------------------------------------------------------------
COMMENT ON COLUMN carnet.estado IS
    'Estado del carnet en el circuito: registrado, encontrado, no_localizado, salida_archivo, salida_enfermeria, resguardado.';
