-- =====================================================================
-- Migración V5: Cambio de claves primarias a UUID
-- Hospital Regional de Occidente (HRO)
--
-- Tablas afectadas (PK bigint identity -> uuid):
--   paciente, medico, medico_subespecialidad, espacio_fisico,
--   cupo_diario, orden_laboratorio, resultado_laboratorio, mensaje_hl7_log
--
-- FKs que pasan a uuid:
--   cita.paciente_id, cita.cupo_diario_id,
--   medico_subespecialidad.medico_id, cupo_diario.medico_subespecialidad_id,
--   asignacion_diaria_espacio.espacio_fisico_id,
--   mensaje_hl7_log.orden_laboratorio_id, resultado_laboratorio.orden_laboratorio_id
--
-- Estrategia: se agrega una columna uuid nueva, se hace backfill preservando
-- las relaciones (mapeando por el id numérico), y luego se reemplazan las
-- columnas antiguas. Funciona tanto en bases vacías como con datos.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 0. Vista dependiente (se recrea al final)
DROP VIEW IF EXISTS vw_duracion_real_atencion;

-- ---------------------------------------------------------------------
-- 1. Nuevas columnas uuid en las tablas padre
-- ---------------------------------------------------------------------
ALTER TABLE paciente             ADD COLUMN id_uuid uuid DEFAULT gen_random_uuid();
ALTER TABLE medico               ADD COLUMN id_uuid uuid DEFAULT gen_random_uuid();
ALTER TABLE espacio_fisico       ADD COLUMN id_uuid uuid DEFAULT gen_random_uuid();
ALTER TABLE medico_subespecialidad ADD COLUMN id_uuid uuid DEFAULT gen_random_uuid();
ALTER TABLE cupo_diario          ADD COLUMN id_uuid uuid DEFAULT gen_random_uuid();
ALTER TABLE orden_laboratorio    ADD COLUMN id_uuid uuid DEFAULT gen_random_uuid();
ALTER TABLE resultado_laboratorio ADD COLUMN id_uuid uuid DEFAULT gen_random_uuid();
ALTER TABLE mensaje_hl7_log      ADD COLUMN id_uuid uuid DEFAULT gen_random_uuid();

-- ---------------------------------------------------------------------
-- 2. Nuevas columnas uuid en las tablas hijas + backfill de relaciones
-- ---------------------------------------------------------------------
ALTER TABLE cita ADD COLUMN paciente_id_uuid uuid;
ALTER TABLE cita ADD COLUMN cupo_diario_id_uuid uuid;
UPDATE cita c SET paciente_id_uuid = p.id_uuid FROM paciente p WHERE c.paciente_id = p.id;
UPDATE cita c SET cupo_diario_id_uuid = cd.id_uuid FROM cupo_diario cd WHERE c.cupo_diario_id = cd.id;

ALTER TABLE medico_subespecialidad ADD COLUMN medico_id_uuid uuid;
UPDATE medico_subespecialidad ms SET medico_id_uuid = m.id_uuid FROM medico m WHERE ms.medico_id = m.id;

ALTER TABLE cupo_diario ADD COLUMN medico_subespecialidad_id_uuid uuid;
UPDATE cupo_diario cd SET medico_subespecialidad_id_uuid = ms.id_uuid FROM medico_subespecialidad ms WHERE cd.medico_subespecialidad_id = ms.id;

ALTER TABLE asignacion_diaria_espacio ADD COLUMN espacio_fisico_id_uuid uuid;
UPDATE asignacion_diaria_espacio a SET espacio_fisico_id_uuid = ef.id_uuid FROM espacio_fisico ef WHERE a.espacio_fisico_id = ef.id;

ALTER TABLE mensaje_hl7_log ADD COLUMN orden_laboratorio_id_uuid uuid;
UPDATE mensaje_hl7_log ml SET orden_laboratorio_id_uuid = ol.id_uuid FROM orden_laboratorio ol WHERE ml.orden_laboratorio_id = ol.id;

ALTER TABLE resultado_laboratorio ADD COLUMN orden_laboratorio_id_uuid uuid;
UPDATE resultado_laboratorio rl SET orden_laboratorio_id_uuid = ol.id_uuid FROM orden_laboratorio ol WHERE rl.orden_laboratorio_id = ol.id;

-- ---------------------------------------------------------------------
-- 3. Eliminar PKs y FKs que dependen de las columnas a reemplazar
-- ---------------------------------------------------------------------
DO $$
DECLARE r RECORD;
BEGIN
    FOR r IN
        SELECT conname, conrelid::regclass AS tbl
          FROM pg_constraint
         WHERE contype = 'f'
           AND confrelid::regclass::text IN ('paciente','medico','espacio_fisico','medico_subespecialidad','cupo_diario','orden_laboratorio','resultado_laboratorio','mensaje_hl7_log')
    LOOP
        EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', r.tbl, r.conname);
    END LOOP;

    FOR r IN
        SELECT conname, conrelid::regclass AS tbl
          FROM pg_constraint
         WHERE contype = 'p'
           AND conrelid::regclass::text IN ('paciente','medico','espacio_fisico','medico_subespecialidad','cupo_diario','orden_laboratorio','resultado_laboratorio','mensaje_hl7_log')
    LOOP
        EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', r.tbl, r.conname);
    END LOOP;
