-- =====================================================================
-- Migración V7: Estado activo en permisos por subespecialidad
-- Hospital Regional de Occidente (HRO)
--
-- La administración de permisos (épica backend admin SCRUM-109, historia
-- SCRUM-117 / subtarea SCRUM-125) requiere baja lógica y consulta de
-- permisos inactivos. Se agrega la columna `activo` (por defecto TRUE),
-- conservando la restricción única existente
-- (usuario_referencia_id, subespecialidad_id, tipo_permiso).
-- =====================================================================

ALTER TABLE permiso_subespecialidad
    ADD COLUMN activo BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN permiso_subespecialidad.activo IS
    'Baja lógica del permiso: FALSE indica permiso desactivado (no eliminado).';
