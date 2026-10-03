-- =====================================================================
-- HRO Hospital System — Esquema CONSOLIDADO (estado final)
-- Motor: PostgreSQL 14+
-- Archivo generado a partir de las migraciones Flyway V1..V13
-- (database/migrations/ y backend/src/main/resources/db/migration/)
--
-- PROPÓSITO: documentación. Representa el estado final de la base de
-- datos en un único script legible (tablas, constraints, índices,
-- funciones, vistas y triggers). No incluye datos semilla.
--
-- Dimensiones del esquema (estado final, verificadas con PostgreSQL 15):
--   Tablas ................... 33
--   Claves primarias ......... 33  (11 UUID + 20 IDENTITY + 2 naturales)
--   Foreign keys ............. 46
--   Constraints UNIQUE ....... 26
--   CHECK .................... 24
--   Índices explícitos ....... 43
--   Índices totales .......... 102 (PK + UNIQUE + explícitos)
--   Funciones (proyecto) ..... 10
--   Vistas ................... 1
--   Triggers ................. 3
--   Secuencias IDENTITY ...... 20
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================================
-- 1. SEGURIDAD Y REFERENCIA DE USUARIOS
-- =====================================================================

CREATE TABLE usuario_referencia (
    id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_externo        VARCHAR(255) NOT NULL UNIQUE,
    nombre_mostrar    VARCHAR(200) NOT NULL,
    rol_principal     VARCHAR(30)  NOT NULL
                       CHECK (rol_principal IN ('personal_citas','enfermeria','medico','administrador','archivo','jefe_enfermeria')),
    activo            BOOLEAN      NOT NULL DEFAULT TRUE,
    ultimo_acceso     TIMESTAMPTZ,
    creado_en         TIMESTAMPTZ  NOT NULL DEFAULT now()
);

COMMENT ON TABLE usuario_referencia IS
    'Espejo local de usuarios autenticados externamente. Se crea o actualiza (upsert) en cada inicio de sesión válido (JIT provisioning).';

-- =====================================================================
-- 2. CATÁLOGOS MAESTROS (especialidad -> subespecialidad)
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

CREATE TABLE permiso_subespecialidad (
    id                    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    usuario_referencia_id BIGINT NOT NULL REFERENCES usuario_referencia(id) ON DELETE CASCADE,
    subespecialidad_id    BIGINT NOT NULL REFERENCES subespecialidad(id)    ON DELETE RESTRICT,
    tipo_permiso          VARCHAR(40) NOT NULL
                          CHECK (tipo_permiso IN ('avanzar_turno','generar_orden_laboratorio','autorizar_cupo')),
    creado_en             TIMESTAMPTZ NOT NULL DEFAULT now(),
    activo                BOOLEAN     NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_permiso_subespecialidad UNIQUE (usuario_referencia_id, subespecialidad_id, tipo_permiso)
);

COMMENT ON TABLE permiso_subespecialidad IS
    'Permisos operativos configurables por subespecialidad, independientes del rol general del token. activo=FALSE indica baja lógica.';

CREATE TABLE tipo_examen_laboratorio (
    id       BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre   VARCHAR(150) NOT NULL,
    codigo   VARCHAR(30) UNIQUE,
    activo   BOOLEAN      NOT NULL DEFAULT TRUE
);

-- =====================================================================
-- 3. ESPACIOS FÍSICOS Y ASIGNACIÓN DIARIA
--    (espacio_fisico nació como "clinica" en V1 y se renombró en V4;
--     ya NO está ligado de forma permanente a una subespecialidad.)
-- =====================================================================

CREATE TABLE espacio_fisico (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre             VARCHAR(150) NOT NULL,
    ubicacion          VARCHAR(150),
    activo             BOOLEAN      NOT NULL DEFAULT TRUE,
    creado_en          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    numero             VARCHAR(30)  NOT NULL,
    nivel              SMALLINT     NOT NULL,
    capacidad_camillas INT          NOT NULL DEFAULT 1 CHECK (capacidad_camillas > 0),
    coordenadas_plano  JSONB,
    CONSTRAINT uq_espacio_fisico_numero UNIQUE (numero)
);

COMMENT ON COLUMN espacio_fisico.activo IS
    'Baja lógica. Cubre baja permanente y fuera de servicio temporal por mantenimiento.';
COMMENT ON COLUMN espacio_fisico.coordenadas_plano IS
    'Referencia a la zona/polígono dentro del SVG del nivel (id de zona o coordenadas).';

