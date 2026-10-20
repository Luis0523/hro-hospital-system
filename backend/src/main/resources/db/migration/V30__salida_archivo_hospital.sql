-- =====================================================================
-- Migración V30: salidas de archivo consultadas al Registro Médico
-- Hospital Regional de Occidente (HRO)
--
-- Registro propio de Archivo para expedientes que salen consultando
-- DIRECTAMENTE el API del hospital (no depende de los carnets de enfermería).
-- Compartido por estación y fecha (varios operadores ven el mismo listado).
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE salida_archivo_hospital (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fecha                DATE         NOT NULL,
    estacion_id          BIGINT       REFERENCES estacion_enfermeria(id) ON DELETE SET NULL,
    numero_expediente    VARCHAR(30)  NOT NULL,
    paciente_nombre      VARCHAR(200) NOT NULL,
    registrado_por_id    BIGINT       REFERENCES usuario_referencia(id) ON DELETE SET NULL,
    registrado_en        TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_salida_hosp_fecha_estacion_exp UNIQUE (fecha, estacion_id, numero_expediente)
);

COMMENT ON TABLE salida_archivo_hospital IS
    'Expedientes que salen de archivo consultando el API del hospital. Registro compartido por estación y fecha.';

CREATE INDEX idx_salida_hosp_fecha_estacion ON salida_archivo_hospital (fecha, estacion_id);
