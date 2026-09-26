-- =====================================================================
-- Migración V4: Separación entre espacio físico y especialidad asignada
-- Hospital Regional de Occidente (HRO)
--
-- Motivación de negocio:
--   La especialidad que atiende en cada sala cambia TODOS LOS DÍAS y la
--   decide el jefe de enfermería en la mañana. El diseño original ligaba
--   la clínica (sala) de forma permanente a una subespecialidad, lo cual
--   ya no representa la operación real.
--
-- Estrategia (expandir -> migrar datos -> contraer):
--   1) Renombrar clinica -> espacio_fisico y enriquecerla (sin borrar aún
--      subespecialidad_id, que se necesita para el backfill).
--   2) Crear tablas nuevas (asignación diaria, cierre, planos).
--   3) Backfill de asignacion_diaria_espacio con el histórico derivable.
--   4) Renombrar medico_clinica -> medico_subespecialidad (conservando
--      clinica_id temporalmente para el backfill de turnos).
--   5) Ajustar cupo_diario, turno, contador_turno_diario.
--   6) Renombrar permiso_clinica -> permiso_subespecialidad.
--   7) Recrear funciones/vistas dependientes.
--   8) Contraer: eliminar las columnas puente.
--
-- Todas las FKs de subespecialidad/espacio usan ON DELETE RESTRICT para
-- preservar trazabilidad histórica.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. ROL: agregar jefe_enfermeria al CHECK de usuario_referencia
-- ---------------------------------------------------------------------
ALTER TABLE usuario_referencia DROP CONSTRAINT IF EXISTS usuario_referencia_rol_principal_check;
ALTER TABLE usuario_referencia ADD CONSTRAINT usuario_referencia_rol_principal_check
    CHECK (rol_principal IN ('personal_citas', 'enfermeria', 'medico', 'administrador', 'archivo', 'jefe_enfermeria'));

-- ---------------------------------------------------------------------
-- 1. espacio_fisico (renombrada desde clinica)
-- ---------------------------------------------------------------------
ALTER TABLE clinica RENAME TO espacio_fisico;

ALTER TABLE espacio_fisico ADD COLUMN numero             VARCHAR(30);
ALTER TABLE espacio_fisico ADD COLUMN nivel              SMALLINT;
ALTER TABLE espacio_fisico ADD COLUMN capacidad_camillas INT NOT NULL DEFAULT 1;
ALTER TABLE espacio_fisico ADD COLUMN coordenadas_plano  JSONB;

UPDATE espacio_fisico
   SET numero = COALESCE(NULLIF(regexp_replace(nombre, '[^0-9]', '', 'g'), ''), id::text)
 WHERE numero IS NULL;

UPDATE espacio_fisico
   SET nivel = COALESCE((regexp_match(COALESCE(ubicacion, ''), 'Nivel\s*([0-9]+)'))[1]::smallint, 1)
 WHERE nivel IS NULL;

ALTER TABLE espacio_fisico ALTER COLUMN numero SET NOT NULL;
ALTER TABLE espacio_fisico ALTER COLUMN nivel  SET NOT NULL;
ALTER TABLE espacio_fisico ADD CONSTRAINT espacio_fisico_capacidad_camillas_check CHECK (capacidad_camillas > 0);
ALTER TABLE espacio_fisico ADD CONSTRAINT uq_espacio_fisico_numero UNIQUE (numero);
CREATE INDEX idx_espacio_fisico_nivel ON espacio_fisico(nivel);

COMMENT ON COLUMN espacio_fisico.activo IS
    'Baja lógica. Cubre baja permanente y fuera de servicio temporal por mantenimiento.';
COMMENT ON COLUMN espacio_fisico.coordenadas_plano IS
    'Referencia a la zona/polígono dentro del SVG del nivel (id de zona o coordenadas).';

-- ---------------------------------------------------------------------
-- 2. NUEVAS TABLAS
-- ---------------------------------------------------------------------

