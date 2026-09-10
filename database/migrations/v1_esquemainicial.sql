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
CREATE EXTENSION IF NOT EXISTS "pgcrypto";  -- utilidades de hash/uuid si se requieren más adelante


-- =====================================================================
-- 1. SEGURIDAD Y REFERENCIA DE USUARIOS
--    La autenticación (credenciales, login) la resuelve un proveedor
--    externo al hospital. Esta tabla NO almacena contraseñas: es una
--    referencia local (JIT provisioning) para poder asociar auditoría
--    y permisos a cada usuario autenticado por token.
-- =====================================================================

CREATE TABLE usuario_referencia (
    id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_externo        VARCHAR(255) NOT NULL UNIQUE,        -- "sub" del token del proveedor externo
    nombre_mostrar    VARCHAR(200) NOT NULL,
    rol_principal     VARCHAR(30)  NOT NULL
                       CHECK (rol_principal IN ('personal_citas','enfermeria','medico','administrador','archivo')),
    activo            BOOLEAN      NOT NULL DEFAULT TRUE,
    ultimo_acceso     TIMESTAMPTZ,
    creado_en         TIMESTAMPTZ  NOT NULL DEFAULT now()
);

COMMENT ON TABLE usuario_referencia IS
    'Espejo local de usuarios autenticados externamente. Se crea o actualiza (upsert) en cada inicio de sesión válido (JIT provisioning).';

CREATE TABLE permiso_clinica (
    id                    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_referencia_id BIGINT NOT NULL REFERENCES usuario_referencia(id) ON DELETE CASCADE,
    clinica_id            BIGINT NOT NULL,  -- FK agregada más abajo tras crear "clinica" (ver ALTER al final de sección 2)
    tipo_permiso          VARCHAR(40) NOT NULL
                          CHECK (tipo_permiso IN ('avanzar_turno','generar_orden_laboratorio','autorizar_cupo')),
    creado_en             TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (usuario_referencia_id, clinica_id, tipo_permiso)
);

COMMENT ON TABLE permiso_clinica IS
    'Permisos operativos configurables por clínica, independientes del rol general del token (ej. quién puede avanzar el turno en una clínica específica).';


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

-- Ahora que "clinica" existe, se agrega la FK pendiente de permiso_clinica
ALTER TABLE permiso_clinica
    ADD CONSTRAINT fk_permiso_clinica_clinica
    FOREIGN KEY (clinica_id) REFERENCES clinica(id) ON DELETE CASCADE;

CREATE TABLE tipo_examen_laboratorio (
    id       BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre   VARCHAR(150) NOT NULL,
    codigo   VARCHAR(30) UNIQUE,        -- ideal: código LOINC/HL7 correspondiente
    activo   BOOLEAN      NOT NULL DEFAULT TRUE
);


-- =====================================================================
-- 3. MÉDICOS Y CAPACIDAD (medico -> medico_clinica)
-- =====================================================================

CREATE TABLE medico (
    id                    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombres               VARCHAR(200) NOT NULL,
    numero_colegiado      VARCHAR(50)  NOT NULL UNIQUE,
    usuario_referencia_id BIGINT REFERENCES usuario_referencia(id) ON DELETE SET NULL,
    activo                BOOLEAN      NOT NULL DEFAULT TRUE,
    creado_en             TIMESTAMPTZ  NOT NULL DEFAULT now()
);

COMMENT ON COLUMN medico.usuario_referencia_id IS
    'Nullable: un médico es un dato clínico permanente aunque nunca inicie sesión en el sistema.';

CREATE TABLE medico_clinica (
    id                          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    medico_id                   BIGINT NOT NULL REFERENCES medico(id) ON DELETE RESTRICT,
    clinica_id                  BIGINT NOT NULL REFERENCES clinica(id) ON DELETE RESTRICT,
    dia_semana                  SMALLINT NOT NULL CHECK (dia_semana BETWEEN 1 AND 7), -- 1=lunes ... 7=domingo
    hora_inicio                 TIME NOT NULL,
    hora_fin                    TIME NOT NULL,
    capacidad_maxima            INT  NOT NULL CHECK (capacidad_maxima > 0),
    duracion_consulta_minutos   INT  NOT NULL DEFAULT 35 CHECK (duracion_consulta_minutos > 0),
    activo                      BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en                   TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (medico_id, clinica_id, dia_semana),
    CHECK (hora_fin > hora_inicio)
);

