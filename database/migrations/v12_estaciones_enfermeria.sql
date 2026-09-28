-- =====================================================================
-- Migración V12: Estaciones de enfermería y tableros por área
-- Hospital Regional de Occidente (HRO)
--
-- Motivación de negocio:
--   El personal de enfermería trabaja en "estaciones" (puestos de trabajo)
--   distribuidas en distintas secciones. Cada estación atiende un conjunto
--   de subespecialidades y su tablero de turnos solo debe mostrar el área
--   que le corresponde (no todas las áreas del hospital).
--
-- Decisión de modelo:
--   La estación agrupa SUBESPECIALIDADES (relación N:M), con PERTENENCIA
--   ÚNICA: una subespecialidad pertenece a lo sumo a una estación. Así un
--   turno nunca aparece en dos tableros.
--
--   No se modelan "salas propias": las salas (espacio_fisico) se derivan de
--   la subespecialidad vía asignacion_diaria_espacio. Tampoco se fija la
--   estación al usuario: es de la SESIÓN (rotación de personal), por lo que
--   solo se registra en la bitácora estacion_acceso.
--
-- Estrategia: solo tablas nuevas (aditivo). No modifica datos existentes.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Estación de enfermería (puesto de trabajo)
-- ---------------------------------------------------------------------
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
COMMENT ON COLUMN estacion_enfermeria.codigo IS
    'Código corto y estable para identificar la estación (p. ej. EST-01).';

-- ---------------------------------------------------------------------
-- 2. Subespecialidades a cargo de cada estación (pertenencia única)
-- ---------------------------------------------------------------------
CREATE TABLE estacion_subespecialidad (
    id                 BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    estacion_id        BIGINT NOT NULL REFERENCES estacion_enfermeria(id) ON DELETE CASCADE,
    subespecialidad_id BIGINT NOT NULL REFERENCES subespecialidad(id)     ON DELETE RESTRICT,
    activo             BOOLEAN     NOT NULL DEFAULT TRUE,
    creado_en          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_estacion_subespecialidad UNIQUE (estacion_id, subespecialidad_id),
    -- Pertenencia única: una subespecialidad no se reparte entre estaciones.
    -- Alternativa si se necesita desactivar y reasignar:
    --   CREATE UNIQUE INDEX ... ON estacion_subespecialidad (subespecialidad_id) WHERE activo;
    CONSTRAINT uq_estacion_sub_unica UNIQUE (subespecialidad_id)
);

COMMENT ON TABLE estacion_subespecialidad IS
    'Subespecialidades a cargo de una estación. Pertenencia única (una subespecialidad = una estación).';

CREATE INDEX idx_estacion_sub_estacion ON estacion_subespecialidad(estacion_id);
CREATE INDEX idx_estacion_sub_subespecialidad ON estacion_subespecialidad(subespecialidad_id);

-- ---------------------------------------------------------------------
-- 3. Bitácora de acceso a la estación (rotación de personal)
-- ---------------------------------------------------------------------
CREATE TABLE estacion_acceso (
    id                    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    estacion_id           BIGINT NOT NULL REFERENCES estacion_enfermeria(id) ON DELETE RESTRICT,
    usuario_referencia_id BIGINT NOT NULL REFERENCES usuario_referencia(id)  ON DELETE RESTRICT,
    entrado_en            TIMESTAMPTZ NOT NULL DEFAULT now(),
    salido_en             TIMESTAMPTZ
);

COMMENT ON TABLE estacion_acceso IS
    'Registro de qué usuario entró a qué estación y en qué momento (rotación de personal).';

CREATE INDEX idx_estacion_acceso_estacion ON estacion_acceso(estacion_id);
CREATE INDEX idx_estacion_acceso_usuario  ON estacion_acceso(usuario_referencia_id);