-- 2.1 Asignación diaria: qué subespecialidad ocupa qué espacio físico cada fecha
CREATE TABLE asignacion_diaria_espacio (
    id                 BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    espacio_fisico_id  BIGINT NOT NULL,
    subespecialidad_id BIGINT NOT NULL,
    fecha              DATE   NOT NULL,
    creado_por         BIGINT NOT NULL,
    creado_en          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT fk_asignacion_espacio FOREIGN KEY (espacio_fisico_id)
        REFERENCES espacio_fisico(id) ON DELETE RESTRICT,
    CONSTRAINT fk_asignacion_subespecialidad FOREIGN KEY (subespecialidad_id)
        REFERENCES subespecialidad(id) ON DELETE RESTRICT,
    CONSTRAINT fk_asignacion_creado_por FOREIGN KEY (creado_por)
        REFERENCES usuario_referencia(id) ON DELETE RESTRICT,
    CONSTRAINT uq_asignacion_espacio_fecha UNIQUE (espacio_fisico_id, fecha)
);
COMMENT ON TABLE asignacion_diaria_espacio IS
    'Qué subespecialidad ocupa cada espacio físico en una fecha. La asigna el jefe de enfermería cada mañana.';

-- 2.2 Cierre diario de la asignación (bloqueo tras confirmar la organización del día)
CREATE TABLE cierre_asignacion_diaria (
    fecha          DATE PRIMARY KEY,
    estado         VARCHAR(10) NOT NULL DEFAULT 'abierta'
                   CHECK (estado IN ('abierta', 'cerrada')),
    confirmado_por BIGINT,
    confirmado_en  TIMESTAMPTZ,
    CONSTRAINT fk_cierre_confirmado_por FOREIGN KEY (confirmado_por)
        REFERENCES usuario_referencia(id) ON DELETE RESTRICT
);
COMMENT ON TABLE cierre_asignacion_diaria IS
    'Bloquea la asignación diaria una vez que el jefe de enfermería confirma la organización del día.';

