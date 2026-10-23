-- =====================================================================
-- V35: Salidas de Enfermería a Archivo
--
-- Listado digital de expedientes que la estación de enfermería entrega a
-- Archivo. Se registra por número de expediente (no por correlativo) y se
-- etiqueta cada salida para el reporte PDF.
-- =====================================================================

CREATE TABLE salida_enfermeria_archivo (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fecha                 DATE         NOT NULL,
    estacion_id           BIGINT       NOT NULL REFERENCES estacion_enfermeria(id) ON DELETE RESTRICT,
    numero_expediente     VARCHAR(30)  NOT NULL,
    paciente_nombre       VARCHAR(200) NOT NULL,
    tipo                  VARCHAR(30)  NOT NULL DEFAULT 'normal',
    clinica_personal_id   UUID         REFERENCES espacio_fisico(id) ON DELETE SET NULL,
    registrado_por_id     BIGINT       REFERENCES usuario_referencia(id) ON DELETE SET NULL,
    registrado_en         TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT ck_salida_enf_tipo CHECK (tipo IN ('normal', 'privado_libertad', 'personal', 'presentacion')),
    CONSTRAINT uq_salida_enf_fecha_estacion_exp UNIQUE (fecha, estacion_id, numero_expediente)
);

COMMENT ON TABLE salida_enfermeria_archivo IS
    'Expedientes entregados por Enfermería a Archivo, identificados por número de expediente.';

CREATE INDEX idx_salida_enf_fecha_estacion ON salida_enfermeria_archivo (fecha, estacion_id);
