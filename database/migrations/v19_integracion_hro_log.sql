-- =====================================================================
-- Migración v19: bitácora de integración con el API del hospital (FHIR)
-- Hospital Regional de Occidente (HRO)
-- =====================================================================

CREATE TABLE integracion_hro_log (
    id                     BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    numero_expediente      VARCHAR(30),
    url                    TEXT,
    metodo                 VARCHAR(10),
    estado_http            INT,
    exitoso                BOOLEAN      NOT NULL DEFAULT FALSE,
    duracion_ms            BIGINT,
    respuesta              TEXT,
    error                  TEXT,
    usuario_referencia_id  BIGINT REFERENCES usuario_referencia(id) ON DELETE SET NULL,
    fecha                  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_integracion_hro_log_expediente ON integracion_hro_log(numero_expediente);
CREATE INDEX idx_integracion_hro_log_fecha      ON integracion_hro_log(fecha);
