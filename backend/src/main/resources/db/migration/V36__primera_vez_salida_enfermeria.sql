-- =====================================================================
-- V36: Campo "primera vez" en salidas de Enfermería a Archivo
-- =====================================================================

ALTER TABLE salida_enfermeria_archivo
    ADD COLUMN primera_vez BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN salida_enfermeria_archivo.primera_vez IS
    'Marca si el expediente se entrega por primera vez a Archivo en la jornada.';
