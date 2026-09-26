-- =====================================================================
-- Migración V10: Horario por subespecialidad (días y horas, sin médico)
-- Hospital Regional de Occidente (HRO)
--
-- Antes el horario y la capacidad vivían en `medico_subespecialidad` (por médico).
-- Ahora viven por **subespecialidad** (los médicos rotan y no se asignan a la sala).
-- Consolidación al migrar (mismo subespecialidad + día):
--   * capacidad = SUMA de los médicos
--   * horas     = mín(inicio) .. máx(fin)
--   * duración  = la más frecuente
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------
-- 1. Horario semanal por subespecialidad
-- ---------------------------------------------------------------------
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
    'Horario semanal (días y horas) y capacidad diaria por subespecialidad, independiente del médico.';

CREATE INDEX idx_subespecialidad_horario_sub ON subespecialidad_horario(subespecialidad_id);

-- ---------------------------------------------------------------------
-- 2. Backfill consolidando desde medico_subespecialidad
-- ---------------------------------------------------------------------
INSERT INTO subespecialidad_horario
    (subespecialidad_id, dia_semana, hora_inicio, hora_fin, capacidad_maxima, duracion_consulta_minutos, activo)
SELECT ms.subespecialidad_id,
       ms.dia_semana,
       MIN(ms.hora_inicio),
       MAX(ms.hora_fin),
       SUM(ms.capacidad_maxima),
       MODE() WITHIN GROUP (ORDER BY ms.duracion_consulta_minutos),
       BOOL_OR(ms.activo)
  FROM medico_subespecialidad ms
 GROUP BY ms.subespecialidad_id, ms.dia_semana;

-- ---------------------------------------------------------------------
-- 3. cupo_diario pasa a apuntar al horario de subespecialidad
-- ---------------------------------------------------------------------
ALTER TABLE cupo_diario ADD COLUMN subespecialidad_horario_id uuid;

UPDATE cupo_diario cd
   SET subespecialidad_horario_id = sh.id
  FROM medico_subespecialidad ms
  JOIN subespecialidad_horario sh
    ON sh.subespecialidad_id = ms.subespecialidad_id
   AND sh.dia_semana = ms.dia_semana
 WHERE cd.medico_subespecialidad_id = ms.id;

ALTER TABLE cupo_diario ALTER COLUMN subespecialidad_horario_id SET NOT NULL;

-- La vista dependiente de la columna debe eliminarse antes de dropearla
DROP VIEW IF EXISTS vw_duracion_real_atencion;

ALTER TABLE cupo_diario DROP CONSTRAINT IF EXISTS uq_cupo_medico_subespecialidad_fecha;
ALTER TABLE cupo_diario DROP CONSTRAINT IF EXISTS fk_cupo_medico_subespecialidad;
ALTER TABLE cupo_diario DROP COLUMN medico_subespecialidad_id;

ALTER TABLE cupo_diario
    ADD CONSTRAINT fk_cupo_horario FOREIGN KEY (subespecialidad_horario_id)
        REFERENCES subespecialidad_horario(id) ON DELETE RESTRICT;
ALTER TABLE cupo_diario
    ADD CONSTRAINT uq_cupo_horario_fecha UNIQUE (subespecialidad_horario_id, fecha);
CREATE INDEX idx_cupo_diario_horario ON cupo_diario(subespecialidad_horario_id);

-- ---------------------------------------------------------------------
-- 4. Funciones y vistas dependientes
-- ---------------------------------------------------------------------
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

DROP VIEW IF EXISTS vw_duracion_real_atencion;
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