END $$;

-- ---------------------------------------------------------------------
-- 4. Reemplazar columnas FK en tablas hijas
-- ---------------------------------------------------------------------
ALTER TABLE cita DROP COLUMN paciente_id;
ALTER TABLE cita DROP COLUMN cupo_diario_id;
ALTER TABLE cita RENAME COLUMN paciente_id_uuid TO paciente_id;
ALTER TABLE cita RENAME COLUMN cupo_diario_id_uuid TO cupo_diario_id;

ALTER TABLE medico_subespecialidad DROP COLUMN medico_id;
ALTER TABLE medico_subespecialidad RENAME COLUMN medico_id_uuid TO medico_id;

ALTER TABLE cupo_diario DROP COLUMN medico_subespecialidad_id;
ALTER TABLE cupo_diario RENAME COLUMN medico_subespecialidad_id_uuid TO medico_subespecialidad_id;

ALTER TABLE asignacion_diaria_espacio DROP COLUMN espacio_fisico_id;
ALTER TABLE asignacion_diaria_espacio RENAME COLUMN espacio_fisico_id_uuid TO espacio_fisico_id;

ALTER TABLE mensaje_hl7_log DROP COLUMN orden_laboratorio_id;
ALTER TABLE mensaje_hl7_log RENAME COLUMN orden_laboratorio_id_uuid TO orden_laboratorio_id;

ALTER TABLE resultado_laboratorio DROP COLUMN orden_laboratorio_id;
ALTER TABLE resultado_laboratorio RENAME COLUMN orden_laboratorio_id_uuid TO orden_laboratorio_id;

-- ---------------------------------------------------------------------
-- 5. Reemplazar la PK en las tablas padre
-- ---------------------------------------------------------------------
ALTER TABLE paciente DROP COLUMN id;
ALTER TABLE paciente RENAME COLUMN id_uuid TO id;
ALTER TABLE paciente ALTER COLUMN id SET NOT NULL;
ALTER TABLE paciente ADD CONSTRAINT paciente_pkey PRIMARY KEY (id);

ALTER TABLE medico DROP COLUMN id;
ALTER TABLE medico RENAME COLUMN id_uuid TO id;
ALTER TABLE medico ALTER COLUMN id SET NOT NULL;
ALTER TABLE medico ADD CONSTRAINT medico_pkey PRIMARY KEY (id);

ALTER TABLE espacio_fisico DROP COLUMN id;
ALTER TABLE espacio_fisico RENAME COLUMN id_uuid TO id;
ALTER TABLE espacio_fisico ALTER COLUMN id SET NOT NULL;
ALTER TABLE espacio_fisico ADD CONSTRAINT espacio_fisico_pkey PRIMARY KEY (id);

ALTER TABLE medico_subespecialidad DROP COLUMN id;
ALTER TABLE medico_subespecialidad RENAME COLUMN id_uuid TO id;
ALTER TABLE medico_subespecialidad ALTER COLUMN id SET NOT NULL;
ALTER TABLE medico_subespecialidad ADD CONSTRAINT medico_subespecialidad_pkey PRIMARY KEY (id);

ALTER TABLE cupo_diario DROP COLUMN id;
ALTER TABLE cupo_diario RENAME COLUMN id_uuid TO id;
ALTER TABLE cupo_diario ALTER COLUMN id SET NOT NULL;
ALTER TABLE cupo_diario ADD CONSTRAINT cupo_diario_pkey PRIMARY KEY (id);

ALTER TABLE orden_laboratorio DROP COLUMN id;
ALTER TABLE orden_laboratorio RENAME COLUMN id_uuid TO id;
ALTER TABLE orden_laboratorio ALTER COLUMN id SET NOT NULL;
ALTER TABLE orden_laboratorio ADD CONSTRAINT orden_laboratorio_pkey PRIMARY KEY (id);

ALTER TABLE resultado_laboratorio DROP COLUMN id;
ALTER TABLE resultado_laboratorio RENAME COLUMN id_uuid TO id;
ALTER TABLE resultado_laboratorio ALTER COLUMN id SET NOT NULL;
ALTER TABLE resultado_laboratorio ADD CONSTRAINT resultado_laboratorio_pkey PRIMARY KEY (id);

ALTER TABLE mensaje_hl7_log DROP COLUMN id;
ALTER TABLE mensaje_hl7_log RENAME COLUMN id_uuid TO id;
ALTER TABLE mensaje_hl7_log ALTER COLUMN id SET NOT NULL;
ALTER TABLE mensaje_hl7_log ADD CONSTRAINT mensaje_hl7_log_pkey PRIMARY KEY (id);