COMMENT ON COLUMN medico_clinica.duracion_consulta_minutos IS
    'Valor inicial estimado (default 35). Debe recalcularse periódicamente con el promedio real observado en turno.hora_llamado/hora_atendido.';


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

COMMENT ON TABLE dia_no_laborable IS
    'Antes de insertar un registro aquí, la capa de aplicación debe validar si existen citas ya programadas en esa fecha y alertar al administrador.';

CREATE TABLE cupo_diario (
    id                   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    medico_clinica_id    BIGINT NOT NULL REFERENCES medico_clinica(id) ON DELETE RESTRICT,
    fecha                DATE NOT NULL,
    capacidad_maxima     INT  NOT NULL CHECK (capacidad_maxima > 0), -- copiado de medico_clinica al generarse (histórico, no en vivo)
    cupos_ocupados       INT  NOT NULL DEFAULT 0 CHECK (cupos_ocupados >= 0),
    creado_en            TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (medico_clinica_id, fecha),
    CHECK (cupos_ocupados <= capacidad_maxima)
);

COMMENT ON COLUMN cupo_diario.capacidad_maxima IS
    'Copiado desde medico_clinica al momento de generar el cupo del día. No se referencia en vivo para no alterar cupos ya comprometidos si luego cambia la configuración general.';


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
    hora_estimada        TIME,                 -- hora calculada por el motor de programación
    hora_ventana_inicio  TIME,                 -- ventana impresa en el comprobante (con margen de seguridad)
    hora_ventana_fin     TIME,
    estado               VARCHAR(20) NOT NULL DEFAULT 'pendiente'
                         CHECK (estado IN ('pendiente','confirmada','atendida','cancelada','reprogramada','no_asistio')),
    cita_origen_id       BIGINT REFERENCES cita(id) ON DELETE SET NULL, -- autoreferencia: trazabilidad de reprogramaciones
    registrado_por       BIGINT NOT NULL REFERENCES usuario_referencia(id) ON DELETE RESTRICT,
    version              INT NOT NULL DEFAULT 0,               -- bloqueo optimista (optimistic locking)
    creado_en            TIMESTAMPTZ NOT NULL DEFAULT now(),
    actualizado_en       TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON COLUMN cita.cita_origen_id IS
    'Al reprogramar, se crea una fila nueva apuntando a la cita original en vez de sobrescribir la fecha, preservando el historial completo de reprogramaciones.';
COMMENT ON COLUMN cita.version IS
    'Bloqueo optimista: evita que dos actualizaciones simultáneas sobre la misma cita se sobrescriban entre sí (ver nota de concurrencia al final del script).';

