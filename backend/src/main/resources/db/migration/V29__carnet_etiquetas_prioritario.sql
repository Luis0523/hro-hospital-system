-- =====================================================================
-- Migración V29: etiquetas del carnet (prioritario / privado de libertad)
-- Hospital Regional de Occidente (HRO)
--
-- Se agregan dos marcas independientes (pueden combinarse) que el operador
-- selecciona ANTES de registrar el carnet. Por ahora son solo etiquetas: no
-- alteran el flujo ni el correlativo.
-- =====================================================================

ALTER TABLE carnet ADD COLUMN IF NOT EXISTS prioritario      BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE carnet ADD COLUMN IF NOT EXISTS privado_libertad BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN carnet.prioritario IS 'Carnet marcado como prioritario al registrar.';
COMMENT ON COLUMN carnet.privado_libertad IS 'Carnet marcado como privado de libertad al registrar.';
