-- =====================================================================
-- V33: Registro agregado de devoluciones por clínica
--
-- Cuando el expediente regresa sin el carnet no es posible identificar el
-- turno/correlativo. En la etapa Devuelto solo se descuenta el conteo de la
-- clínica. Se conserva cada devolución para poder deshacer correcciones.
-- =====================================================================

CREATE TABLE devolucion_clinica (
    id                      BIGSERIAL PRIMARY KEY,
    estacion_id             BIGINT NOT NULL REFERENCES estacion_enfermeria(id) ON DELETE RESTRICT,
    espacio_fisico_id       UUID NOT NULL REFERENCES espacio_fisico(id) ON DELETE RESTRICT,
    fecha                   DATE NOT NULL,
    usuario_referencia_id   BIGINT REFERENCES usuario_referencia(id) ON DELETE SET NULL,
    creado_en               TIMESTAMPTZ NOT NULL DEFAULT now(),
    revertido_en            TIMESTAMPTZ,
    revertido_por_id        BIGINT REFERENCES usuario_referencia(id) ON DELETE SET NULL,
    observacion             TEXT
);

CREATE INDEX idx_devolucion_clinica_fecha_estacion
    ON devolucion_clinica (fecha, estacion_id);

CREATE INDEX idx_devolucion_clinica_clinica_fecha
    ON devolucion_clinica (espacio_fisico_id, fecha);

COMMENT ON TABLE devolucion_clinica IS
    'Devoluciones agregadas por clínica y fecha. No se asocian a un turno individual.';
