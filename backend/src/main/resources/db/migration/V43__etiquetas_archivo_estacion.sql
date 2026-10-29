-- =====================================================================
-- Migración V43: etiquetas configurables por estación para las salidas
-- de archivo consultadas al Registro Médico.
-- Hospital Regional de Occidente (HRO)
--
-- ADITIVA: no elimina tablas, columnas ni registros existentes.
--   * Crea el catálogo `etiqueta_archivo`.
--   * Crea la asignación `estacion_etiqueta_archivo` (N etiquetas por estación).
--   * Agrega `salida_archivo_hospital.etiqueta_id` (una etiqueta por salida).
--   * Siembra la etiqueta "Clínica de la Mujer" y la asigna a las estaciones
--     existentes, para conservar el comportamiento actual.
--   * Migra las salidas históricas con `es_clinica_mujer = TRUE`.
--   * Conserva la columna `es_clinica_mujer` por compatibilidad.
-- =====================================================================

CREATE TABLE etiqueta_archivo (
    id           BIGSERIAL    PRIMARY KEY,
    codigo       VARCHAR(40)  NOT NULL,
    nombre       VARCHAR(80)  NOT NULL,
    descripcion  VARCHAR(255),
    icono        VARCHAR(40)  NOT NULL DEFAULT 'label',
    color        VARCHAR(20)  NOT NULL DEFAULT 'primary',
    orden        INTEGER      NOT NULL DEFAULT 0,
    activo       BOOLEAN      NOT NULL DEFAULT TRUE,
    creado_en    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_etiqueta_archivo_codigo UNIQUE (codigo)
);

COMMENT ON TABLE etiqueta_archivo IS
    'Catálogo de etiquetas de Archivo. Se asignan por estación y se eligen al registrar una salida.';
COMMENT ON COLUMN etiqueta_archivo.icono IS
    'Nombre del icono Material Symbols usado en la interfaz.';
COMMENT ON COLUMN etiqueta_archivo.color IS
    'Clave de paleta de color de la interfaz (p. ej. rose, blue, emerald).';

CREATE TABLE estacion_etiqueta_archivo (
    id           BIGSERIAL  PRIMARY KEY,
    estacion_id  BIGINT     NOT NULL REFERENCES estacion_enfermeria(id) ON DELETE CASCADE,
    etiqueta_id  BIGINT     NOT NULL REFERENCES etiqueta_archivo(id) ON DELETE CASCADE,
    orden        INTEGER    NOT NULL DEFAULT 0,
    activo       BOOLEAN    NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_estacion_etiqueta_archivo UNIQUE (estacion_id, etiqueta_id)
);

COMMENT ON TABLE estacion_etiqueta_archivo IS
    'Etiquetas habilitadas por estación. Al desasignar se marca activo = FALSE (no se borra la fila).';

CREATE INDEX idx_estacion_etiqueta_archivo_estacion
    ON estacion_etiqueta_archivo (estacion_id, activo, orden);

ALTER TABLE salida_archivo_hospital
    ADD COLUMN etiqueta_id BIGINT REFERENCES etiqueta_archivo(id) ON DELETE SET NULL;

COMMENT ON COLUMN salida_archivo_hospital.etiqueta_id IS
    'Etiqueta elegida por el operador al registrar la salida (opcional, una sola).';

CREATE INDEX idx_salida_hosp_etiqueta ON salida_archivo_hospital (etiqueta_id);

-- Semilla idempotente de la etiqueta que ya existía como booleano fijo.
INSERT INTO etiqueta_archivo (codigo, nombre, descripcion, icono, color, orden, activo)
VALUES (
    'clinica_mujer',
    'Clínica de la Mujer',
    'Active esta etiqueta si el expediente pertenece a la Clínica de la Mujer. Se guardará para la estadística diaria.',
    'female',
    'rose',
    10,
    TRUE
)
ON CONFLICT (codigo) DO NOTHING;

-- Asignar la etiqueta semilla a TODAS las estaciones existentes (activas o no),
-- para no cambiar el comportamiento actual de las estaciones ya configuradas.
INSERT INTO estacion_etiqueta_archivo (estacion_id, etiqueta_id, orden, activo)
SELECT e.id, t.id, 1, TRUE
FROM estacion_enfermeria e
CROSS JOIN etiqueta_archivo t
WHERE t.codigo = 'clinica_mujer'
ON CONFLICT (estacion_id, etiqueta_id) DO NOTHING;

-- Backfill: las salidas históricas marcadas como Clínica de la Mujer pasan a
-- tener su etiqueta. No modifica registros que ya tengan etiqueta.
UPDATE salida_archivo_hospital s
SET etiqueta_id = t.id
FROM etiqueta_archivo t
WHERE t.codigo = 'clinica_mujer'
  AND s.es_clinica_mujer = TRUE
  AND s.etiqueta_id IS NULL;
