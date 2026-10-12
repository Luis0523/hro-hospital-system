-- =====================================================================
-- Migración V24: abreviatura configurable de la especialidad
-- Hospital Regional de Occidente (HRO)
--
-- El correlativo del carnet se muestra como "ABREV-correlativo" (p. ej. PED-3)
-- para que el personal identifique rápido la especialidad. La sigla la define
-- el personal (jefe de enfermería / administrador) y no se calcula sola, para
-- respetar los acrónimos que ya usan.
-- =====================================================================

ALTER TABLE especialidad ADD COLUMN abreviatura VARCHAR(20);

COMMENT ON COLUMN especialidad.abreviatura IS
    'Sigla visible del carnet (p. ej. MI, PED). Configurable por el personal.';
