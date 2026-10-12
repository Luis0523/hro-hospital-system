-- =====================================================================
-- Migración V23: Depuración de expedientes y Consolidado de Archivo
-- Hospital Regional de Occidente (HRO)
--
-- Dos objetivos:
--   1. DEPURACIÓN: dar de baja lógica un expediente (no existe en el sistema).
--      Se marca en `expediente` y se deja bitácora inmutable en
--      `expediente_depuracion` (preparada para Fase 2 / migración de datos:
--      `expediente_id` es nullable para registrar bajas que aún no tienen
--      entidad local).
--   2. CONSOLIDADO: agregados por especialidad para el informe diario/mensual.
--      Se exponen como VISTAS + FUNCIONES para no cargar el GROUP BY en la
--      aplicación. Si el volumen crece, ver la nota final sobre vista
--      materializada.
--
-- Diseño ADITIVO: no se altera ni elimina nada del modelo existente.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. DEPURACIÓN — marca de baja lógica en el expediente
-- ---------------------------------------------------------------------
ALTER TABLE expediente
    ADD COLUMN depurado            BOOLEAN     NOT NULL DEFAULT FALSE,
    ADD COLUMN depurado_en         TIMESTAMPTZ,
    ADD COLUMN depurado_por_id     BIGINT      REFERENCES usuario_referencia(id) ON DELETE SET NULL,
    ADD COLUMN motivo_depuracion   TEXT;

COMMENT ON COLUMN expediente.depurado IS
    'Baja lógica: TRUE cuando el expediente fue depurado (ya no existe en el sistema). La búsqueda debe señalarlo explícitamente.';
COMMENT ON COLUMN expediente.motivo_depuracion IS
    'Motivo por el que se depuró el expediente (auditoría / migración).';

-- Búsquedas por expedientes vigentes vs depurados.
CREATE INDEX idx_expediente_depurado ON expediente(depurado) WHERE depurado;

