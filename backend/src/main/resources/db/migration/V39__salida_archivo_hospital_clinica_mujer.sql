-- =====================================================================
-- Migración V39: marca de Clínica de la Mujer en salidas de archivo
-- Hospital Regional de Occidente (HRO)
--
-- Permite identificar las salidas de expedientes que corresponden a la
-- Clínica de la Mujer para alimentar la estadística diaria por estación.
-- =====================================================================

ALTER TABLE salida_archivo_hospital
    ADD COLUMN es_clinica_mujer BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN salida_archivo_hospital.es_clinica_mujer IS
    'TRUE si el expediente corresponde a la Clínica de la Mujer.';
