-- V45: fecha de la próxima visita indicada por Enfermería al citar.
ALTER TABLE turno_estacion
    ADD COLUMN proxima_visita DATE;

COMMENT ON COLUMN turno_estacion.proxima_visita IS
    'Fecha de la próxima visita indicada por Enfermería durante la etapa Citar.';