CREATE TABLE asignacion_diaria_espacio (
    id                 BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    espacio_fisico_id  UUID   NOT NULL REFERENCES espacio_fisico(id) ON DELETE RESTRICT,
    subespecialidad_id BIGINT NOT NULL REFERENCES subespecialidad(id) ON DELETE RESTRICT,
    fecha              DATE   NOT NULL,
    creado_por         BIGINT NOT NULL REFERENCES usuario_referencia(id) ON DELETE RESTRICT,
    creado_en          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_asignacion_espacio_fecha_sub UNIQUE (espacio_fisico_id, fecha, subespecialidad_id)
);

COMMENT ON TABLE asignacion_diaria_espacio IS
    'Qué subespecialidad ocupa cada espacio físico en una fecha. La asigna el jefe de enfermería cada mañana. Una sala puede atender varias subespecialidades el mismo día (V13).';

CREATE TABLE cierre_asignacion_diaria (
    fecha          DATE PRIMARY KEY,
    estado         VARCHAR(10) NOT NULL DEFAULT 'abierta'
                   CHECK (estado IN ('abierta', 'cerrada')),
    confirmado_por BIGINT REFERENCES usuario_referencia(id) ON DELETE RESTRICT,
    confirmado_en  TIMESTAMPTZ
);

COMMENT ON TABLE cierre_asignacion_diaria IS
    'Bloquea la asignación diaria una vez que el jefe de enfermería confirma la organización del día.';

CREATE TABLE plano_hospital (
    id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nivel          SMALLINT NOT NULL UNIQUE,
    archivo_svg    VARCHAR(255) NOT NULL,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE plano_hospital IS
    'Ruta del archivo SVG del plano por nivel. Un plano es un recurso compartido por todas las salas del nivel.';

-- =====================================================================
-- 4. MÉDICOS Y HORARIO POR SUBESPECIALIDAD
-- =====================================================================

CREATE TABLE medico (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombres               VARCHAR(200) NOT NULL,
    numero_colegiado      VARCHAR(50)  NOT NULL UNIQUE,
    usuario_referencia_id BIGINT REFERENCES usuario_referencia(id) ON DELETE SET NULL,
    activo                BOOLEAN      NOT NULL DEFAULT TRUE,
    creado_en             TIMESTAMPTZ  NOT NULL DEFAULT now()
);

COMMENT ON COLUMN medico.usuario_referencia_id IS
    'Nullable: un médico es un dato clínico permanente aunque nunca inicie sesión en el sistema.';

CREATE TABLE medico_subespecialidad (
    id                        UUID   PRIMARY KEY DEFAULT gen_random_uuid(),
    medico_id                 UUID   NOT NULL REFERENCES medico(id) ON DELETE RESTRICT,
    subespecialidad_id        BIGINT NOT NULL REFERENCES subespecialidad(id) ON DELETE RESTRICT,
    dia_semana                SMALLINT NOT NULL CHECK (dia_semana BETWEEN 1 AND 7),
    hora_inicio               TIME NOT NULL,
    hora_fin                  TIME NOT NULL,
    capacidad_maxima          INT  NOT NULL CHECK (capacidad_maxima > 0),
    duracion_consulta_minutos INT  NOT NULL DEFAULT 35 CHECK (duracion_consulta_minutos > 0),
    activo                    BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en                 TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_medico_subespecialidad_dia UNIQUE (medico_id, subespecialidad_id, dia_semana),
    CHECK (hora_fin > hora_inicio)
);

COMMENT ON TABLE medico_subespecialidad IS
    'Vínculo médico <-> subespecialidad. Las columnas de horario/capacidad se conservan por compatibilidad; desde V10 la programación real vive en subespecialidad_horario.';

CREATE TABLE subespecialidad_horario (
    id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subespecialidad_id        BIGINT   NOT NULL REFERENCES subespecialidad(id) ON DELETE RESTRICT,
    dia_semana                SMALLINT NOT NULL CHECK (dia_semana BETWEEN 1 AND 7),
    hora_inicio               TIME     NOT NULL,
    hora_fin                  TIME     NOT NULL,
    capacidad_maxima          INT      NOT NULL CHECK (capacidad_maxima >= 1),
    duracion_consulta_minutos INT      NOT NULL DEFAULT 35 CHECK (duracion_consulta_minutos >= 5),
    activo                    BOOLEAN  NOT NULL DEFAULT TRUE,
    creado_en                 TIMESTAMPTZ NOT NULL DEFAULT now(),
    actualizado_en            TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_subespecialidad_horario_dia UNIQUE (subespecialidad_id, dia_semana),
    CONSTRAINT ck_subespecialidad_horario_horas CHECK (hora_fin > hora_inicio)
);

COMMENT ON TABLE subespecialidad_horario IS
    'Horario semanal (días y horas) y capacidad diaria por subespecialidad, independiente del médico (V10).';

-- =====================================================================
-- 5. CALENDARIO INSTITUCIONAL Y CUPOS
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
    id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subespecialidad_horario_id UUID NOT NULL REFERENCES subespecialidad_horario(id) ON DELETE RESTRICT,
    fecha                     DATE NOT NULL,
    capacidad_maxima          INT  NOT NULL CHECK (capacidad_maxima > 0),
    cupos_ocupados            INT  NOT NULL DEFAULT 0 CHECK (cupos_ocupados >= 0),
    creado_en                 TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_cupo_horario_fecha UNIQUE (subespecialidad_horario_id, fecha),
    CHECK (cupos_ocupados <= capacidad_maxima)
);

