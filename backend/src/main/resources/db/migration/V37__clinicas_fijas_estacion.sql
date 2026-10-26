-- =====================================================================
-- V37: Clínica fija por estación y especialidad
--
-- Estaciones con asignación estable (p. ej. Cirugía/Ginecología) pueden
-- tener una clínica fija por especialidad. Si existe, el turno nace con esa
-- clínica y el paso Recibir/Repartir no requiere seleccionarla de nuevo.
-- =====================================================================

CREATE TABLE clinica_fija_estacion (
    id                 BIGSERIAL PRIMARY KEY,
    estacion_id        BIGINT NOT NULL REFERENCES estacion_enfermeria(id) ON DELETE CASCADE,
    especialidad_id    BIGINT NOT NULL REFERENCES especialidad(id) ON DELETE CASCADE,
    espacio_fisico_id  UUID NOT NULL REFERENCES espacio_fisico(id) ON DELETE RESTRICT,
    activo             BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en          TIMESTAMPTZ NOT NULL DEFAULT now(),
    actualizado_en     TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_clinica_fija_estacion_especialidad UNIQUE (estacion_id, especialidad_id)
);

CREATE INDEX idx_clinica_fija_estacion ON clinica_fija_estacion (estacion_id, activo);

COMMENT ON TABLE clinica_fija_estacion IS
    'Clínica estable por especialidad dentro de una estación de enfermería.';
