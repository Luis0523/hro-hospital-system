-- =====================================================================
-- Seed: datos de prueba para el 2026-10-04 (domingo local / UTC 2026-10-05)
-- Hospital Regional de Occidente (HRO)
--
-- Replica la jornada para la fecha LOCAL (Guatemala UTC-6), de modo que el
-- frontend funcione con su fecha por defecto. Crea cupos + citas + ciclos
-- accionables para los expedientes existentes.
-- =====================================================================

DO $$
DECLARE
    v_fecha   DATE := DATE '2026-10-04';
    v_archivo BIGINT;
    v_enf     BIGINT;
    r         RECORD;
    i         INT := 0;
    v_cupo    UUID;
    v_ciclo   UUID;
    v_cita    BIGINT;
    v_cupos   UUID[];
    v_estado  TEXT;
    v_version INT;
BEGIN
    SELECT id INTO v_archivo FROM usuario_referencia WHERE id_externo = 'archivo-01' LIMIT 1;
    SELECT id INTO v_enf FROM usuario_referencia WHERE id_externo = 'enfermeria-01' LIMIT 1;
    IF v_archivo IS NULL THEN SELECT id INTO v_archivo FROM usuario_referencia ORDER BY id LIMIT 1; END IF;
    IF v_enf IS NULL THEN SELECT id INTO v_enf FROM usuario_referencia ORDER BY id LIMIT 1; END IF;

    -- Cupos del día (todas las programaciones activas).
    INSERT INTO cupo_diario (fecha, capacidad_maxima, cupos_ocupados, subespecialidad_horario_id)
    SELECT v_fecha, sh.capacidad_maxima, 0, sh.id
    FROM subespecialidad_horario sh
    WHERE sh.activo
    ON CONFLICT (subespecialidad_horario_id, fecha) DO NOTHING;

    SELECT array_agg(id ORDER BY id) INTO v_cupos FROM cupo_diario WHERE fecha = v_fecha;

    -- Citas + ciclos para expedientes que aún no tienen cita ese día.
    FOR r IN
        SELECT e.id AS expediente_id, e.paciente_id
        FROM expediente e
        WHERE NOT EXISTS (
            SELECT 1 FROM cita c
            JOIN cupo_diario cd ON cd.id = c.cupo_diario_id
            WHERE c.paciente_id = e.paciente_id AND cd.fecha = v_fecha
        )
        ORDER BY e.numero_expediente
    LOOP
        i := i + 1;
        v_cupo := v_cupos[((i - 1) % array_length(v_cupos, 1)) + 1];

        INSERT INTO cita (hora_estimada, estado, registrado_por, paciente_id, cupo_diario_id)
        VALUES (('08:00'::time + ((i % 20) * interval '20 minutes')), 'confirmada', v_archivo, r.paciente_id, v_cupo)
        RETURNING id INTO v_cita;

        UPDATE cupo_diario SET cupos_ocupados = cupos_ocupados + 1 WHERE id = v_cupo;

        IF i <= 15 THEN
            v_estado := 'en_transito_entrega'; v_version := 3;
        ELSIF i <= 25 THEN
            v_estado := 'entregado'; v_version := 4;
        ELSIF i <= 33 THEN
            v_estado := 'localizado'; v_version := 2;
        ELSE
            CONTINUE; -- sin ciclo (para check-in)
        END IF;

        INSERT INTO expediente_ciclo (expediente_id, cita_id, estado_actual, version)
        VALUES (r.expediente_id, v_cita, v_estado, v_version)
        RETURNING id INTO v_ciclo;

        INSERT INTO expediente_movimiento (expediente_ciclo_id, estado_anterior, estado_nuevo, usuario_referencia_id, observacion)
        VALUES (v_ciclo, NULL, 'pendiente_localizar', v_archivo, 'Ciclo creado (seed 2026-10-04)');
        INSERT INTO expediente_movimiento (expediente_ciclo_id, estado_anterior, estado_nuevo, usuario_referencia_id, observacion)
        VALUES (v_ciclo, 'pendiente_localizar', 'en_busqueda', v_archivo, 'Búsqueda iniciada');
        INSERT INTO expediente_movimiento (expediente_ciclo_id, estado_anterior, estado_nuevo, usuario_referencia_id, observacion)
        VALUES (v_ciclo, 'en_busqueda', 'localizado', v_archivo, 'Localizado en estantería');
        IF v_estado IN ('en_transito_entrega', 'entregado') THEN
            INSERT INTO expediente_movimiento (expediente_ciclo_id, estado_anterior, estado_nuevo, usuario_referencia_id, observacion)
            VALUES (v_ciclo, 'localizado', 'en_transito_entrega', v_archivo, 'Despachado a COEX');
        END IF;
        IF v_estado = 'entregado' THEN
            INSERT INTO expediente_movimiento (expediente_ciclo_id, estado_anterior, estado_nuevo, usuario_referencia_id, observacion)
            VALUES (v_ciclo, 'en_transito_entrega', 'entregado', v_enf, 'Recibido por enfermería');
        END IF;
    END LOOP;
END $$;