COMMENT ON COLUMN cupo_diario.capacidad_maxima IS
    'Copiado desde subespecialidad_horario al momento de generar el cupo del día (histórico, no en vivo).';

-- =====================================================================
-- 6. PACIENTES Y CITAS
-- =====================================================================

CREATE TABLE paciente (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    paciente_id          UUID   NOT NULL REFERENCES paciente(id) ON DELETE RESTRICT,
    cupo_diario_id       UUID   NOT NULL REFERENCES cupo_diario(id) ON DELETE RESTRICT,
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

COMMENT ON COLUMN cita.cita_origen_id IS
    'Al reprogramar, se crea una fila nueva apuntando a la cita original en vez de sobrescribir la fecha, preservando el historial completo de reprogramaciones.';
COMMENT ON COLUMN cita.version IS
    'Bloqueo optimista: evita que dos actualizaciones simultáneas sobre la misma cita se sobrescriban entre sí.';

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
    'Auditoría específica del dominio de citas: registra cada transición de estado, quién la hizo y cuándo.';

-- =====================================================================
-- 7. TURNOS (fila digital del día)
-- =====================================================================

CREATE TABLE contador_turno_diario (
    id                          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    asignacion_diaria_espacio_id BIGINT REFERENCES asignacion_diaria_espacio(id) ON DELETE RESTRICT,
    turno_actual                INT NOT NULL DEFAULT 0,
    turno_siguiente             INT NOT NULL DEFAULT 1,
    creado_en                   TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_contador_asignacion UNIQUE (asignacion_diaria_espacio_id)
);

COMMENT ON TABLE contador_turno_diario IS
    'Contador por asignación (sala/subespecialidad/fecha) para el tablero (último llamado). El correlativo global vive en contador_turno_fecha.';

CREATE TABLE contador_turno_fecha (
    fecha           DATE PRIMARY KEY,
    turno_actual    INT NOT NULL DEFAULT 0,
    turno_siguiente INT NOT NULL DEFAULT 1
);

COMMENT ON TABLE contador_turno_fecha IS
    'Correlativo global de turnos por día (todos los pacientes, sin importar subespecialidad/sala).';

CREATE TABLE turno (
    id                          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cita_id                     BIGINT NOT NULL REFERENCES cita(id) ON DELETE RESTRICT,
    asignacion_diaria_espacio_id BIGINT REFERENCES asignacion_diaria_espacio(id) ON DELETE RESTRICT,
    numero_turno                INT NOT NULL,
    estado                      VARCHAR(20) NOT NULL DEFAULT 'en_espera'
                                CHECK (estado IN ('en_espera','llamado','atendido','no_responde','reintegrado')),
    intentos_llamado            INT NOT NULL DEFAULT 0,
    hora_generado               TIMESTAMPTZ NOT NULL DEFAULT now(),
    hora_llamado                TIMESTAMPTZ,
    hora_atendido               TIMESTAMPTZ
);

COMMENT ON TABLE turno IS
    'Se crea únicamente el día de la cita, al registrar la llegada del paciente. Relación 1 a 0..1 con cita.';

-- =====================================================================
-- 8. LABORATORIO E INTEGRACIÓN HL7
-- =====================================================================

CREATE TABLE orden_laboratorio (
    id                            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cita_id                       BIGINT NOT NULL REFERENCES cita(id) ON DELETE RESTRICT,
    tipo_examen_id                BIGINT NOT NULL REFERENCES tipo_examen_laboratorio(id) ON DELETE RESTRICT,
    estado                        VARCHAR(20) NOT NULL DEFAULT 'pendiente'
                                  CHECK (estado IN ('pendiente','enviada','procesada','resultado_recibido')),
    fecha_orden                   TIMESTAMPTZ NOT NULL DEFAULT now(),
    fecha_toma_muestra_programada DATE,
    prioridad                     VARCHAR(10) NOT NULL DEFAULT 'normal' CHECK (prioridad IN ('normal','urgente'))
);

CREATE TABLE resultado_laboratorio (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    orden_laboratorio_id   UUID NOT NULL UNIQUE REFERENCES orden_laboratorio(id) ON DELETE CASCADE,
    fecha_resultado        TIMESTAMPTZ,
    contenido              JSONB,
    creado_en              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE mensaje_hl7_log (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    orden_laboratorio_id   UUID REFERENCES orden_laboratorio(id) ON DELETE SET NULL,
    direccion              VARCHAR(10) NOT NULL CHECK (direccion IN ('enviado','recibido')),
    contenido_crudo        TEXT NOT NULL,
    estado_procesamiento   VARCHAR(15) NOT NULL DEFAULT 'ok'
                           CHECK (estado_procesamiento IN ('ok','error','reintentando')),
    fecha                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE mensaje_hl7_log IS
    'Bitácora cruda de la integración HL7 (enviados y recibidos). Indispensable para depurar fallas de comunicación con el laboratorio Roche.';

-- =====================================================================
-- 9. AUDITORÍA GENERAL DEL SISTEMA
-- =====================================================================

CREATE TABLE auditoria_general (
    id                     BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tabla_afectada         VARCHAR(100) NOT NULL,
    entidad_id             VARCHAR(64)  NOT NULL,
    accion                 VARCHAR(15) NOT NULL CHECK (accion IN ('crear','actualizar','eliminar')),
    usuario_referencia_id  BIGINT REFERENCES usuario_referencia(id) ON DELETE SET NULL,
    valores_anteriores     JSONB,
    valores_nuevos         JSONB,
    fecha                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE auditoria_general IS
    'Bitácora genérica y transversal. entidad_id es VARCHAR(64) desde V5 para admitir UUID o numérico.';

-- =====================================================================
-- 10. ARCHIVO: EXPEDIENTES FÍSICOS
-- =====================================================================

CREATE TABLE ubicacion_archivo (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    pasillo     VARCHAR(20) NOT NULL,
    estante     VARCHAR(20) NOT NULL,
    balda       VARCHAR(20),
    descripcion VARCHAR(150),
    UNIQUE (pasillo, estante, balda)
);

COMMENT ON TABLE ubicacion_archivo IS
    'Catálogo normalizado de ubicaciones físicas dentro del archivo (pasillo/estante/balda).';

CREATE TABLE expediente (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paciente_id         UUID NOT NULL UNIQUE REFERENCES paciente(id) ON DELETE RESTRICT,
    numero_expediente   VARCHAR(30) NOT NULL UNIQUE,
    ubicacion_base_id   BIGINT REFERENCES ubicacion_archivo(id) ON DELETE SET NULL,
    activo              BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en           TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE expediente IS
    'El expediente físico en sí (el "paquete"): existe una sola vez por paciente. PK UUID para imprimirse/escancearse como código de barras o QR.';

CREATE TABLE expediente_ciclo (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expediente_id   UUID NOT NULL REFERENCES expediente(id) ON DELETE RESTRICT,
    cita_id         BIGINT NOT NULL UNIQUE REFERENCES cita(id) ON DELETE RESTRICT,
    estado_actual   VARCHAR(25) NOT NULL DEFAULT 'pendiente_localizar'
                    CHECK (estado_actual IN (
                        'pendiente_localizar','en_busqueda','localizado',
                        'en_transito_entrega','entregado',
                        'en_transito_retorno','archivado','no_localizado'
                    )),
    version         INT NOT NULL DEFAULT 0,
    creado_en       TIMESTAMPTZ NOT NULL DEFAULT now(),
    actualizado_en  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE expediente_ciclo IS
    'Un ciclo por cita: representa el viaje completo del expediente (búsqueda, entrega a la clínica, retorno a archivo) para esa consulta específica.';

CREATE TABLE expediente_movimiento (
    id                      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    expediente_ciclo_id     UUID NOT NULL REFERENCES expediente_ciclo(id) ON DELETE CASCADE,
    estado_anterior         VARCHAR(25),
    estado_nuevo            VARCHAR(25) NOT NULL,
    ubicacion_origen_id     BIGINT REFERENCES ubicacion_archivo(id) ON DELETE SET NULL,
    ubicacion_destino_id    BIGINT REFERENCES ubicacion_archivo(id) ON DELETE SET NULL,
    usuario_referencia_id   BIGINT NOT NULL REFERENCES usuario_referencia(id) ON DELETE RESTRICT,
    observacion             TEXT,
    fecha_movimiento        TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE expediente_movimiento IS
    'Auditoría detallada de cada transición del ciclo (checkpoints de rastreo). Solo se inserta.';

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
    'Acta de entrega/recepción de expedientes físicos generada por la Estación de Archivo (V9).';

CREATE TABLE acta_recepcion_detalle (
    id                   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    acta_recepcion_id    BIGINT NOT NULL REFERENCES acta_recepcion(id) ON DELETE CASCADE,
    expediente_id        UUID   NOT NULL REFERENCES expediente(id) ON DELETE RESTRICT,
    cita_id              BIGINT REFERENCES cita(id) ON DELETE SET NULL,
    UNIQUE (acta_recepcion_id, expediente_id)
);

-- =====================================================================
-- 11. ESTACIONES DE ENFERMERÍA (V12)
-- =====================================================================

CREATE TABLE estacion_enfermeria (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo     VARCHAR(30)  NOT NULL UNIQUE,
    nombre     VARCHAR(150) NOT NULL,
    ubicacion  VARCHAR(150),
    activo     BOOLEAN      NOT NULL DEFAULT TRUE,
    creado_en  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

COMMENT ON TABLE estacion_enfermeria IS
    'Puesto de trabajo de enfermería. Agrupa subespecialidades; su tablero muestra solo esas áreas.';

CREATE TABLE estacion_subespecialidad (
    id                 BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    estacion_id        BIGINT NOT NULL REFERENCES estacion_enfermeria(id) ON DELETE CASCADE,
    subespecialidad_id BIGINT NOT NULL REFERENCES subespecialidad(id)     ON DELETE RESTRICT,
    activo             BOOLEAN     NOT NULL DEFAULT TRUE,
    creado_en          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_estacion_subespecialidad UNIQUE (estacion_id, subespecialidad_id),
    CONSTRAINT uq_estacion_sub_unica       UNIQUE (subespecialidad_id)
);

COMMENT ON TABLE estacion_subespecialidad IS
    'Subespecialidades a cargo de una estación. Pertenencia única (una subespecialidad = una estación).';

CREATE TABLE estacion_acceso (
    id                    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    estacion_id           BIGINT NOT NULL REFERENCES estacion_enfermeria(id) ON DELETE RESTRICT,
    usuario_referencia_id BIGINT NOT NULL REFERENCES usuario_referencia(id)  ON DELETE RESTRICT,
    entrado_en            TIMESTAMPTZ NOT NULL DEFAULT now(),
    salido_en             TIMESTAMPTZ
);

COMMENT ON TABLE estacion_acceso IS
    'Registro de qué usuario entró a qué estación y en qué momento (rotación de personal).';

-- =====================================================================
-- 12. ÍNDICES EXPLÍCITOS (43)
--     Postgres indexa automáticamente PK y UNIQUE; el resto se declara.
-- =====================================================================

CREATE INDEX idx_subespecialidad_especialidad    ON subespecialidad(especialidad_id);
CREATE INDEX idx_espacio_fisico_nivel            ON espacio_fisico(nivel);
CREATE INDEX idx_asignacion_fecha                ON asignacion_diaria_espacio(fecha);
CREATE INDEX idx_asignacion_subespecialidad      ON asignacion_diaria_espacio(subespecialidad_id);

CREATE INDEX idx_medico_subespecialidad_medico   ON medico_subespecialidad(medico_id);
CREATE INDEX idx_medico_subespecialidad_sub      ON medico_subespecialidad(subespecialidad_id);
CREATE INDEX idx_subespecialidad_horario_sub     ON subespecialidad_horario(subespecialidad_id);

CREATE INDEX idx_cupo_diario_fecha               ON cupo_diario(fecha);
CREATE INDEX idx_cupo_diario_horario             ON cupo_diario(subespecialidad_horario_id);

CREATE INDEX idx_paciente_dpi                    ON paciente(dpi);
CREATE INDEX idx_paciente_apellidos_nombres      ON paciente(apellidos, nombres);

CREATE INDEX idx_cita_paciente                   ON cita(paciente_id);
CREATE INDEX idx_cita_cupo_diario                ON cita(cupo_diario_id);
CREATE INDEX idx_cita_estado                     ON cita(estado);
CREATE INDEX idx_cita_cupo_estado                ON cita(cupo_diario_id, estado);
CREATE INDEX idx_cita_activas_cupo               ON cita(cupo_diario_id) WHERE estado NOT IN ('cancelada', 'reprogramada');
CREATE INDEX idx_cita_estado_historial_cita      ON cita_estado_historial(cita_id);

CREATE INDEX idx_turno_cita                      ON turno(cita_id);
CREATE INDEX idx_turno_estado                    ON turno(estado);
CREATE INDEX idx_turno_cita_estado               ON turno(cita_id, estado);
CREATE INDEX idx_turno_estado_hora               ON turno(estado, hora_generado);
CREATE INDEX idx_turno_asignacion                ON turno(asignacion_diaria_espacio_id);
CREATE INDEX idx_contador_asignacion             ON contador_turno_diario(asignacion_diaria_espacio_id);

CREATE INDEX idx_orden_laboratorio_cita          ON orden_laboratorio(cita_id);
CREATE INDEX idx_resultado_orden                 ON resultado_laboratorio(orden_laboratorio_id);
CREATE INDEX idx_mensaje_hl7_orden               ON mensaje_hl7_log(orden_laboratorio_id);
CREATE INDEX idx_mensaje_hl7_log_fecha           ON mensaje_hl7_log(fecha);

CREATE INDEX idx_auditoria_tabla_entidad         ON auditoria_general(tabla_afectada, entidad_id);
CREATE INDEX idx_auditoria_fecha                 ON auditoria_general(fecha DESC);
CREATE INDEX idx_auditoria_usuario               ON auditoria_general(usuario_referencia_id);
CREATE INDEX idx_auditoria_accion                ON auditoria_general(accion);
CREATE INDEX idx_auditoria_valores_nuevos_gin    ON auditoria_general USING gin (valores_nuevos);
CREATE INDEX idx_auditoria_valores_anteriores_gin ON auditoria_general USING gin (valores_anteriores);

CREATE INDEX idx_expediente_ciclo_expediente     ON expediente_ciclo(expediente_id);
CREATE INDEX idx_expediente_ciclo_estado         ON expediente_ciclo(estado_actual);
CREATE INDEX idx_expediente_movimiento_ciclo     ON expediente_movimiento(expediente_ciclo_id);
CREATE INDEX idx_expediente_movimiento_fecha     ON expediente_movimiento(fecha_movimiento);

CREATE INDEX idx_acta_recepcion_fecha            ON acta_recepcion(fecha);
CREATE INDEX idx_acta_recepcion_detalle_acta     ON acta_recepcion_detalle(acta_recepcion_id);

CREATE INDEX idx_estacion_sub_estacion           ON estacion_subespecialidad(estacion_id);
CREATE INDEX idx_estacion_sub_subespecialidad    ON estacion_subespecialidad(subespecialidad_id);
CREATE INDEX idx_estacion_acceso_estacion        ON estacion_acceso(estacion_id);
CREATE INDEX idx_estacion_acceso_usuario         ON estacion_acceso(usuario_referencia_id);

-- =====================================================================
-- 13. FUNCIONES
-- =====================================================================

-- 13.1 Marca de tiempo + versión optimista para "cita"
CREATE OR REPLACE FUNCTION fn_actualizar_marca_tiempo()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en := now();
    IF NEW.version = OLD.version THEN
        IF OLD.cita_origen_id IS NOT NULL AND NEW.cita_origen_id IS NULL
           AND OLD.estado = NEW.estado AND OLD.paciente_id = NEW.paciente_id THEN
            NEW.version := OLD.version;
        ELSE
            NEW.version := OLD.version + 1;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 13.2 Incremento atómico y condicional de cupos
CREATE OR REPLACE FUNCTION fn_incrementar_cupo(p_cupo_diario_id uuid)
RETURNS BOOLEAN AS $$
DECLARE
    v_filas INT;
BEGIN
    UPDATE cupo_diario
       SET cupos_ocupados = cupos_ocupados + 1
     WHERE id = p_cupo_diario_id
       AND cupos_ocupados < capacidad_maxima;

    GET DIAGNOSTICS v_filas = ROW_COUNT;
    RETURN v_filas > 0;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_incrementar_cupo(uuid) IS
    'Retorna TRUE si logró tomar el cupo, FALSE si ya no había disponibilidad.';

-- 13.3 Decremento atómico de cupos (cancelar/reprogramar)
CREATE OR REPLACE FUNCTION fn_decrementar_cupo(p_cupo_diario_id uuid)
RETURNS BOOLEAN AS $$
DECLARE
    v_filas INT;
BEGIN
    UPDATE cupo_diario
       SET cupos_ocupados = cupos_ocupados - 1
     WHERE id = p_cupo_diario_id
       AND cupos_ocupados > 0;

    GET DIAGNOSTICS v_filas = ROW_COUNT;
    RETURN v_filas > 0;
END;
$$ LANGUAGE plpgsql;

-- 13.4 Siguiente turno por asignación (sala/subespecialidad/fecha)
CREATE OR REPLACE FUNCTION fn_siguiente_turno(p_asignacion_diaria_espacio_id BIGINT)
RETURNS INT AS $$
DECLARE
    v_turno INT;
BEGIN
    INSERT INTO contador_turno_diario (asignacion_diaria_espacio_id, turno_actual, turno_siguiente)
    VALUES (p_asignacion_diaria_espacio_id, 0, 1)
    ON CONFLICT (asignacion_diaria_espacio_id) DO NOTHING;

    UPDATE contador_turno_diario
       SET turno_siguiente = turno_siguiente + 1
     WHERE asignacion_diaria_espacio_id = p_asignacion_diaria_espacio_id
    RETURNING turno_siguiente - 1 INTO v_turno;

    RETURN v_turno;
END;
$$ LANGUAGE plpgsql;

-- 13.5 Siguiente turno global por fecha
CREATE OR REPLACE FUNCTION fn_siguiente_turno_fecha(p_fecha DATE)
RETURNS INT AS $$
DECLARE
    v_turno INT;
BEGIN
    INSERT INTO contador_turno_fecha (fecha, turno_actual, turno_siguiente)
    VALUES (p_fecha, 0, 1)
    ON CONFLICT (fecha) DO NOTHING;

    UPDATE contador_turno_fecha
       SET turno_siguiente = turno_siguiente + 1
     WHERE fecha = p_fecha
    RETURNING turno_siguiente - 1 INTO v_turno;

    RETURN v_turno;
END;
$$ LANGUAGE plpgsql;

-- 13.6 Cálculo de hora estimada según posición en la fila (lineal)
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

-- 13.7 Integridad clínica: bloquear cambios de estado en citas terminales
CREATE OR REPLACE FUNCTION fn_prevenir_modificacion_estado_terminal_cita()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.estado IN ('atendida', 'cancelada', 'reprogramada', 'no_asistio')
       AND NEW.estado IS DISTINCT FROM OLD.estado THEN
        RAISE EXCEPTION 'Regla Clínica HRO: No se permite modificar el estado de una cita en estado terminal "%" a "%"', OLD.estado, NEW.estado;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 13.8 Cierre diario atómico de inasistencias
CREATE OR REPLACE FUNCTION fn_cierre_diario_inasistencias(
    p_fecha              DATE,
    p_subespecialidad_id BIGINT,
    p_usuario_id         BIGINT
)
RETURNS INT AS $$
DECLARE
    v_total_actualizadas INT := 0;
    r_cita RECORD;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM usuario_referencia WHERE id = p_usuario_id) THEN
        RAISE EXCEPTION 'Usuario con ID % no existe para registrar el cierre diario', p_usuario_id;
    END IF;

    FOR r_cita IN
        SELECT c.id AS cita_id, c.estado AS estado_anterior
          FROM cita c
          JOIN cupo_diario cd ON cd.id = c.cupo_diario_id
          JOIN subespecialidad_horario sh ON sh.id = cd.subespecialidad_horario_id
         WHERE cd.fecha = p_fecha
           AND (p_subespecialidad_id IS NULL OR sh.subespecialidad_id = p_subespecialidad_id)
           AND c.estado IN ('pendiente', 'confirmada')
           AND NOT EXISTS (
               SELECT 1 FROM turno t WHERE t.cita_id = c.id AND t.estado = 'atendido'
           )
    LOOP
        UPDATE cita
           SET estado = 'no_asistio', actualizado_en = now()
         WHERE id = r_cita.cita_id;

        INSERT INTO cita_estado_historial (cita_id, estado_anterior, estado_nuevo, usuario_referencia_id, motivo, fecha_cambio)
        VALUES (r_cita.cita_id, r_cita.estado_anterior, 'no_asistio', p_usuario_id,
                'Inasistencia al cierre de jornada (Cierre Atómico BD): Paciente no se presentó a consulta.', now());

        v_total_actualizadas := v_total_actualizadas + 1;
    END LOOP;

    UPDATE turno t
       SET estado = 'no_responde'
      FROM cita c
      JOIN cupo_diario cd ON cd.id = c.cupo_diario_id
      JOIN subespecialidad_horario sh ON sh.id = cd.subespecialidad_horario_id
     WHERE t.cita_id = c.id
       AND cd.fecha = p_fecha
       AND (p_subespecialidad_id IS NULL OR sh.subespecialidad_id = p_subespecialidad_id)
       AND t.estado IN ('en_espera', 'llamado');

    RETURN v_total_actualizadas;
END;
$$ LANGUAGE plpgsql;

-- 13.9 Cobertura: subespecialidades programadas sin espacio asignado
CREATE OR REPLACE FUNCTION fn_subespecialidades_sin_asignar(p_fecha DATE)
RETURNS TABLE (subespecialidad_id BIGINT, subespecialidad_nombre VARCHAR) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT s.id, s.nombre
      FROM subespecialidad_horario sh
      JOIN subespecialidad s ON s.id = sh.subespecialidad_id
     WHERE sh.activo = TRUE
       AND sh.dia_semana = EXTRACT(ISODOW FROM p_fecha)::smallint
       AND s.activo = TRUE
       AND NOT EXISTS (
           SELECT 1 FROM asignacion_diaria_espacio a
            WHERE a.fecha = p_fecha AND a.subespecialidad_id = sh.subespecialidad_id
       )
     ORDER BY s.nombre;
END;
$$ LANGUAGE plpgsql STABLE;

-- 13.10 Marca de tiempo + versión optimista para "expediente_ciclo"
CREATE OR REPLACE FUNCTION fn_expediente_ciclo_actualizar_marca_tiempo()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en := now();
    IF NEW.version = OLD.version THEN
        NEW.version := OLD.version + 1;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- 14. VISTA: duración real observada de atención
-- =====================================================================

CREATE OR REPLACE VIEW vw_duracion_real_atencion AS
SELECT
    c.cupo_diario_id,
    cd.subespecialidad_horario_id,
    sh.subespecialidad_id,
    t.cita_id,
    t.hora_llamado,
    t.hora_atendido,
    EXTRACT(EPOCH FROM (t.hora_atendido - t.hora_llamado)) / 60.0 AS minutos_reales
FROM turno t
JOIN cita c ON c.id = t.cita_id
JOIN cupo_diario cd ON cd.id = c.cupo_diario_id
JOIN subespecialidad_horario sh ON sh.id = cd.subespecialidad_horario_id
WHERE t.hora_llamado IS NOT NULL
  AND t.hora_atendido IS NOT NULL;

COMMENT ON VIEW vw_duracion_real_atencion IS
    'Duración real de cada consulta atendida. Insumo para recalcular duracion_consulta_minutos.';

-- =====================================================================
-- 15. TRIGGERS
-- =====================================================================

CREATE TRIGGER trg_cita_actualizar_marca_tiempo
    BEFORE UPDATE ON cita
    FOR EACH ROW
    EXECUTE FUNCTION fn_actualizar_marca_tiempo();

CREATE TRIGGER trg_prevenir_modificacion_estado_terminal_cita
    BEFORE UPDATE OF estado ON cita
    FOR EACH ROW
    EXECUTE FUNCTION fn_prevenir_modificacion_estado_terminal_cita();

CREATE TRIGGER trg_expediente_ciclo_actualizar_marca_tiempo
    BEFORE UPDATE ON expediente_ciclo
    FOR EACH ROW
    EXECUTE FUNCTION fn_expediente_ciclo_actualizar_marca_tiempo();

-- =====================================================================
-- FIN DEL ESQUEMA CONSOLIDADO — HRO V1..V13
-- =====================================================================
