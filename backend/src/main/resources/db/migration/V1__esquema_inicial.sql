-- =====================================================================
-- HRO Hospital System — Esquema de base de datos v1
-- Motor: PostgreSQL 14+
-- Migración gestionada con Flyway (V1__esquema_inicial.sql)
--
-- Convenciones generales:
--   - Identificadores en snake_case, en español, consistentes con el
--     dominio del negocio (paciente, cita, turno, etc.).
--   - Llaves primarias con GENERATED ALWAYS AS IDENTITY (equivalente
--     moderno a SERIAL en PostgreSQL).
--   - Timestamps en TIMESTAMPTZ para evitar ambigüedad de zona horaria.
--   - Los catálogos/entidades maestras usan baja lógica (columna
--     "activo"); las tablas transaccionales (cita, turno, órdenes)
--     NUNCA se eliminan físicamente, solo cambian de estado.
--   - Los campos "estado" usan VARCHAR + CHECK en vez de tipos ENUM
--     nativos de Postgres, para poder agregar nuevos estados en el
--     futuro sin necesidad de ALTER TYPE (más flexible y escalable).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. EXTENSIONES
-- ---------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================================
-- 1. SEGURIDAD Y REFERENCIA DE USUARIOS
-- =====================================================================

CREATE TABLE usuario_referencia (
    id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_externo        VARCHAR(255) NOT NULL UNIQUE,
    nombre_mostrar    VARCHAR(200) NOT NULL,
    rol_principal     VARCHAR(30)  NOT NULL
                       CHECK (rol_principal IN ('personal_citas','enfermeria','medico','administrador','archivo')),
    activo            BOOLEAN      NOT NULL DEFAULT TRUE,
    ultimo_acceso     TIMESTAMPTZ,
    creado_en         TIMESTAMPTZ  NOT NULL DEFAULT now()
);

COMMENT ON TABLE usuario_referencia IS
    'Espejo local de usuarios autenticados externamente (JIT provisioning).';

CREATE TABLE permiso_clinica (
    id                    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_referencia_id BIGINT NOT NULL REFERENCES usuario_referencia(id) ON DELETE CASCADE,
    clinica_id            BIGINT NOT NULL,
    tipo_permiso          VARCHAR(40) NOT NULL
                          CHECK (tipo_permiso IN ('avanzar_turno','generar_orden_laboratorio','autorizar_cupo')),
    creado_en             TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (usuario_referencia_id, clinica_id, tipo_permiso)
);

-- =====================================================================
-- 2. CATÁLOGOS MAESTROS (especialidad -> subespecialidad -> clínica)
-- =====================================================================

