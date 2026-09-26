-- =====================================================================
-- Migración V9: Actas de recepción de expedientes
-- Hospital Regional de Occidente (HRO)
--
-- Épica SCRUM-131 (Estación de Archivo). Un acta agrupa N expedientes
-- entregados/recibidos de una jornada/unidad, con quién entrega y quién
-- recibe. El detalle liga cada expediente incluido (y opcionalmente su cita).
-- =====================================================================

CREATE TABLE acta_recepcion (
    id                   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    numero_acta          VARCHAR(30)  NOT NULL UNIQUE,
    fecha                DATE         NOT NULL,
    subespecialidad_id   BIGINT       REFERENCES subespecialidad(id) ON DELETE SET NULL,
    usuario_entrega_id   BIGINT       NOT NULL REFERENCES usuario_referencia(id) ON DELETE RESTRICT,
    usuario_recibe_id    BIGINT       REFERENCES usuario_referencia(id) ON DELETE SET NULL,
    observaciones        TEXT,
    creado_por_id        BIGINT       NOT NULL REFERENCES usuario_referencia(id) ON DELETE RESTRICT,
    creado_en            TIMESTAMPTZ  NOT NULL DEFAULT now()
);

COMMENT ON TABLE acta_recepcion IS
    'Acta de entrega/recepción de expedientes físicos generada por la Estación de Archivo.';

CREATE TABLE acta_recepcion_detalle (
    id                   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    acta_recepcion_id    BIGINT NOT NULL REFERENCES acta_recepcion(id) ON DELETE CASCADE,
    expediente_id        UUID   NOT NULL REFERENCES expediente(id) ON DELETE RESTRICT,
    cita_id              BIGINT REFERENCES cita(id) ON DELETE SET NULL,
    UNIQUE (acta_recepcion_id, expediente_id)
);

CREATE INDEX idx_acta_recepcion_fecha ON acta_recepcion(fecha);
CREATE INDEX idx_acta_recepcion_detalle_acta ON acta_recepcion_detalle(acta_recepcion_id);
