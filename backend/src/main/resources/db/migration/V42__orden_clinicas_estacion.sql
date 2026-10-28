-- =====================================================================
-- V42: Orden personalizado de clínicas por estación
--
-- Cada estación puede definir el orden en que desea ver sus clínicas en
-- Seguimiento de turnos (panel de clínicas y devoluciones).
-- =====================================================================

CREATE TABLE estacion_clinica_orden (
    id                 BIGSERIAL PRIMARY KEY,
    estacion_id        BIGINT NOT NULL REFERENCES estacion_enfermeria(id) ON DELETE CASCADE,
    espacio_fisico_id  UUID NOT NULL REFERENCES espacio_fisico(id) ON DELETE CASCADE,
    orden              INTEGER NOT NULL,
    actualizado_en     TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_estacion_clinica_orden UNIQUE (estacion_id, espacio_fisico_id)
);

CREATE INDEX idx_estacion_clinica_orden ON estacion_clinica_orden (estacion_id, orden);

COMMENT ON TABLE estacion_clinica_orden IS
    'Orden de presentación de las clínicas físicas por estación de enfermería.';