CREATE TABLE cita_estado_historial (
    id                     BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cita_id                BIGINT NOT NULL REFERENCES cita(id) ON DELETE CASCADE,
    estado_anterior        VARCHAR(20),
    estado_nuevo           VARCHAR(20) NOT NULL,
    usuario_referencia_id  BIGINT NOT NULL REFERENCES usuario_referencia(id) ON DELETE RESTRICT,
    motivo                 TEXT,
    fecha_cambio           TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE cita_estado_historial IS
    'Auditoría detallada específica del dominio de citas: registra cada transición de estado, quién la hizo y cuándo (requisito de trazabilidad de los objetivos del proyecto).';


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

COMMENT ON TABLE turno IS
    'Se crea únicamente el día de la cita, al registrar la llegada del paciente. Relación 1 a 0..1 con cita (una cita puede no generar nunca un turno si hay inasistencia total).';
COMMENT ON COLUMN turno.estado IS
    'no_responde: se llamó y no se presentó en el tiempo de gracia. reintegrado: se le asignó una nueva posición en la fila tras no_responde, sin crear una cita nueva.';


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
    contenido              JSONB,       -- estructura del resultado según lo entregado por Roche
    creado_en              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE mensaje_hl7_log (
    id                     BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    orden_laboratorio_id   BIGINT REFERENCES orden_laboratorio(id) ON DELETE SET NULL,
    direccion              VARCHAR(10) NOT NULL CHECK (direccion IN ('enviado','recibido')),
    contenido_crudo        TEXT NOT NULL,      -- mensaje HL7 tal cual, para depuración
    estado_procesamiento   VARCHAR(15) NOT NULL DEFAULT 'ok'
                           CHECK (estado_procesamiento IN ('ok','error','reintentando')),
    fecha                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE mensaje_hl7_log IS
    'Bitácora cruda de la integración HL7 (enviados y recibidos). Indispensable para depurar fallas de comunicación con el laboratorio Roche.';


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

COMMENT ON TABLE auditoria_general IS
    'Bitácora genérica y transversal (configuración, usuarios, permisos, etc.), complementaria a cita_estado_historial que es específica del dominio de citas.';


-- =====================================================================
-- 9. ÍNDICES DE APOYO
--    Postgres solo indexa automáticamente las PK y las columnas UNIQUE;
--    el resto de columnas usadas en filtros/joins frecuentes se indexan
--    explícitamente para mantener el sistema escalable con el volumen
--    de 600–800 pacientes/día.
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

COMMENT ON FUNCTION fn_actualizar_marca_tiempo() IS
    'Incrementa version y actualiza actualizado_en en cada UPDATE de cita. La capa de aplicación (Spring Data JPA @Version) debe enviar la version leída; si no coincide con la actual, la actualización debe rechazarse en la capa de negocio.';


-- =====================================================================
-- 11. FUNCIONES ATÓMICAS (evitan condiciones de carrera)
--     No usan "version" porque el conflicto aquí es de alta frecuencia
--     por diseño (muchos usuarios compitiendo por el mismo recurso
--     limitado). Se resuelven con actualizaciones atómicas a nivel de
--     base de datos en una sola instrucción.
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

COMMENT ON FUNCTION fn_incrementar_cupo(BIGINT) IS
    'Retorna TRUE si logró tomar el cupo, FALSE si ya no había disponibilidad. Si retorna FALSE, la capa de aplicación debe buscar la siguiente fecha disponible (búsqueda expansiva).';

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

COMMENT ON FUNCTION fn_siguiente_turno(BIGINT, DATE) IS
    'Crea el contador del día si no existe y devuelve el próximo número de turno de forma atómica, sin necesidad de leer-y-luego-escribir (evita reintentos ante alta concurrencia).';

-- 11.3 Cálculo de hora estimada según posición en la fila (versión 1, lineal)
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

COMMENT ON FUNCTION fn_calcular_hora_estimada(TIME, INT, INT) IS
    'Versión 1 (lineal): hora_inicio + (posición-1) * duración promedio. En versiones futuras debe evolucionar a un cálculo dinámico basado en tiempos reales de atención (cita_estado_historial / turno.hora_llamado-hora_atendido) y en la tasa histórica de inasistencia por clínica.';


-- =====================================================================
-- 12. VISTA DE APOYO: duración real observada por médico/clínica
--     Insumo para recalcular duracion_consulta_minutos en medico_clinica.
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

COMMENT ON VIEW vw_duracion_real_atencion IS
    'Duración real de cada consulta atendida. Se recomienda un proceso periódico (Spring Scheduler) que promedie esta vista por medico_id y actualice medico_clinica.duracion_consulta_minutos.';


-- =====================================================================
-- NOTA DE CONCURRENCIA (resumen de diseño, no ejecutable)
-- ---------------------------------------------------------------------
-- - cita.version            -> bloqueo optimista (conflicto poco frecuente)
-- - cupo_diario.cupos_ocupados -> fn_incrementar_cupo (conflicto frecuente)
-- - contador_turno_diario   -> fn_siguiente_turno (conflicto frecuente)
-- La capa de aplicación (Spring Boot) debe usar SIEMPRE estas funciones
-- para cupos y turnos, en vez de leer y luego escribir el valor.
-- =====================================================================