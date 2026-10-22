-- =====================================================================
-- V34: Tipo de registro del turno de estación
-- Permite conservar las presentaciones y privados de libertad y contarlos
-- por clínica en el resumen de devoluciones.
-- =====================================================================

ALTER TABLE turno_estacion
    ADD COLUMN tipo_registro VARCHAR(30);

ALTER TABLE turno_estacion
    ADD CONSTRAINT ck_turno_estacion_tipo_registro
    CHECK (tipo_registro IS NULL OR tipo_registro IN ('presentacion', 'privado_libertad'));

COMMENT ON COLUMN turno_estacion.tipo_registro IS
    'Marca operativa del turno: presentacion, privado_libertad o NULL.';
