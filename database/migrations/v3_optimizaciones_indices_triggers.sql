-- =====================================================================
-- Migración V3: Optimizaciones de Rendimiento, Índices, Triggers y Cierre Diario Atómico
-- Hospital Regional de Occidente (HRO)
-- =====================================================================

-- 1. ÍNDICES DE ALTO RENDIMIENTO (postgres-patterns)

-- 1.1 Índice Parcial para citas activas por cupo diario
-- Optimiza contarCitasActivasEnCupo al excluir canceladas y reprogramadas
CREATE INDEX IF NOT EXISTS idx_cita_activas_cupo 
    ON cita (cupo_diario_id) 
    WHERE estado NOT IN ('cancelada', 'reprogramada');

-- 1.2 Índice Compuesto para búsqueda de pacientes por apellidos y nombres (autocompletado rápido)
CREATE INDEX IF NOT EXISTS idx_paciente_apellidos_nombres 
    ON paciente (apellidos, nombres);

-- 1.3 Índice Compuesto para citas por cupo y estado
CREATE INDEX IF NOT EXISTS idx_cita_cupo_estado 
    ON cita (cupo_diario_id, estado);

-- 1.4 Índice Compuesto para turnos por cita y estado
CREATE INDEX IF NOT EXISTS idx_turno_cita_estado 
    ON turno (cita_id, estado);

-- 1.5 Índice Compuesto para turnos por estado y hora de llamado/generación
CREATE INDEX IF NOT EXISTS idx_turno_estado_hora 
    ON turno (estado, hora_generado);

-- 1.6 Índices GIN en campos JSONB de auditoria_general (búsqueda rápida en trazas)
CREATE INDEX IF NOT EXISTS idx_auditoria_valores_nuevos_gin 
    ON auditoria_general USING gin (valores_nuevos);

CREATE INDEX IF NOT EXISTS idx_auditoria_valores_anteriores_gin 
    ON auditoria_general USING gin (valores_anteriores);


-- 1.7 Refinamiento de fn_actualizar_marca_tiempo para no interferir con Hibernate en cascadas ON DELETE SET NULL
CREATE OR REPLACE FUNCTION fn_actualizar_marca_tiempo()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en := now();
    -- Solo auto-incrementar si la aplicación/Hibernate no manejó ya el campo version
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

-- 2. REGLA DE INTEGRIDAD CLÍNICA MEDIANTE TRIGGER:
-- Prevenir alteración ilícita de citas en estados terminales ('atendida', 'cancelada', 'reprogramada', 'no_asistio')
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

DROP TRIGGER IF EXISTS trg_prevenir_modificacion_estado_terminal_cita ON cita;
CREATE TRIGGER trg_prevenir_modificacion_estado_terminal_cita
    BEFORE UPDATE OF estado ON cita
    FOR EACH ROW
    EXECUTE FUNCTION fn_prevenir_modificacion_estado_terminal_cita();


-- 3. PROCEDIMIENTO / FUNCIÓN ATÓMICA DE CIERRE DIARIO DE INASISTENCIAS
-- Ejecuta en un solo paso dentro del motor de base de datos el cierre de jornada,
-- actualizando citas pendientes/no respondidas a 'no_asistio' e insertando en cita_estado_historial
CREATE OR REPLACE FUNCTION fn_cierre_diario_inasistencias(
    p_fecha DATE,
    p_clinica_id BIGINT,
    p_usuario_id BIGINT
)
RETURNS INT AS $$
DECLARE
    v_total_actualizadas INT := 0;
    r_cita RECORD;
BEGIN
    -- Validar que el usuario exista
    IF NOT EXISTS (SELECT 1 FROM usuario_referencia WHERE id = p_usuario_id) THEN
        RAISE EXCEPTION 'Usuario con ID % no existe para registrar el cierre diario', p_usuario_id;
    END IF;

    -- Cursor sobre citas pendientes o confirmadas sin atención asociadas a la fecha y clínica
    FOR r_cita IN
        SELECT c.id AS cita_id, c.estado AS estado_anterior
        FROM cita c
        JOIN cupo_diario cd ON cd.id = c.cupo_diario_id
        JOIN medico_clinica mc ON mc.id = cd.medico_clinica_id
        WHERE cd.fecha = p_fecha
          AND (p_clinica_id IS NULL OR mc.clinica_id = p_clinica_id)
          AND c.estado IN ('pendiente', 'confirmada')
          AND NOT EXISTS (
              SELECT 1 FROM turno t
              WHERE t.cita_id = c.id AND t.estado = 'atendido'
          )
    LOOP
        -- Actualizar estado de la cita a 'no_asistio' (NO libera cupo_diario)
        UPDATE cita
           SET estado = 'no_asistio',
               actualizado_en = now()
         WHERE id = r_cita.cita_id;

        -- Registrar en cita_estado_historial
        INSERT INTO cita_estado_historial (
            cita_id,
            estado_anterior,
            estado_nuevo,
            usuario_referencia_id,
            motivo,
            fecha_cambio
        ) VALUES (
            r_cita.cita_id,
            r_cita.estado_anterior,
            'no_asistio',
            p_usuario_id,
            'Inasistencia al cierre de jornada (Cierre Atómico BD): Paciente no se presentó a consulta.',
            now()
        );

        v_total_actualizadas := v_total_actualizadas + 1;
    END LOOP;

    -- Actualizar turnos pendientes/llamados a no_responde
    UPDATE turno t
       SET estado = 'no_responde'
      FROM cita c
      JOIN cupo_diario cd ON cd.id = c.cupo_diario_id
      JOIN medico_clinica mc ON mc.id = cd.medico_clinica_id
     WHERE t.cita_id = c.id
       AND cd.fecha = p_fecha
       AND (p_clinica_id IS NULL OR mc.clinica_id = p_clinica_id)
       AND t.estado IN ('en_espera', 'llamado');

    RETURN v_total_actualizadas;
END;
$$ LANGUAGE plpgsql;
