-- =====================================================================
-- Migración V31: Turnos de Estación de Enfermería
-- Hospital Regional de Occidente (HRO)
--
-- Nuevo flujo independiente de registro y seguimiento de pacientes por
-- estación. Reemplaza funcionalmente el registro de carnets de Mesa COEX,
-- pero no elimina las tablas existentes: la convivencia es temporal hasta
-- integrar el frontend nuevo.
--
-- Decisiones:
--   * correlativo por especialidad (MI1, P1, ...), sin repetir entre estaciones;
--   * número general diario por estación, compartido por sus especialidades;
--   * el registro inicial no exige paciente ni expediente;
--   * el doctor vincula el expediente cuando el paciente está en clínica;
--   * la devolución/recepción se refleja también en expediente_ciclo.
--
-- Estrategia: solo tablas/columnas nuevas (aditivo).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Tope configurable del correlativo por especialidad
-- ---------------------------------------------------------------------
ALTER TABLE especialidad
    ADD COLUMN correlativo_max INTEGER;

ALTER TABLE especialidad
    ADD CONSTRAINT ck_especialidad_correlativo_max
    CHECK (correlativo_max IS NULL OR correlativo_max > 0);

COMMENT ON COLUMN especialidad.correlativo_max IS
    'Tope del correlativo diario de la especialidad en estación de enfermería. NULL = sin tope.';

-- ---------------------------------------------------------------------
-- 2. Contador general diario por estación
-- ---------------------------------------------------------------------
CREATE TABLE contador_turno_estacion (
    estacion_id  BIGINT  NOT NULL REFERENCES estacion_enfermeria(id) ON DELETE RESTRICT,
    fecha        DATE    NOT NULL,
    ultimo_numero INTEGER NOT NULL DEFAULT 0 CHECK (ultimo_numero >= 0),
    PRIMARY KEY (estacion_id, fecha)
);

COMMENT ON TABLE contador_turno_estacion IS
    'Último número general asignado por estación y fecha. Es independiente de la especialidad.';

-- ---------------------------------------------------------------------
-- 3. Contador diario por especialidad
-- ---------------------------------------------------------------------
CREATE TABLE contador_correlativo_especialidad (
    especialidad_id      BIGINT NOT NULL REFERENCES especialidad(id) ON DELETE RESTRICT,
    fecha                DATE   NOT NULL,
    ultimo_correlativo   INTEGER NOT NULL DEFAULT 0 CHECK (ultimo_correlativo >= 0),
    PRIMARY KEY (especialidad_id, fecha)
);

COMMENT ON TABLE contador_correlativo_especialidad IS
    'Último correlativo asignado por especialidad y fecha (MI1, MI2, P1...).';

-- ---------------------------------------------------------------------
-- 4. Turno de estación
-- ---------------------------------------------------------------------
CREATE TABLE turno_estacion (
    id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fecha                     DATE        NOT NULL,
    estacion_id               BIGINT      NOT NULL REFERENCES estacion_enfermeria(id) ON DELETE RESTRICT,
    especialidad_id           BIGINT      NOT NULL REFERENCES especialidad(id) ON DELETE RESTRICT,
    correlativo_especialidad  INTEGER     NOT NULL CHECK (correlativo_especialidad > 0),
    numero_general            INTEGER     NOT NULL CHECK (numero_general > 0),
    estado                    VARCHAR(20) NOT NULL DEFAULT 'registrado'
                              CHECK (estado IN (
                                  'registrado','recibido','en_clinica','llamado',
                                  'no_asistio','atendido','devuelto','archivado'
                              )),

    paciente_id               UUID        REFERENCES paciente(id) ON DELETE RESTRICT,
    expediente_id             UUID        REFERENCES expediente(id) ON DELETE RESTRICT,
    numero_expediente         VARCHAR(30),
    paciente_nombre           VARCHAR(200),
    cita_id                   BIGINT      REFERENCES cita(id) ON DELETE RESTRICT,
    expediente_ciclo_id       UUID        REFERENCES expediente_ciclo(id) ON DELETE SET NULL,
    espacio_fisico_id         UUID        REFERENCES espacio_fisico(id) ON DELETE RESTRICT,
    medico_id                 UUID        REFERENCES medico(id) ON DELETE RESTRICT,

    llamados                  INTEGER     NOT NULL DEFAULT 0 CHECK (llamados >= 0),
    ultimo_llamado_en         TIMESTAMPTZ,

    registrado_por_id         BIGINT      NOT NULL REFERENCES usuario_referencia(id) ON DELETE RESTRICT,
    registrado_en             TIMESTAMPTZ NOT NULL DEFAULT now(),
    recibido_por_id           BIGINT      REFERENCES usuario_referencia(id) ON DELETE RESTRICT,
    recibido_en               TIMESTAMPTZ,
    asignado_por_id           BIGINT      REFERENCES usuario_referencia(id) ON DELETE RESTRICT,
    asignado_en               TIMESTAMPTZ,
    atendido_por_id           BIGINT      REFERENCES usuario_referencia(id) ON DELETE RESTRICT,
    atendido_en               TIMESTAMPTZ,
    no_asistio_por_id         BIGINT      REFERENCES usuario_referencia(id) ON DELETE RESTRICT,
    no_asistio_en             TIMESTAMPTZ,
    devuelto_por_id           BIGINT      REFERENCES usuario_referencia(id) ON DELETE RESTRICT,
    devuelto_en               TIMESTAMPTZ,
    archivado_por_id          BIGINT      REFERENCES usuario_referencia(id) ON DELETE RESTRICT,
    archivado_en              TIMESTAMPTZ,

    activo                    BOOLEAN     NOT NULL DEFAULT TRUE,
    eliminado_por_id          BIGINT      REFERENCES usuario_referencia(id) ON DELETE RESTRICT,
    eliminado_en              TIMESTAMPTZ,
    motivo_eliminacion        TEXT,
    observacion               TEXT,

    version                   INTEGER     NOT NULL DEFAULT 0,
    creado_en                 TIMESTAMPTZ NOT NULL DEFAULT now(),
    actualizado_en            TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_turno_estacion_general UNIQUE (fecha, estacion_id, numero_general),
    CONSTRAINT uq_turno_estacion_correlativo UNIQUE (fecha, especialidad_id, correlativo_especialidad)
);