-- ---------------------------------------------------------------------
-- 6. Restricciones NOT NULL y FKs del nuevo modelo
-- ---------------------------------------------------------------------
ALTER TABLE cita ALTER COLUMN paciente_id SET NOT NULL;
ALTER TABLE cita ALTER COLUMN cupo_diario_id SET NOT NULL;
ALTER TABLE cita ADD CONSTRAINT cita_paciente_id_fkey FOREIGN KEY (paciente_id) REFERENCES paciente(id) ON DELETE RESTRICT;
ALTER TABLE cita ADD CONSTRAINT cita_cupo_diario_id_fkey FOREIGN KEY (cupo_diario_id) REFERENCES cupo_diario(id) ON DELETE RESTRICT;

ALTER TABLE medico_subespecialidad ALTER COLUMN medico_id SET NOT NULL;
ALTER TABLE medico_subespecialidad ADD CONSTRAINT fk_medico_subespecialidad_medico FOREIGN KEY (medico_id) REFERENCES medico(id) ON DELETE RESTRICT;
ALTER TABLE medico_subespecialidad ADD CONSTRAINT uq_medico_subespecialidad_dia UNIQUE (medico_id, subespecialidad_id, dia_semana);

ALTER TABLE cupo_diario ALTER COLUMN medico_subespecialidad_id SET NOT NULL;
ALTER TABLE cupo_diario ADD CONSTRAINT fk_cupo_medico_subespecialidad FOREIGN KEY (medico_subespecialidad_id) REFERENCES medico_subespecialidad(id) ON DELETE RESTRICT;
ALTER TABLE cupo_diario ADD CONSTRAINT uq_cupo_medico_subespecialidad_fecha UNIQUE (medico_subespecialidad_id, fecha);

ALTER TABLE asignacion_diaria_espacio ALTER COLUMN espacio_fisico_id SET NOT NULL;
ALTER TABLE asignacion_diaria_espacio ADD CONSTRAINT fk_asignacion_espacio FOREIGN KEY (espacio_fisico_id) REFERENCES espacio_fisico(id) ON DELETE RESTRICT;
ALTER TABLE asignacion_diaria_espacio ADD CONSTRAINT uq_asignacion_espacio_fecha UNIQUE (espacio_fisico_id, fecha);

ALTER TABLE mensaje_hl7_log ADD CONSTRAINT fk_mensaje_orden FOREIGN KEY (orden_laboratorio_id) REFERENCES orden_laboratorio(id) ON DELETE SET NULL;

ALTER TABLE resultado_laboratorio ALTER COLUMN orden_laboratorio_id SET NOT NULL;
ALTER TABLE resultado_laboratorio ADD CONSTRAINT uq_resultado_orden UNIQUE (orden_laboratorio_id);
ALTER TABLE resultado_laboratorio ADD CONSTRAINT fk_resultado_orden FOREIGN KEY (orden_laboratorio_id) REFERENCES orden_laboratorio(id) ON DELETE CASCADE;

-- ---------------------------------------------------------------------
-- 7. Índices que dependían de las columnas reemplazadas
-- ---------------------------------------------------------------------
CREATE INDEX idx_cita_paciente ON cita(paciente_id);
CREATE INDEX idx_cita_cupo_diario ON cita(cupo_diario_id);
CREATE INDEX idx_cita_cupo_estado ON cita(cupo_diario_id, estado);
CREATE INDEX idx_cita_activas_cupo ON cita(cupo_diario_id) WHERE estado NOT IN ('cancelada', 'reprogramada');
CREATE INDEX idx_medico_subespecialidad_medico ON medico_subespecialidad(medico_id);
CREATE INDEX idx_cupo_diario_medico_sub ON cupo_diario(medico_subespecialidad_id);
CREATE INDEX idx_mensaje_hl7_orden ON mensaje_hl7_log(orden_laboratorio_id);
CREATE INDEX idx_resultado_orden ON resultado_laboratorio(orden_laboratorio_id);

-- ---------------------------------------------------------------------
-- 8. Funciones que reciben ids de las tablas afectadas
-- ---------------------------------------------------------------------
DROP FUNCTION IF EXISTS fn_incrementar_cupo(BIGINT);
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

DROP FUNCTION IF EXISTS fn_decrementar_cupo(BIGINT);
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

-- ---------------------------------------------------------------------
-- 9. Auditoría: entidad_id debe poder almacenar UUID o numérico
-- ---------------------------------------------------------------------
ALTER TABLE auditoria_general ALTER COLUMN entidad_id TYPE VARCHAR(64) USING entidad_id::text;

-- ---------------------------------------------------------------------
-- 10. Recrear vista dependiente
-- ---------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_duracion_real_atencion AS
SELECT
    c.cupo_diario_id,
    cd.medico_subespecialidad_id,
    ms.medico_id,
    ms.subespecialidad_id,
    t.cita_id,
    t.hora_llamado,
    t.hora_atendido,
    EXTRACT(EPOCH FROM (t.hora_atendido - t.hora_llamado)) / 60.0 AS minutos_reales
FROM turno t
JOIN cita c ON c.id = t.cita_id
JOIN cupo_diario cd ON cd.id = c.cupo_diario_id
JOIN medico_subespecialidad ms ON ms.id = cd.medico_subespecialidad_id
WHERE t.hora_llamado IS NOT NULL
  AND t.hora_atendido IS NOT NULL;
