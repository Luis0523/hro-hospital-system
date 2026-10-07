-- =====================================================================
-- Migración V22: Registro digital de carnets (Fase 1 Archivo/Enfermería)
-- Hospital Regional de Occidente (HRO)
--
-- Digitaliza el circuito del carnet: la enfermera registra el carnet (se
-- consulta el expediente en el API del hospital) y el sistema asigna un
-- correlativo diario POR ESPECIALIDAD (sin tope, compartido entre estaciones).
-- Archivo marca encontrado/no localizado, despacha, y Mesa COEX (enfermería)
-- recibe y devuelve. Cada transición queda en `carnet_movimiento`.
--
-- Diseño ADITIVO: no se alteran las tablas existentes de expediente/ciclo/acta;
-- `cita_id` y `expediente_id` quedan nullable para la migración futura.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------
-- 1. Contador atómico diario por especialidad (mismo patrón que V11)
-- ---------------------------------------------------------------------
CREATE TABLE contador_carnet_fecha (
    fecha              DATE   NOT NULL,
    especialidad_id    BIGINT NOT NULL REFERENCES especialidad(id) ON DELETE RESTRICT,
    correlativo_actual INT    NOT NULL DEFAULT 0,
    PRIMARY KEY (fecha, especialidad_id)
);

COMMENT ON TABLE contador_carnet_fecha IS
    'Correlativo diario de carnets por especialidad (cada especialidad arranca en 1, sin tope).';

CREATE OR REPLACE FUNCTION fn_siguiente_carnet_fecha(p_fecha DATE, p_especialidad BIGINT)
RETURNS INT AS $$
DECLARE
    v_correlativo INT;
BEGIN
    INSERT INTO contador_carnet_fecha (fecha, especialidad_id, correlativo_actual)
    VALUES (p_fecha, p_especialidad, 0)
    ON CONFLICT (fecha, especialidad_id) DO NOTHING;

    UPDATE contador_carnet_fecha
       SET correlativo_actual = correlativo_actual + 1
     WHERE fecha = p_fecha AND especialidad_id = p_especialidad
    RETURNING correlativo_actual INTO v_correlativo;

    RETURN v_correlativo;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------
-- 2. El carnet del día
-- ---------------------------------------------------------------------
CREATE TABLE carnet (
    id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fecha                     DATE        NOT NULL,
    correlativo               INT         NOT NULL,
    especialidad_id           BIGINT      NOT NULL REFERENCES especialidad(id) ON DELETE RESTRICT,
    estacion_id               BIGINT      REFERENCES estacion_enfermeria(id) ON DELETE SET NULL,
    numero_expediente         VARCHAR(30) NOT NULL,
    paciente_nombre           VARCHAR(200) NOT NULL,
    paciente_id               UUID        REFERENCES paciente(id) ON DELETE SET NULL,
    expediente_id             UUID        REFERENCES expediente(id) ON DELETE SET NULL,
    cita_id                   BIGINT      REFERENCES cita(id) ON DELETE SET NULL,
    ciclo_id                  UUID        REFERENCES expediente_ciclo(id) ON DELETE SET NULL,
    estado                    VARCHAR(30) NOT NULL DEFAULT 'registrado'
                              CHECK (estado IN (
                                  'registrado','encontrado','no_localizado','despachado',
                                  'recibido_estacion','devuelto_estacion','recibido_archivo'
                              )),
    observacion               TEXT,
    registrado_por_id         BIGINT      REFERENCES usuario_referencia(id) ON DELETE SET NULL,
    registrado_en             TIMESTAMPTZ NOT NULL DEFAULT now(),
    encontrado_por_id         BIGINT      REFERENCES usuario_referencia(id) ON DELETE SET NULL,
    encontrado_en             TIMESTAMPTZ,
    no_localizado_por_id      BIGINT      REFERENCES usuario_referencia(id) ON DELETE SET NULL,
    no_localizado_en          TIMESTAMPTZ,
    despachado_por_id         BIGINT      REFERENCES usuario_referencia(id) ON DELETE SET NULL,
    despachado_en             TIMESTAMPTZ,
    recibido_por_id           BIGINT      REFERENCES usuario_referencia(id) ON DELETE SET NULL,
    recibido_en               TIMESTAMPTZ,
    devuelto_por_id           BIGINT      REFERENCES usuario_referencia(id) ON DELETE SET NULL,
    devuelto_en               TIMESTAMPTZ,
    recibido_archivo_por_id   BIGINT      REFERENCES usuario_referencia(id) ON DELETE SET NULL,
    recibido_archivo_en       TIMESTAMPTZ,
    creado_en                 TIMESTAMPTZ NOT NULL DEFAULT now(),
    actualizado_en            TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_carnet_fecha_especialidad_correlativo UNIQUE (fecha, especialidad_id, correlativo),
    CONSTRAINT uq_carnet_fecha_numero_expediente UNIQUE (fecha, numero_expediente)
);

COMMENT ON TABLE carnet IS
    'Carnet recibido por la estación de enfermería. Identidad = número de expediente del hospital + correlativo diario por especialidad. Se enlaza al ciclo del expediente cuando aplica.';

CREATE INDEX idx_carnet_fecha_estado ON carnet(fecha, estado);
CREATE INDEX idx_carnet_fecha_estacion ON carnet(fecha, estacion_id);
CREATE INDEX idx_carnet_fecha_especialidad ON carnet(fecha, especialidad_id);
CREATE INDEX idx_carnet_ciclo ON carnet(ciclo_id);

-- ---------------------------------------------------------------------
-- 3. Bitácora inmutable de transiciones del carnet
-- ---------------------------------------------------------------------
CREATE TABLE carnet_movimiento (
    id                     BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    carnet_id              UUID        NOT NULL REFERENCES carnet(id) ON DELETE CASCADE,
    estado_anterior        VARCHAR(30),
    estado_nuevo           VARCHAR(30) NOT NULL,
    usuario_referencia_id  BIGINT      NOT NULL REFERENCES usuario_referencia(id) ON DELETE RESTRICT,
    observacion            TEXT,
    fecha_movimiento       TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE carnet_movimiento IS
    'Historial inmutable de cada transición del carnet (quién encontró, despachó, recibió y devolvió).';

CREATE INDEX idx_carnet_movimiento_carnet ON carnet_movimiento(carnet_id);