-- 2.3 Plano SVG por nivel (recurso compartido, no un blob por sala)
CREATE TABLE plano_hospital (
    id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nivel          SMALLINT NOT NULL UNIQUE,
    archivo_svg    VARCHAR(255) NOT NULL,
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE plano_hospital IS
    'Ruta del archivo SVG del plano por nivel. Un plano es un recurso compartido por todas las salas del nivel.';

-- ---------------------------------------------------------------------
-- 3. BACKFILL DE asignacion_diaria_espacio DESDE EL HISTÓRICO
--    (requiere clinica.subespecialidad_id, aún presente)
-- ---------------------------------------------------------------------
INSERT INTO asignacion_diaria_espacio (espacio_fisico_id, subespecialidad_id, fecha, creado_por, creado_en)
SELECT DISTINCT ON (ef.id, cd.fecha)
       ef.id, ef.subespecialidad_id, cd.fecha, u.id, now()
  FROM cupo_diario cd
  JOIN medico_clinica mc ON mc.id = cd.medico_clinica_id
  JOIN espacio_fisico ef ON ef.id = mc.clinica_id
  JOIN usuario_referencia u ON u.id = (SELECT id FROM usuario_referencia ORDER BY id LIMIT 1)
 WHERE ef.subespecialidad_id IS NOT NULL
 ORDER BY ef.id, cd.fecha, cd.id
ON CONFLICT (espacio_fisico_id, fecha) DO NOTHING;

-- ---------------------------------------------------------------------
-- 4. medico_clinica -> medico_subespecialidad
--    (se conserva clinica_id temporalmente para el backfill de turnos)
-- ---------------------------------------------------------------------
ALTER TABLE medico_clinica RENAME TO medico_subespecialidad;

ALTER TABLE medico_subespecialidad ADD COLUMN subespecialidad_id BIGINT;
UPDATE medico_subespecialidad ms
   SET subespecialidad_id = ef.subespecialidad_id
  FROM espacio_fisico ef
 WHERE ef.id = ms.clinica_id;

DELETE FROM medico_subespecialidad a
 USING medico_subespecialidad b
 WHERE a.id > b.id
   AND a.medico_id = b.medico_id
   AND a.subespecialidad_id = b.subespecialidad_id
   AND a.dia_semana = b.dia_semana;

ALTER TABLE medico_subespecialidad ALTER COLUMN subespecialidad_id SET NOT NULL;
ALTER TABLE medico_subespecialidad
    ADD CONSTRAINT fk_medico_subespecialidad FOREIGN KEY (subespecialidad_id)
        REFERENCES subespecialidad(id) ON DELETE RESTRICT;
ALTER TABLE medico_subespecialidad
    ADD CONSTRAINT uq_medico_subespecialidad_dia UNIQUE (medico_id, subespecialidad_id, dia_semana);

-- ---------------------------------------------------------------------
-- 5. cupo_diario: medico_clinica_id -> medico_subespecialidad_id
-- ---------------------------------------------------------------------
ALTER TABLE cupo_diario RENAME COLUMN medico_clinica_id TO medico_subespecialidad_id;
ALTER TABLE cupo_diario
    RENAME CONSTRAINT cupo_diario_medico_clinica_id_fkey TO fk_cupo_medico_subespecialidad;
ALTER TABLE cupo_diario
    RENAME CONSTRAINT cupo_diario_medico_clinica_id_fecha_key TO uq_cupo_medico_subespecialidad_fecha;

-- ---------------------------------------------------------------------
-- 6. turno: agregar asignacion_diaria_espacio_id y backfill
-- ---------------------------------------------------------------------
ALTER TABLE turno ADD COLUMN asignacion_diaria_espacio_id BIGINT;
UPDATE turno t
   SET asignacion_diaria_espacio_id = a.id
  FROM cita c
  JOIN cupo_diario cd ON cd.id = c.cupo_diario_id
  JOIN medico_subespecialidad ms ON ms.id = cd.medico_subespecialidad_id
  JOIN asignacion_diaria_espacio a
       ON a.fecha = cd.fecha AND a.espacio_fisico_id = ms.clinica_id
 WHERE c.id = t.cita_id;
ALTER TABLE turno
    ADD CONSTRAINT fk_turno_asignacion FOREIGN KEY (asignacion_diaria_espacio_id)
        REFERENCES asignacion_diaria_espacio(id) ON DELETE RESTRICT;

-- ---------------------------------------------------------------------
-- 7. contador_turno_diario: clinica_id+fecha -> asignacion_diaria_espacio_id
-- ---------------------------------------------------------------------
ALTER TABLE contador_turno_diario ADD COLUMN asignacion_diaria_espacio_id BIGINT;
UPDATE contador_turno_diario ct
   SET asignacion_diaria_espacio_id = a.id
  FROM asignacion_diaria_espacio a
 WHERE a.espacio_fisico_id = ct.clinica_id AND a.fecha = ct.fecha;
ALTER TABLE contador_turno_diario DROP CONSTRAINT IF EXISTS contador_turno_diario_clinica_id_fkey;
ALTER TABLE contador_turno_diario DROP CONSTRAINT IF EXISTS contador_turno_diario_clinica_id_fecha_key;
ALTER TABLE contador_turno_diario DROP COLUMN clinica_id;
ALTER TABLE contador_turno_diario DROP COLUMN fecha;
ALTER TABLE contador_turno_diario
    ADD CONSTRAINT fk_contador_asignacion FOREIGN KEY (asignacion_diaria_espacio_id)
        REFERENCES asignacion_diaria_espacio(id) ON DELETE RESTRICT;
ALTER TABLE contador_turno_diario
    ADD CONSTRAINT uq_contador_asignacion UNIQUE (asignacion_diaria_espacio_id);

-- ---------------------------------------------------------------------
-- 8. permiso_clinica -> permiso_subespecialidad
-- ---------------------------------------------------------------------
ALTER TABLE permiso_clinica RENAME TO permiso_subespecialidad;
ALTER TABLE permiso_subespecialidad ADD COLUMN subespecialidad_id BIGINT;
UPDATE permiso_subespecialidad p
   SET subespecialidad_id = ef.subespecialidad_id
  FROM espacio_fisico ef
 WHERE ef.id = p.clinica_id;
ALTER TABLE permiso_subespecialidad ALTER COLUMN subespecialidad_id SET NOT NULL;
ALTER TABLE permiso_subespecialidad DROP CONSTRAINT IF EXISTS fk_permiso_clinica_clinica;
ALTER TABLE permiso_subespecialidad DROP CONSTRAINT IF EXISTS permiso_clinica_usuario_referencia_id_clinica_id_tipo_permi_key;
ALTER TABLE permiso_subespecialidad DROP COLUMN clinica_id;
ALTER TABLE permiso_subespecialidad
    ADD CONSTRAINT fk_permiso_subespecialidad FOREIGN KEY (subespecialidad_id)
        REFERENCES subespecialidad(id) ON DELETE RESTRICT;
ALTER TABLE permiso_subespecialidad
    ADD CONSTRAINT uq_permiso_subespecialidad UNIQUE (usuario_referencia_id, subespecialidad_id, tipo_permiso);

-- ---------------------------------------------------------------------
-- 9. FUNCIONES Y VISTAS DEPENDIENTES
-- ---------------------------------------------------------------------

-- 9.1 fn_siguiente_turno ahora recibe la asignación diaria (la fecha es implícita)
DROP FUNCTION IF EXISTS fn_siguiente_turno(BIGINT, DATE);
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

-- 9.2 Cierre diario de inasistencias: filtra por subespecialidad
DROP FUNCTION IF EXISTS fn_cierre_diario_inasistencias(DATE, BIGINT, BIGINT);
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
          JOIN medico_subespecialidad ms ON ms.id = cd.medico_subespecialidad_id
         WHERE cd.fecha = p_fecha
           AND (p_subespecialidad_id IS NULL OR ms.subespecialidad_id = p_subespecialidad_id)
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
      JOIN medico_subespecialidad ms ON ms.id = cd.medico_subespecialidad_id
     WHERE t.cita_id = c.id
       AND cd.fecha = p_fecha
       AND (p_subespecialidad_id IS NULL OR ms.subespecialidad_id = p_subespecialidad_id)
       AND t.estado IN ('en_espera', 'llamado');

    RETURN v_total_actualizadas;
END;
$$ LANGUAGE plpgsql;

-- 9.3 Cobertura: subespecialidades con médicos programados ese día sin espacio asignado
CREATE OR REPLACE FUNCTION fn_subespecialidades_sin_asignar(p_fecha DATE)
RETURNS TABLE (subespecialidad_id BIGINT, subespecialidad_nombre VARCHAR) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT s.id, s.nombre
      FROM medico_subespecialidad ms
      JOIN subespecialidad s ON s.id = ms.subespecialidad_id
     WHERE ms.activo = TRUE
       AND ms.dia_semana = EXTRACT(ISODOW FROM p_fecha)::smallint
       AND s.activo = TRUE
       AND NOT EXISTS (
           SELECT 1 FROM asignacion_diaria_espacio a
            WHERE a.fecha = p_fecha AND a.subespecialidad_id = ms.subespecialidad_id
       )
     ORDER BY s.nombre;
END;
$$ LANGUAGE plpgsql STABLE;

-- 9.4 Vista de duración real adaptada al nuevo modelo
DROP VIEW IF EXISTS vw_duracion_real_atencion;
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

-- ---------------------------------------------------------------------
-- 10. CONTRACCIÓN: eliminar columnas puente
-- ---------------------------------------------------------------------
ALTER TABLE espacio_fisico DROP CONSTRAINT IF EXISTS clinica_subespecialidad_id_fkey;
ALTER TABLE espacio_fisico DROP COLUMN subespecialidad_id CASCADE;
ALTER TABLE medico_subespecialidad DROP CONSTRAINT IF EXISTS medico_clinica_clinica_id_fkey;
ALTER TABLE medico_subespecialidad DROP COLUMN clinica_id CASCADE;

-- ---------------------------------------------------------------------
-- 11. ÍNDICES DE APOYO DEL NUEVO MODELO
-- ---------------------------------------------------------------------
CREATE INDEX idx_asignacion_fecha ON asignacion_diaria_espacio(fecha);
CREATE INDEX idx_asignacion_subespecialidad ON asignacion_diaria_espacio(subespecialidad_id);
CREATE INDEX idx_medico_subespecialidad_medico ON medico_subespecialidad(medico_id);
CREATE INDEX idx_medico_subespecialidad_sub ON medico_subespecialidad(subespecialidad_id);
CREATE INDEX idx_cupo_diario_medico_sub ON cupo_diario(medico_subespecialidad_id);
CREATE INDEX idx_turno_asignacion ON turno(asignacion_diaria_espacio_id);
CREATE INDEX idx_contador_asignacion ON contador_turno_diario(asignacion_diaria_espacio_id);
