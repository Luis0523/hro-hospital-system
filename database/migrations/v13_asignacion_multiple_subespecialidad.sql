-- =====================================================================
-- Migración V13: varias subespecialidades por espacio físico y fecha
-- Hospital Regional de Occidente (HRO)
--
-- Motivación de negocio:
--   Una sala puede atender más de una subespecialidad en el mismo día
--   (salas con mayor capacidad) y la "reasignación en caliente" debe poder
--   agregar una subespecialidad a una sala ya ocupada.
--
--   Se elimina la restricción UNIQUE(espacio_fisico_id, fecha). La unicidad
--   pasa a ser (espacio_fisico_id, fecha, subespecialidad_id): no se repite
--   la MISMA subespecialidad en la misma sala/fecha.
-- =====================================================================

ALTER TABLE asignacion_diaria_espacio
    DROP CONSTRAINT IF EXISTS uq_asignacion_espacio_fecha;

ALTER TABLE asignacion_diaria_espacio
    ADD CONSTRAINT uq_asignacion_espacio_fecha_sub
        UNIQUE (espacio_fisico_id, fecha, subespecialidad_id);
