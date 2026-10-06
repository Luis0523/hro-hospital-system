-- =====================================================================
-- Migración v14: cita opcional en expediente_ciclo
-- Hospital Regional de Occidente (HRO)
--
-- Fase 1: el check-in de un expediente NO valida la existencia de una cita;
-- el ciclo puede crearse sin cita asociada. La validación de cita se habilitará
-- en una fase posterior, por lo que la columna queda nullable de forma temporal.
-- =====================================================================

ALTER TABLE expediente_ciclo ALTER COLUMN cita_id DROP NOT NULL;

COMMENT ON COLUMN expediente_ciclo.cita_id IS
    'Cita asociada al viaje. Nullable durante la Fase 1: el check-in no valida cita; se habilitará la obligatoriedad en una fase posterior.';