COMMENT ON TABLE turno_estacion IS
    'Registro operativo del paciente en una estación: correlativo por especialidad y número general por estación.';

CREATE INDEX idx_turno_estacion_fecha_estacion
    ON turno_estacion(fecha, estacion_id);
CREATE INDEX idx_turno_estacion_fecha_especialidad
    ON turno_estacion(fecha, especialidad_id);
CREATE INDEX idx_turno_estacion_clinica
    ON turno_estacion(fecha, espacio_fisico_id);
CREATE INDEX idx_turno_estacion_expediente
    ON turno_estacion(expediente_id);
CREATE INDEX idx_turno_estacion_ciclo
    ON turno_estacion(expediente_ciclo_id);

-- Un expediente no puede estar en dos turnos activos del mismo día.
CREATE UNIQUE INDEX uq_turno_estacion_expediente_fecha
    ON turno_estacion(fecha, numero_expediente)
    WHERE numero_expediente IS NOT NULL AND activo;

-- ---------------------------------------------------------------------
-- 5. Bitácora append-only del turno
-- ---------------------------------------------------------------------
CREATE TABLE turno_estacion_movimiento (
    id                      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    turno_estacion_id       UUID        NOT NULL REFERENCES turno_estacion(id) ON DELETE CASCADE,
    estado_anterior         VARCHAR(20),
    estado_nuevo            VARCHAR(20) NOT NULL,
    usuario_referencia_id   BIGINT      REFERENCES usuario_referencia(id) ON DELETE RESTRICT,
    medico_id               UUID        REFERENCES medico(id) ON DELETE RESTRICT,
    observacion             TEXT,
    fecha_movimiento        TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE turno_estacion_movimiento IS
    'Historial detallado de cada transición del turno de estación. Append-only.';

CREATE INDEX idx_turno_estacion_mov_turno
    ON turno_estacion_movimiento(turno_estacion_id, fecha_movimiento);

-- ---------------------------------------------------------------------
-- 6. Asignación atómica de correlativos
--
-- Orden de bloqueo: estación -> especialidad (siempre el mismo) para
-- evitar deadlocks. Si la especialidad agotó su tope, devuelve NULL y
-- no incrementa el contador general.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_asignar_correlativos_turno(
    p_estacion_id BIGINT,
    p_especialidad_id BIGINT,
    p_fecha DATE
)
RETURNS TABLE(numero_general INTEGER, correlativo_especialidad INTEGER)
LANGUAGE plpgsql
AS $$
DECLARE
    v_general     INTEGER;
    v_correlativo INTEGER;
    v_max         INTEGER;
BEGIN
    INSERT INTO contador_turno_estacion (estacion_id, fecha, ultimo_numero)
    VALUES (p_estacion_id, p_fecha, 0)
    ON CONFLICT (estacion_id, fecha) DO NOTHING;

    SELECT c.ultimo_numero
      INTO v_general
      FROM contador_turno_estacion c
     WHERE c.estacion_id = p_estacion_id
       AND c.fecha = p_fecha
     FOR UPDATE;

    INSERT INTO contador_correlativo_especialidad (especialidad_id, fecha, ultimo_correlativo)
    VALUES (p_especialidad_id, p_fecha, 0)
    ON CONFLICT (especialidad_id, fecha) DO NOTHING;

    SELECT c.ultimo_correlativo
      INTO v_correlativo
      FROM contador_correlativo_especialidad c
     WHERE c.especialidad_id = p_especialidad_id
       AND c.fecha = p_fecha
     FOR UPDATE;

    SELECT e.correlativo_max
      INTO v_max
      FROM especialidad e
     WHERE e.id = p_especialidad_id;

    IF v_max IS NOT NULL AND v_correlativo + 1 > v_max THEN
        RETURN QUERY SELECT NULL::INTEGER, NULL::INTEGER;
        RETURN;
    END IF;

    v_general := v_general + 1;
    v_correlativo := v_correlativo + 1;

    UPDATE contador_turno_estacion
       SET ultimo_numero = v_general
     WHERE estacion_id = p_estacion_id
       AND fecha = p_fecha;

    UPDATE contador_correlativo_especialidad
       SET ultimo_correlativo = v_correlativo
     WHERE especialidad_id = p_especialidad_id
       AND fecha = p_fecha;

    RETURN QUERY SELECT v_general, v_correlativo;
END;
$$;

COMMENT ON FUNCTION fn_asignar_correlativos_turno(BIGINT, BIGINT, DATE) IS
    'Asigna de forma atómica el número general de la estación y el correlativo de la especialidad. Devuelve NULL si se agotó el tope.';