-- ---------------------------------------------------------------------
-- 2. DEPURACIÓN — bitácora inmutable (Fase 1 + preparada para Fase 2)
-- ---------------------------------------------------------------------
CREATE TABLE expediente_depuracion (
    id                     BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    -- Nullable a propósito: permite registrar una baja durante la migración
    -- aunque todavía no exista la fila local en `expediente`.
    expediente_id          UUID REFERENCES expediente(id) ON DELETE SET NULL,
    numero_expediente      VARCHAR(30)  NOT NULL,
    paciente_nombre        VARCHAR(200),
    paciente_id            UUID REFERENCES paciente(id) ON DELETE SET NULL,
    motivo                 TEXT,
    usuario_referencia_id  BIGINT NOT NULL REFERENCES usuario_referencia(id) ON DELETE RESTRICT,
    depurado_en            TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE expediente_depuracion IS
    'Bitácora inmutable de bajas de expedientes. Cada fila = un expediente depurado; nunca se actualiza ni se borra.';

CREATE INDEX idx_expediente_depuracion_numero ON expediente_depuracion(numero_expediente);
CREATE INDEX idx_expediente_depuracion_fecha  ON expediente_depuracion(depurado_en);

-- Solo una baja vigente por expediente local (idempotencia / no duplicar).
CREATE UNIQUE INDEX uq_expediente_depuracion_expediente
    ON expediente_depuracion(expediente_id)
    WHERE expediente_id IS NOT NULL;

-- ---------------------------------------------------------------------
-- 3. CONSOLIDADO — vista base por especialidad y día
--    Fuente: `carnet` (cada carnet ya trae su especialidad). Es una vista
--    normal (siempre fresca, sin refresh) sobre una tabla indexada por fecha.
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_archivo_consolidado_especialidad AS
SELECT c.fecha                     AS fecha,
       c.especialidad_id           AS especialidad_id,
       e.nombre                    AS especialidad_nombre,
       COUNT(*)                    AS total
FROM carnet c
JOIN especialidad e ON e.id = c.especialidad_id
GROUP BY c.fecha, c.especialidad_id, e.nombre;

COMMENT ON VIEW vw_archivo_consolidado_especialidad IS
    'Consolidado de carnets (expedientes desarchivados por consulta) por día y especialidad. Base del consolidado diario y mensual.';

-- ---------------------------------------------------------------------
-- 4. CONSOLIDADO — vista de resumen diario (carnets + depurados)
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_archivo_resumen_diario AS
SELECT dias.fecha                          AS fecha,
       COALESCE(c.total_carnets, 0)        AS total_carnets,
       COALESCE(d.total_depurados, 0)      AS total_depurados
FROM (
        SELECT fecha FROM carnet
        UNION
        SELECT (depurado_en AT TIME ZONE 'America/Guatemala')::date FROM expediente_depuracion
     ) AS dias
LEFT JOIN (
        SELECT fecha, COUNT(*) AS total_carnets FROM carnet GROUP BY fecha
     ) AS c ON c.fecha = dias.fecha
LEFT JOIN (
        SELECT (depurado_en AT TIME ZONE 'America/Guatemala')::date AS fecha,
               COUNT(*) AS total_depurados
        FROM expediente_depuracion
        GROUP BY 1
     ) AS d ON d.fecha = dias.fecha;

COMMENT ON VIEW vw_archivo_resumen_diario IS
    'Por día: total de carnets (HDC) y total de expedientes depurados (HD). Alimenta el Informe Estadístico de Archivo.';

-- ---------------------------------------------------------------------
-- 5. CONSOLIDADO — funciones de agregación (lo usa la API como una sola llamada)
-- ---------------------------------------------------------------------

-- Detalle de un día: una fila por especialidad, ordenado por volumen.
CREATE OR REPLACE FUNCTION fn_archivo_consolidado_diario(p_fecha DATE)
RETURNS TABLE (especialidad_id BIGINT, especialidad_nombre VARCHAR, total BIGINT) AS $$
    SELECT especialidad_id, especialidad_nombre, total
    FROM vw_archivo_consolidado_especialidad
    WHERE fecha = p_fecha
    ORDER BY total DESC, especialidad_nombre ASC;
$$ LANGUAGE sql STABLE;

COMMENT ON FUNCTION fn_archivo_consolidado_diario(DATE) IS
    'Consolidado diario por especialidad para una fecha (fuente del endpoint /archivo/consolidado/diario).';

-- Detalle de un rango (usado por el consolidado mensual).
CREATE OR REPLACE FUNCTION fn_archivo_consolidado_mensual(p_desde DATE, p_hasta DATE)
RETURNS TABLE (fecha DATE, especialidad_id BIGINT, especialidad_nombre VARCHAR, total BIGINT) AS $$
    SELECT fecha, especialidad_id, especialidad_nombre, total
    FROM vw_archivo_consolidado_especialidad
    WHERE fecha BETWEEN p_desde AND p_hasta
    ORDER BY fecha ASC, especialidad_nombre ASC;
$$ LANGUAGE sql STABLE;

COMMENT ON FUNCTION fn_archivo_consolidado_mensual(DATE, DATE) IS
    'Consolidado por especialidad y día en un rango (fuente del endpoint /archivo/consolidado/mensual).';

-- ---------------------------------------------------------------------
-- 6. NOTA DE ESCALABILIDAD (Fase 2)
-- ---------------------------------------------------------------------
-- Con el volumen actual (decenas/cientos de carnets por día) las vistas
-- anteriores resuelven por índice y son suficientes. Si el histórico crece
-- (millones de filas), promover `vw_archivo_consolidado_especialidad` a
-- MATERIALIZED VIEW y refrescarla por lote:
--
--   CREATE MATERIALIZED VIEW mv_archivo_consolidado_especialidad AS
--     SELECT ... FROM vw_archivo_consolidado_especialidad WITH DATA;
--   CREATE UNIQUE INDEX ON mv_archivo_consolidado_especialidad(fecha, especialidad_id);
--   CREATE OR REPLACE FUNCTION fn_refrescar_consolidado_archivo() RETURNS void AS $$
--     REFRESH MATERIALIZED VIEW CONCURRENTLY mv_archivo_consolidado_especialidad;
--   $$ LANGUAGE sql;
--
-- y reapuntar las funciones `fn_archivo_consolidado_*` a la vista materializada.
-- La forma del contrato de la API NO cambia.
