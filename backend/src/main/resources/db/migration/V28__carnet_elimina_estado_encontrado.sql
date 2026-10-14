-- =====================================================================
-- Migración V28: Elimina el estado "encontrado" del circuito del carnet
-- Hospital Regional de Occidente (HRO)
--
-- Redefinición operativa: ya no se marca "encontrado" antes de la salida;
-- registrar la salida de archivo implica que el expediente fue ubicado.
-- El circuito queda:
--   registrado -> no_localizado   (rama; requiere observación)
--   registrado -> salida_archivo
--   no_localizado -> salida_archivo
--   salida_archivo -> salida_enfermeria
--   salida_enfermeria -> resguardado
--
-- Se eliminan las columnas de hitos de "encontrado" y se remapean las filas
-- existentes en ese estado a "registrado" (vuelven a la cola de pendientes).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. Snapshot de seguridad (rollback manual). Se puede eliminar tras validar.
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS carnet_backup_v28;
CREATE TABLE carnet_backup_v28 AS SELECT * FROM carnet;

DROP TABLE IF EXISTS carnet_movimiento_backup_v28;
CREATE TABLE carnet_movimiento_backup_v28 AS SELECT * FROM carnet_movimiento;

-- ---------------------------------------------------------------------
-- 1. Quitar el CHECK viejo ANTES de remapear (si no, el UPDATE viola el CHECK)
-- ---------------------------------------------------------------------
ALTER TABLE carnet DROP CONSTRAINT IF EXISTS carnet_estado_check;

-- ---------------------------------------------------------------------
-- 2. Remapear los carnets "encontrado" a "registrado" (pendientes de salida)
-- ---------------------------------------------------------------------
UPDATE carnet SET estado = 'registrado'
 WHERE estado = 'encontrado';

-- ---------------------------------------------------------------------
-- 3. Normalizar la bitácora (sin CHECK, pero por consistencia)
-- ---------------------------------------------------------------------
UPDATE carnet_movimiento SET estado_anterior = 'registrado'
 WHERE estado_anterior = 'encontrado';
UPDATE carnet_movimiento SET estado_nuevo = 'registrado'
 WHERE estado_nuevo = 'encontrado';

-- ---------------------------------------------------------------------
-- 4. Eliminar las columnas de hitos de "encontrado"
-- ---------------------------------------------------------------------
ALTER TABLE carnet DROP COLUMN IF EXISTS encontrado_por_id;
ALTER TABLE carnet DROP COLUMN IF EXISTS encontrado_en;

-- ---------------------------------------------------------------------
-- 5. Recrear el CHECK con los estados vigentes
-- ---------------------------------------------------------------------
ALTER TABLE carnet ADD CONSTRAINT carnet_estado_check
    CHECK (estado IN (
        'registrado','no_localizado',
        'salida_archivo','salida_enfermeria','resguardado'
    ));

-- ---------------------------------------------------------------------
-- 6. Comentario del CHECK
-- ---------------------------------------------------------------------
COMMENT ON COLUMN carnet.estado IS
    'Estado del carnet en el circuito: registrado, no_localizado, salida_archivo, salida_enfermeria, resguardado.';
