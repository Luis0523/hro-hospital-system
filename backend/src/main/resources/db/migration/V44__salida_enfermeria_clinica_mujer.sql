-- =====================================================================
-- V44: etiqueta "Clínica de la Mujer" en salidas de Enfermería a Archivo
-- Hospital Regional de Occidente (HRO)
--
-- ADITIVA: amplía la restricción de tipos existente; no elimina ni modifica
-- registros. Los datos actuales siguen cumpliendo la nueva lista.
-- =====================================================================

ALTER TABLE salida_enfermeria_archivo
    DROP CONSTRAINT IF EXISTS ck_salida_enf_tipo;

ALTER TABLE salida_enfermeria_archivo
    ADD CONSTRAINT ck_salida_enf_tipo
    CHECK (tipo IN ('normal', 'privado_libertad', 'personal', 'presentacion', 'clinica_mujer'));

COMMENT ON COLUMN salida_enfermeria_archivo.tipo IS
    'Etiqueta de la salida: normal, privado_libertad, personal, presentacion o clinica_mujer.';
