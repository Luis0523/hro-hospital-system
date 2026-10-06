-- =====================================================================
-- Seed: ciclos de expediente para probar Mesa COEX y Archivo
-- Hospital Regional de Occidente (HRO)
--
-- Para las citas de HOY con expediente, crea ciclos accionables:
--   - 15 en 'en_transito_entrega'  -> Mesa COEX puede RECIBIR
--   - 10 en 'entregado'            -> Mesa COEX puede DEVOLVER
--   -  8 en 'localizado'           -> Archivo puede DESPACHAR
--   - resto sin ciclo              -> Archivo puede hacer CHECK-IN desde cero
-- Además habilita programación de DOMINGO (dia_semana=7) copiando el lunes,
-- para que /estaciones/{id}/subespecialidades-activas responda hoy.
-- =====================================================================

-- 1) Programación para TODOS los días (1..7) de cada subespecialidad activa,
--    para que /estaciones/{id}/subespecialidades-activas responda cualquier fecha.
INSERT INTO subespecialidad_horario
    (subespecialidad_id, dia_semana, hora_inicio, hora_fin, capacidad_maxima, duracion_consulta_minutos, activo)
SELECT s.id, d.dia,
       COALESCE(sh.hora_inicio, '07:00'::time),
       COALESCE(sh.hora_fin, '13:00'::time),
       COALESCE(sh.capacidad_maxima, 10),
       COALESCE(sh.duracion_consulta_minutos, 30),
       true
FROM subespecialidad s
CROSS JOIN generate_series(1, 7) AS d(dia)
LEFT JOIN LATERAL (
    SELECT hora_inicio, hora_fin, capacidad_maxima, duracion_consulta_minutos
    FROM subespecialidad_horario x
    WHERE x.subespecialidad_id = s.id
    ORDER BY x.dia_semana
    LIMIT 1
) sh ON true
WHERE s.activo
ON CONFLICT (subespecialidad_id, dia_semana) DO NOTHING;

-- 2) Ciclos + su bitácora para las citas de hoy.
DO $$
DECLARE
    v_archivo BIGINT;
    v_enf     BIGINT;
    r         RECORD;
    i         INT := 0;
    v_ciclo   UUID;
    v_estado  TEXT;
    v_version INT;
BEGIN
    SELECT id INTO v_archivo FROM usuario_referencia WHERE id_externo = 'archivo-01' LIMIT 1;
    SELECT id INTO v_enf FROM usuario_referencia WHERE id_externo = 'enfermeria-01' LIMIT 1;
    IF v_archivo IS NULL THEN SELECT id INTO v_archivo FROM usuario_referencia ORDER BY id LIMIT 1; END IF;
    IF v_enf IS NULL THEN SELECT id INTO v_enf FROM usuario_referencia ORDER BY id LIMIT 1; END IF;

    FOR r IN
        SELECT c.id AS cita_id, e.id AS expediente_id
        FROM cita c
        JOIN cupo_diario cd ON cd.id = c.cupo_diario_id
        JOIN expediente e ON e.paciente_id = c.paciente_id
        WHERE cd.fecha = CURRENT_DATE
          AND NOT EXISTS (SELECT 1 FROM expediente_ciclo ec WHERE ec.cita_id = c.id)
        ORDER BY e.numero_expediente
    LOOP
        i := i + 1;

        IF i <= 15 THEN
            v_estado := 'en_transito_entrega'; v_version := 3;
        ELSIF i <= 25 THEN
            v_estado := 'entregado'; v_version := 4;
        ELSIF i <= 33 THEN
            v_estado := 'localizado'; v_version := 2;
        ELSE
            CONTINUE; -- se dejan sin ciclo
        END IF;

        INSERT INTO expediente_ciclo (expediente_id, cita_id, estado_actual, version)
        VALUES (r.expediente_id, r.cita_id, v_estado, v_version)
        RETURNING id INTO v_ciclo;

        INSERT INTO expediente_movimiento (expediente_ciclo_id, estado_anterior, estado_nuevo, usuario_referencia_id, observacion)
        VALUES (v_ciclo, NULL, 'pendiente_localizar', v_archivo, 'Ciclo creado (seed)');

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
