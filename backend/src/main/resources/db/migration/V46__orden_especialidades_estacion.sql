-- =====================================================================
-- V46: Orden personalizado de especialidades por estación
--
-- Cada estación puede definir el orden en que desea ver sus especialidades
-- médicas en los listados operativos. No modifica las asignaciones de
-- subespecialidades ni las clínicas físicas.
-- =====================================================================

CREATE TABLE estacion_especialidad_orden (
    id              BIGSERIAL PRIMARY KEY,
    estacion_id     BIGINT NOT NULL REFERENCES estacion_enfermeria(id) ON DELETE CASCADE,
    especialidad_id BIGINT NOT NULL REFERENCES especialidad(id) ON DELETE CASCADE,
    orden           INTEGER NOT NULL,
    actualizado_en  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_estacion_especialidad_orden UNIQUE (estacion_id, especialidad_id),
    CONSTRAINT ck_estacion_especialidad_orden_positivo CHECK (orden > 0)
);

CREATE INDEX idx_estacion_especialidad_orden
    ON estacion_especialidad_orden (estacion_id, orden);

COMMENT ON TABLE estacion_especialidad_orden IS
    'Orden de presentación de las especialidades médicas por estación de enfermería.';