CREATE TABLE especialidad (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre      VARCHAR(150) NOT NULL UNIQUE,
    activo      BOOLEAN      NOT NULL DEFAULT TRUE,
    creado_en   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE subespecialidad (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    especialidad_id BIGINT NOT NULL REFERENCES especialidad(id) ON DELETE RESTRICT,
    nombre          VARCHAR(150) NOT NULL,
    activo          BOOLEAN      NOT NULL DEFAULT TRUE,
    creado_en       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    UNIQUE (especialidad_id, nombre)
);

CREATE TABLE clinica (
    id                 BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    subespecialidad_id BIGINT NOT NULL REFERENCES subespecialidad(id) ON DELETE RESTRICT,
    nombre             VARCHAR(150) NOT NULL,
    ubicacion          VARCHAR(150),
    activo             BOOLEAN      NOT NULL DEFAULT TRUE,
    creado_en          TIMESTAMPTZ  NOT NULL DEFAULT now()
);

ALTER TABLE permiso_clinica
    ADD CONSTRAINT fk_permiso_clinica_clinica
    FOREIGN KEY (clinica_id) REFERENCES clinica(id) ON DELETE CASCADE;

CREATE TABLE tipo_examen_laboratorio (
    id       BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre   VARCHAR(150) NOT NULL,
    codigo   VARCHAR(30) UNIQUE,
    activo   BOOLEAN      NOT NULL DEFAULT TRUE
);

-- =====================================================================
-- 3. MÉDICOS Y CAPACIDAD
-- =====================================================================

CREATE TABLE medico (
    id                    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombres               VARCHAR(200) NOT NULL,
    numero_colegiado      VARCHAR(50)  NOT NULL UNIQUE,
    usuario_referencia_id BIGINT REFERENCES usuario_referencia(id) ON DELETE SET NULL,
    activo                BOOLEAN      NOT NULL DEFAULT TRUE,
    creado_en             TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE medico_clinica (
    id                          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    medico_id                   BIGINT NOT NULL REFERENCES medico(id) ON DELETE RESTRICT,
    clinica_id                  BIGINT NOT NULL REFERENCES clinica(id) ON DELETE RESTRICT,
    dia_semana                  SMALLINT NOT NULL CHECK (dia_semana BETWEEN 1 AND 7),
    hora_inicio                 TIME NOT NULL,
    hora_fin                    TIME NOT NULL,
    capacidad_maxima            INT  NOT NULL CHECK (capacidad_maxima > 0),
    duracion_consulta_minutos   INT  NOT NULL DEFAULT 35 CHECK (duracion_consulta_minutos > 0),
    activo                      BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en                   TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (medico_id, clinica_id, dia_semana),
    CHECK (hora_fin > hora_inicio)
);

-- =====================================================================
-- 4. CALENDARIO INSTITUCIONAL Y CUPOS
-- =====================================================================

CREATE TABLE dia_no_laborable (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    fecha       DATE NOT NULL UNIQUE,
    motivo      VARCHAR(200) NOT NULL,
    creado_por  BIGINT NOT NULL REFERENCES usuario_referencia(id) ON DELETE RESTRICT,
    creado_en   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE cupo_diario (
    id                   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    medico_clinica_id    BIGINT NOT NULL REFERENCES medico_clinica(id) ON DELETE RESTRICT,
    fecha                DATE NOT NULL,
    capacidad_maxima     INT  NOT NULL CHECK (capacidad_maxima > 0),
    cupos_ocupados       INT  NOT NULL DEFAULT 0 CHECK (cupos_ocupados >= 0),
    creado_en            TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (medico_clinica_id, fecha),
    CHECK (cupos_ocupados <= capacidad_maxima)
);

-- =====================================================================
-- 5. PACIENTES Y CITAS
-- =====================================================================

CREATE TABLE paciente (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    dpi                 VARCHAR(20)  NOT NULL UNIQUE,
    nombres             VARCHAR(150) NOT NULL,
    apellidos           VARCHAR(150) NOT NULL,
    fecha_nacimiento    DATE NOT NULL,
    sexo                CHAR(1) NOT NULL CHECK (sexo IN ('M','F')),
    telefono            VARCHAR(20),
    direccion           VARCHAR(255),
    numero_expediente   VARCHAR(30) UNIQUE,
    creado_en           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE cita (
    id                   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    paciente_id          BIGINT NOT NULL REFERENCES paciente(id) ON DELETE RESTRICT,
    cupo_diario_id       BIGINT NOT NULL REFERENCES cupo_diario(id) ON DELETE RESTRICT,
    hora_estimada        TIME,
    hora_ventana_inicio  TIME,
    hora_ventana_fin     TIME,
    estado               VARCHAR(20) NOT NULL DEFAULT 'pendiente'
                         CHECK (estado IN ('pendiente','confirmada','atendida','cancelada','reprogramada','no_asistio')),
    cita_origen_id       BIGINT REFERENCES cita(id) ON DELETE SET NULL,
    registrado_por       BIGINT NOT NULL REFERENCES usuario_referencia(id) ON DELETE RESTRICT,
    version              INT NOT NULL DEFAULT 0,
    creado_en            TIMESTAMPTZ NOT NULL DEFAULT now(),
    actualizado_en       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE cita_estado_historial (
    id                     BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cita_id                BIGINT NOT NULL REFERENCES cita(id) ON DELETE CASCADE,
    estado_anterior        VARCHAR(20),
    estado_nuevo           VARCHAR(20) NOT NULL,
    usuario_referencia_id  BIGINT NOT NULL REFERENCES usuario_referencia(id) ON DELETE RESTRICT,
    motivo                 TEXT,
    fecha_cambio           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================================
-- 6. TURNOS (fila digital del día)
-- =====================================================================

CREATE TABLE contador_turno_diario (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    clinica_id      BIGINT NOT NULL REFERENCES clinica(id) ON DELETE RESTRICT,
    fecha           DATE NOT NULL,
    turno_actual    INT NOT NULL DEFAULT 0,
    turno_siguiente INT NOT NULL DEFAULT 1,
    creado_en       TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (clinica_id, fecha)
);

CREATE TABLE turno (
    id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cita_id           BIGINT NOT NULL REFERENCES cita(id) ON DELETE RESTRICT,
    numero_turno      INT NOT NULL,
    estado            VARCHAR(20) NOT NULL DEFAULT 'en_espera'
                      CHECK (estado IN ('en_espera','llamado','atendido','no_responde','reintegrado')),
    intentos_llamado  INT NOT NULL DEFAULT 0,
    hora_generado     TIMESTAMPTZ NOT NULL DEFAULT now(),
    hora_llamado      TIMESTAMPTZ,
    hora_atendido     TIMESTAMPTZ
);

-- =====================================================================
-- 7. LABORATORIO E INTEGRACIÓN HL7
-- =====================================================================

CREATE TABLE orden_laboratorio (
    id                            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cita_id                       BIGINT NOT NULL REFERENCES cita(id) ON DELETE RESTRICT,
    tipo_examen_id                BIGINT NOT NULL REFERENCES tipo_examen_laboratorio(id) ON DELETE RESTRICT,
    estado                        VARCHAR(20) NOT NULL DEFAULT 'pendiente'
                                  CHECK (estado IN ('pendiente','enviada','procesada','resultado_recibido')),
    fecha_orden                   TIMESTAMPTZ NOT NULL DEFAULT now(),
    fecha_toma_muestra_programada DATE,
    prioridad                     VARCHAR(10) NOT NULL DEFAULT 'normal' CHECK (prioridad IN ('normal','urgente'))
);

CREATE TABLE resultado_laboratorio (
    id                     BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    orden_laboratorio_id   BIGINT NOT NULL UNIQUE REFERENCES orden_laboratorio(id) ON DELETE CASCADE,
    fecha_resultado        TIMESTAMPTZ,
    contenido              JSONB,
    creado_en              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE mensaje_hl7_log (
    id                     BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    orden_laboratorio_id   BIGINT REFERENCES orden_laboratorio(id) ON DELETE SET NULL,
    direccion              VARCHAR(10) NOT NULL CHECK (direccion IN ('enviado','recibido')),
    contenido_crudo        TEXT NOT NULL,
    estado_procesamiento   VARCHAR(15) NOT NULL DEFAULT 'ok'
                           CHECK (estado_procesamiento IN ('ok','error','reintentando')),
    fecha                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================================
-- 8. AUDITORÍA GENERAL DEL SISTEMA
-- =====================================================================

CREATE TABLE auditoria_general (
    id                     BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tabla_afectada         VARCHAR(100) NOT NULL,
    entidad_id             BIGINT NOT NULL,
    accion                 VARCHAR(15) NOT NULL CHECK (accion IN ('crear','actualizar','eliminar')),
    usuario_referencia_id  BIGINT REFERENCES usuario_referencia(id) ON DELETE SET NULL,
    valores_anteriores     JSONB,
    valores_nuevos         JSONB,
    fecha                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================================
-- 9. ÍNDICES DE APOYO
-- =====================================================================

CREATE INDEX idx_subespecialidad_especialidad     ON subespecialidad(especialidad_id);
CREATE INDEX idx_clinica_subespecialidad          ON clinica(subespecialidad_id);
CREATE INDEX idx_medico_clinica_medico            ON medico_clinica(medico_id);
CREATE INDEX idx_medico_clinica_clinica           ON medico_clinica(clinica_id);
CREATE INDEX idx_cupo_diario_fecha                ON cupo_diario(fecha);
CREATE INDEX idx_cupo_diario_medico_clinica       ON cupo_diario(medico_clinica_id);
CREATE INDEX idx_paciente_dpi                     ON paciente(dpi);
CREATE INDEX idx_cita_paciente                    ON cita(paciente_id);
CREATE INDEX idx_cita_cupo_diario                 ON cita(cupo_diario_id);
CREATE INDEX idx_cita_estado                      ON cita(estado);
CREATE INDEX idx_cita_estado_historial_cita        ON cita_estado_historial(cita_id);
CREATE INDEX idx_turno_cita                       ON turno(cita_id);
CREATE INDEX idx_turno_estado                     ON turno(estado);
CREATE INDEX idx_orden_laboratorio_cita           ON orden_laboratorio(cita_id);
CREATE INDEX idx_mensaje_hl7_log_fecha            ON mensaje_hl7_log(fecha);
CREATE INDEX idx_auditoria_tabla_entidad          ON auditoria_general(tabla_afectada, entidad_id);

-- =====================================================================
-- 10. TRIGGER GENÉRICO: actualizado_en / version en "cita"
-- =====================================================================

CREATE OR REPLACE FUNCTION fn_actualizar_marca_tiempo()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en := now();
    NEW.version := OLD.version + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_cita_actualizar_marca_tiempo
    BEFORE UPDATE ON cita
    FOR EACH ROW
    EXECUTE FUNCTION fn_actualizar_marca_tiempo();

-- =====================================================================
-- 11. FUNCIONES ATÓMICAS (evitan condiciones de carrera)
-- =====================================================================

-- 11.1 Incremento atómico y condicional de cupos_ocupados
CREATE OR REPLACE FUNCTION fn_incrementar_cupo(p_cupo_diario_id BIGINT)
RETURNS BOOLEAN AS $$
DECLARE
    v_actualizado BOOLEAN;
BEGIN
    UPDATE cupo_diario
       SET cupos_ocupados = cupos_ocupados + 1
     WHERE id = p_cupo_diario_id
       AND cupos_ocupados < capacidad_maxima;

    GET DIAGNOSTICS v_actualizado = ROW_COUNT;
    RETURN v_actualizado > 0;
END;
$$ LANGUAGE plpgsql;

-- 11.2 Asignación atómica del siguiente número de turno (upsert + incremento)
CREATE OR REPLACE FUNCTION fn_siguiente_turno(p_clinica_id BIGINT, p_fecha DATE)
RETURNS INT AS $$
DECLARE
    v_turno INT;
BEGIN
    INSERT INTO contador_turno_diario (clinica_id, fecha, turno_actual, turno_siguiente)
    VALUES (p_clinica_id, p_fecha, 0, 1)
    ON CONFLICT (clinica_id, fecha) DO NOTHING;

    UPDATE contador_turno_diario
       SET turno_siguiente = turno_siguiente + 1
     WHERE clinica_id = p_clinica_id
       AND fecha = p_fecha
    RETURNING turno_siguiente - 1 INTO v_turno;

    RETURN v_turno;
END;
$$ LANGUAGE plpgsql;

-- 11.3 Cálculo de hora estimada según posición en la fila
CREATE OR REPLACE FUNCTION fn_calcular_hora_estimada(
    p_hora_inicio_jornada TIME,
    p_duracion_minutos    INT,
    p_posicion            INT
)
RETURNS TIME AS $$
BEGIN
    RETURN p_hora_inicio_jornada + ((p_posicion - 1) * p_duracion_minutos) * INTERVAL '1 minute';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================================
-- 12. VISTA DE APOYO: duración real observada por médico/clínica
-- =====================================================================

CREATE OR REPLACE VIEW vw_duracion_real_atencion AS
SELECT
    c.cupo_diario_id,
    cd.medico_clinica_id,
    mc.medico_id,
    mc.clinica_id,
    t.cita_id,
    t.hora_llamado,
    t.hora_atendido,
    EXTRACT(EPOCH FROM (t.hora_atendido - t.hora_llamado)) / 60.0 AS minutos_reales
FROM turno t
JOIN cita c        ON c.id = t.cita_id
JOIN cupo_diario cd ON cd.id = c.cupo_diario_id
JOIN medico_clinica mc ON mc.id = cd.medico_clinica_id
WHERE t.hora_llamado IS NOT NULL
  AND t.hora_atendido IS NOT NULL;
