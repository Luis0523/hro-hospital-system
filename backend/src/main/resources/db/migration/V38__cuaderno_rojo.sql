-- =====================================================================
-- V38: Registro diario del Cuaderno Rojo
--
-- Un registro por fecha, capturado manualmente por Archivo. Los campos
-- corresponden a los encabezados del cuaderno físico del hospital y se
-- usarán posteriormente para estadística. No depende de otros módulos.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE cuaderno_rojo_registro (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fecha                  DATE        NOT NULL,
    egresos_hospitalarios  INTEGER     NOT NULL DEFAULT 0 CHECK (egresos_hospitalarios >= 0),
    sobres_emergencia      INTEGER     NOT NULL DEFAULT 0 CHECK (sobres_emergencia >= 0),
    sobres_sellados        INTEGER     NOT NULL DEFAULT 0 CHECK (sobres_sellados >= 0),
    tia                    INTEGER     NOT NULL DEFAULT 0 CHECK (tia >= 0),
    registrado_por_id      BIGINT      REFERENCES usuario_referencia(id) ON DELETE SET NULL,
    actualizado_por_id     BIGINT      REFERENCES usuario_referencia(id) ON DELETE SET NULL,
    creado_en              TIMESTAMPTZ NOT NULL DEFAULT now(),
    actualizado_en         TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_cuaderno_rojo_fecha UNIQUE (fecha)
);

COMMENT ON TABLE cuaderno_rojo_registro IS
    'Registro diario manual del Cuaderno Rojo del Departamento de Archivo. Un registro por fecha.';

CREATE INDEX idx_cuaderno_rojo_fecha ON cuaderno_rojo_registro (fecha DESC);
