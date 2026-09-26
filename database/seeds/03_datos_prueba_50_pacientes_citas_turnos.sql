-- =====================================================================
-- SEEDS: Datos de Prueba Completos (50 Pacientes, Citas, Turnos y Trazabilidad)
-- Hospital Regional de Occidente (HRO) - Quetzaltenango
-- =====================================================================

-- 1. POBLACIÓN DE 50 PACIENTES DE QUETZALTENANGO Y SUROCCIDENTE
INSERT INTO paciente (dpi, nombres, apellidos, fecha_nacimiento, sexo, telefono, direccion, numero_expediente)
VALUES
    ('2984123450901', 'Juan Carlos', 'López Morales', '1985-04-12', 'M', '50255551234', 'Zona 1, Quetzaltenango', 'EXP-2024-001'),
    ('1823948570901', 'María Elena', 'Gómez Sac', '1992-08-23', 'F', '50244445678', 'Zona 3, Quetzaltenango', 'EXP-2024-002'),
    ('2567891230801', 'Pedro Antonio', 'Citalán Pérez', '1958-11-05', 'M', '50277778910', 'Cantel, Quetzaltenango', 'EXP-2023-8941'),
    ('3012456780901', 'Ana Sofía', 'Méndez Castillo', '2001-02-18', 'F', '50233334455', 'Salcajá, Quetzaltenango', 'EXP-2024-003'),
    ('1945678901201', 'Carlos Enrique', 'Oroxom Vásquez', '1974-06-30', 'M', '50255559988', 'San Mateo, Quetzaltenango', 'EXP-2024-004'),
    ('2789123450901', 'Silvia Patricia', 'De León Fuentes', '1965-09-14', 'F', '50244441122', 'La Esperanza, Quetzaltenango', 'EXP-2022-5412'),
    ('3123456780901', 'José David', 'Alvarado Tzoc', '1998-12-01', 'M', '50255557766', 'Olintepeque, Quetzaltenango', 'EXP-2024-005'),
    ('2234567890901', 'Rosa Amalia', 'Rodas Chojolán', '1952-03-25', 'F', '50277773344', 'Zona 5, Quetzaltenango', 'EXP-2021-1209'),
    ('2890123450901', 'Francisco Javier', 'Guzmán Estrada', '1988-07-19', 'M', '50233338899', 'Almolonga, Quetzaltenango', 'EXP-2024-006'),
    ('3245678900901', 'Glendy Marisol', 'Xicay Batz', '2003-10-08', 'F', '50244446677', 'Zunil, Quetzaltenango', 'EXP-2024-007'),
    ('2019482010901', 'Manuel Alejandro', 'Coyoy Pisquiy', '1979-01-15', 'M', '50255123456', 'Zona 2, Quetzaltenango', 'EXP-2024-008'),
    ('2678129030901', 'Hilda Lucrecia', 'Sop Cojulum', '1983-05-22', 'F', '50244234567', 'San Juan Ostuncalco', 'EXP-2024-009'),
    ('3098124560901', 'Diego Fernando', 'Puac Quiej', '2000-09-11', 'M', '50255345678', 'Cantel, Quetzaltenango', 'EXP-2024-010'),
    ('1789456120901', 'Irma Yolanda', 'Macario Yac', '1962-04-03', 'F', '50277456789', 'Salcajá, Quetzaltenango', 'EXP-2024-011'),
    ('2456128900901', 'Luis Alberto', 'Escobar Maldonado', '1970-12-19', 'M', '50233567890', 'Zona 7, Quetzaltenango', 'EXP-2024-012'),
    ('3145672340901', 'Karla Paola', 'Sánchez Barrios', '1995-07-04', 'F', '50244678901', 'La Esperanza, Quetzaltenango', 'EXP-2024-013'),
    ('2876543210901', 'Edgar Rolando', 'Chávez Cabrera', '1981-11-28', 'M', '50255789012', 'San Mateo, Quetzaltenango', 'EXP-2024-014'),
    ('2345671230901', 'Marta Julia', 'Ixquiac Guarchaj', '1967-02-14', 'F', '50277890123', 'Zunil, Quetzaltenango', 'EXP-2024-015'),
    ('3390124560901', 'Brandon Steve', 'Gramajo Noriega', '2004-06-25', 'M', '50233901234', 'Zona 10, Quetzaltenango', 'EXP-2024-016'),
    ('2156789010901', 'Vilma Esperanza', 'Tzún Poz', '1976-10-31', 'F', '50244012345', 'Almolonga, Quetzaltenango', 'EXP-2024-017'),
    ('2712348900901', 'Héctor René', 'Colop García', '1984-03-09', 'M', '50255129876', 'Cantel, Quetzaltenango', 'EXP-2024-018'),
    ('1998765430901', 'Sandra Elizabeth', 'Reyes Ochoa', '1972-08-17', 'F', '50277239876', 'Coatepeque, Quetzaltenango', 'EXP-2024-019'),
    ('3045671290901', 'Kevin Josué', 'Tax Cotoc', '1999-05-02', 'M', '50233349876', 'Olintepeque, Quetzaltenango', 'EXP-2024-020'),
    ('2590123450901', 'Miriam Judith', 'Soto Monzón', '1980-12-24', 'F', '50244459876', 'Zona 4, Quetzaltenango', 'EXP-2024-021'),
    ('1845678900901', 'Víctor Hugo', 'Mazariegos Díaz', '1960-09-08', 'M', '50255569876', 'Zona 1, Quetzaltenango', 'EXP-2024-022'),
    ('3201948570901', 'Astrid Melissa', 'Pacajoj Tiu', '2002-04-16', 'F', '50277679876', 'San Juan Ostuncalco', 'EXP-2024-023'),
    ('2689012340901', 'Julio César', 'Arango Quiñónez', '1982-01-29', 'M', '50233789876', 'Salcajá, Quetzaltenango', 'EXP-2024-024'),
    ('2212345670901', 'Gloria Marina', 'Chuc Quiché', '1969-07-13', 'F', '50244899876', 'Concepción Chiquirichapa', 'EXP-2024-025'),
    ('3178901230901', 'Walter Daniel', 'Pérez Samayoa', '1997-11-20', 'M', '50255909876', 'Zona 8, Quetzaltenango', 'EXP-2024-026'),
    ('2945678900901', 'Claudia Lorena', 'Vielman Castillo', '1986-06-05', 'F', '50277019876', 'La Esperanza, Quetzaltenango', 'EXP-2024-027'),
    ('2056789120901', 'Oscar René', 'Huertas Cardona', '1975-02-27', 'M', '50233128765', 'Zona 9, Quetzaltenango', 'EXP-2024-028'),
    ('2765432100901', 'Ingrid Noemí', 'Citalán Chan', '1987-10-18', 'F', '50244238765', 'Cantel, Quetzaltenango', 'EXP-2024-029'),
    ('3312345670901', 'Cristian David', 'Gutiérrez Morales', '2005-03-30', 'M', '50255348765', 'Zona 3, Quetzaltenango', 'EXP-2024-030'),
    ('1756789010901', 'Blanca Lidia', 'Tzic Siquinajay', '1955-08-21', 'F', '50277458765', 'Almolonga, Quetzaltenango', 'EXP-2024-031'),
    ('2490123450901', 'Ramiro Antonio', 'Palacios Rivera', '1978-05-14', 'M', '50233568765', 'San Mateo, Quetzaltenango', 'EXP-2024-032'),
    ('3078901230901', 'Evelyn Roxana', 'García Ixcaraguá', '1996-12-09', 'F', '50244678765', 'Zunil, Quetzaltenango', 'EXP-2024-033'),
    ('2834567890901', 'Gustavo Adolfo', 'Paz Hurtado', '1989-09-02', 'M', '50255788765', 'Zona 6, Quetzaltenango', 'EXP-2024-034'),
    ('2190123450901', 'Dora Alicia', 'Ajxup Chum', '1971-04-26', 'F', '50277898765', 'San Juan Ostuncalco', 'EXP-2024-035'),
    ('3289012340901', 'Edwin Osberto', 'Morán Calderón', '2001-08-15', 'M', '50233908765', 'Olintepeque, Quetzaltenango', 'EXP-2024-036'),
    ('2612345670901', 'Mayra Alejandra', 'Vasquez Cifuentes', '1983-03-11', 'F', '50244018765', 'Zona 1, Quetzaltenango', 'EXP-2024-037'),
    ('1923456780901', 'Jorge Mario', 'Batres Aguilar', '1968-11-03', 'M', '50255127654', 'Salcajá, Quetzaltenango', 'EXP-2024-038'),
    ('3156789010901', 'Wendy Paola', 'Xicará Caxaj', '1994-06-22', 'F', '50277237654', 'Cantel, Quetzaltenango', 'EXP-2024-039'),
    ('2790123450901', 'Ricardo Leonel', 'Barreno Ordóñez', '1985-01-19', 'M', '50233347654', 'Zona 2, Quetzaltenango', 'EXP-2024-040'),
    ('2389012340901', 'Sonia Maribel', 'Yax García', '1977-07-07', 'F', '50244457654', 'Concepción Chiquirichapa', 'EXP-2024-041'),
    ('3345678900901', 'Axel Giovanni', 'Tiu Sacalxot', '2003-12-12', 'M', '50255567654', 'Zona 5, Quetzaltenango', 'EXP-2024-042'),
    ('1890123450901', 'Teresa De Jesús', 'Molina Estrada', '1963-05-18', 'F', '50277677654', 'Coatepeque, Quetzaltenango', 'EXP-2024-043'),
    ('2512345670901', 'César Augusto', 'Santizo Menchú', '1973-10-25', 'M', '50233787654', 'La Esperanza, Quetzaltenango', 'EXP-2024-044'),
    ('3023456780901', 'Karen Dayana', 'Quijivix Velásquez', '1998-02-08', 'F', '50244897654', 'Zona 11, Quetzaltenango', 'EXP-2024-045'),
    ('2867890120901', 'Byron Estuardo', 'Cucul Chaj', '1984-08-30', 'M', '50255907654', 'San Juan Ostuncalco', 'EXP-2024-046'),
    ('2278901230901', 'Lilian Violeta', 'López Chavaloc', '1974-09-17', 'F', '50277017654', 'Almolonga, Quetzaltenango', 'EXP-2024-047'),
    ('3190123450901', 'Jonathan Alexis', 'Estrada Rodas', '1999-04-05', 'M', '50233126543', 'Zona 1, Quetzaltenango', 'EXP-2024-048'),
    ('2912345670901', 'Aura Leticia', 'Guzmán Sajquim', '1988-12-16', 'F', '50244236543', 'Salcajá, Quetzaltenango', 'EXP-2024-049'),
    ('2078901230901', 'Marcos Tulio', 'Alonso De León', '1979-03-24', 'M', '50255346543', 'Olintepeque, Quetzaltenango', 'EXP-2024-050')
ON CONFLICT (dpi) DO UPDATE 
SET nombres = EXCLUDED.nombres, 
    apellidos = EXCLUDED.apellidos, 
    telefono = EXCLUDED.telefono, 
    direccion = EXCLUDED.direccion,
    numero_expediente = EXCLUDED.numero_expediente;


-- 2. CUPOS DIARIOS PARA FECHAS DE PRUEBA (Ayer, Hoy, Mañana, Próxima Semana)
DO $$
DECLARE
    r_ms RECORD;
    v_fecha DATE;
    v_fechas DATE[] := ARRAY[CURRENT_DATE - 1, CURRENT_DATE, CURRENT_DATE + 1, CURRENT_DATE + 7];
BEGIN
    -- Se generan cupos para todas las fechas de prueba (independiente del día) para
    -- que el set de demostración siempre tenga datos utilizables.
    FOR r_ms IN SELECT id, capacidad_maxima FROM medico_subespecialidad WHERE activo = true LOOP
        FOREACH v_fecha IN ARRAY v_fechas LOOP
            INSERT INTO cupo_diario (medico_subespecialidad_id, fecha, capacidad_maxima, cupos_ocupados)
            VALUES (r_ms.id, v_fecha, r_ms.capacidad_maxima, 0)
            ON CONFLICT (medico_subespecialidad_id, fecha) DO UPDATE
            SET capacidad_maxima = EXCLUDED.capacidad_maxima,
                cupos_ocupados = 0;
        END LOOP;
    END LOOP;
END $$;


-- 2.5 ASIGNACIÓN DIARIA: qué subespecialidad ocupa qué espacio físico cada fecha
DO $$
DECLARE
    v_user BIGINT;
    v_fecha DATE;
    v_fechas DATE[] := ARRAY[CURRENT_DATE - 1, CURRENT_DATE, CURRENT_DATE + 1, CURRENT_DATE + 7];
    r_sub RECORD;
    v_espacio uuid;
BEGIN
    SELECT id INTO v_user FROM usuario_referencia WHERE id_externo = 'jefe-enfermeria-01';
    IF v_user IS NULL THEN SELECT id INTO v_user FROM usuario_referencia ORDER BY id LIMIT 1; END IF;

    FOREACH v_fecha IN ARRAY v_fechas LOOP
        FOR r_sub IN
            SELECT DISTINCT s.id, s.nombre
            FROM medico_subespecialidad ms
            JOIN subespecialidad s ON s.id = ms.subespecialidad_id
            WHERE ms.activo = true
            ORDER BY s.nombre
        LOOP
            SELECT ef.id INTO v_espacio
            FROM espacio_fisico ef
            WHERE ef.activo = true
              AND NOT EXISTS (SELECT 1 FROM asignacion_diaria_espacio a WHERE a.fecha = v_fecha AND a.espacio_fisico_id = ef.id)
            ORDER BY ef.nivel, ef.numero
            LIMIT 1;

            IF v_espacio IS NOT NULL THEN
                INSERT INTO asignacion_diaria_espacio (espacio_fisico_id, subespecialidad_id, fecha, creado_por)
                VALUES (v_espacio, r_sub.id, v_fecha, v_user)
                ON CONFLICT (espacio_fisico_id, fecha) DO NOTHING;
            END IF;
        END LOOP;
    END LOOP;
END $$;


-- 3. POBLACIÓN DE CITAS CON DIVERSIDAD DE ESTADOS DEL CICLO DE VIDA
DO $$
DECLARE
    v_user_id BIGINT;
    v_cupo_ayer_medgen uuid;
    v_cupo_ayer_pedgen uuid;
    v_cupo_hoy_medgen uuid;
    v_cupo_hoy_cardio uuid;
    v_cupo_hoy_pedgen uuid;
    v_cupo_manana_medgen uuid;
    v_cupo_semana_medgen uuid;
    r_pac RECORD;
    v_idx INT := 1;
    v_cita_id BIGINT;
    v_cita_reprog_id BIGINT;
    v_asig BIGINT;
BEGIN
    SELECT id INTO v_user_id FROM usuario_referencia LIMIT 1;

    SELECT cd.id INTO v_cupo_ayer_medgen
    FROM cupo_diario cd JOIN medico_subespecialidad ms ON ms.id = cd.medico_subespecialidad_id JOIN subespecialidad s ON s.id = ms.subespecialidad_id
    WHERE cd.fecha = CURRENT_DATE - 1 AND s.nombre = 'Medicina General' LIMIT 1;

    SELECT cd.id INTO v_cupo_ayer_pedgen
    FROM cupo_diario cd JOIN medico_subespecialidad ms ON ms.id = cd.medico_subespecialidad_id JOIN subespecialidad s ON s.id = ms.subespecialidad_id
    WHERE cd.fecha = CURRENT_DATE - 1 AND s.nombre = 'Pediatría General' LIMIT 1;

    SELECT cd.id INTO v_cupo_hoy_medgen
    FROM cupo_diario cd JOIN medico_subespecialidad ms ON ms.id = cd.medico_subespecialidad_id JOIN subespecialidad s ON s.id = ms.subespecialidad_id
    WHERE cd.fecha = CURRENT_DATE AND s.nombre = 'Medicina General' LIMIT 1;

    SELECT cd.id INTO v_cupo_hoy_cardio
    FROM cupo_diario cd JOIN medico_subespecialidad ms ON ms.id = cd.medico_subespecialidad_id JOIN subespecialidad s ON s.id = ms.subespecialidad_id
    WHERE cd.fecha = CURRENT_DATE AND s.nombre = 'Cardiología Clínica' LIMIT 1;

    SELECT cd.id INTO v_cupo_hoy_pedgen
    FROM cupo_diario cd JOIN medico_subespecialidad ms ON ms.id = cd.medico_subespecialidad_id JOIN subespecialidad s ON s.id = ms.subespecialidad_id
    WHERE cd.fecha = CURRENT_DATE AND s.nombre = 'Pediatría General' LIMIT 1;

    SELECT cd.id INTO v_cupo_manana_medgen
    FROM cupo_diario cd JOIN medico_subespecialidad ms ON ms.id = cd.medico_subespecialidad_id JOIN subespecialidad s ON s.id = ms.subespecialidad_id
    WHERE cd.fecha = CURRENT_DATE + 1 AND s.nombre = 'Medicina General' LIMIT 1;

    SELECT cd.id INTO v_cupo_semana_medgen
    FROM cupo_diario cd JOIN medico_subespecialidad ms ON ms.id = cd.medico_subespecialidad_id JOIN subespecialidad s ON s.id = ms.subespecialidad_id
    WHERE cd.fecha = CURRENT_DATE + 7 AND s.nombre = 'Medicina General' LIMIT 1;

    IF v_cupo_ayer_medgen IS NULL THEN SELECT id INTO v_cupo_ayer_medgen FROM cupo_diario WHERE fecha = CURRENT_DATE - 1 LIMIT 1; END IF;
    IF v_cupo_ayer_pedgen IS NULL THEN v_cupo_ayer_pedgen := v_cupo_ayer_medgen; END IF;
    IF v_cupo_hoy_medgen IS NULL THEN SELECT id INTO v_cupo_hoy_medgen FROM cupo_diario WHERE fecha = CURRENT_DATE LIMIT 1; END IF;
    IF v_cupo_hoy_cardio IS NULL THEN v_cupo_hoy_cardio := v_cupo_hoy_medgen; END IF;
    IF v_cupo_hoy_pedgen IS NULL THEN v_cupo_hoy_pedgen := v_cupo_hoy_medgen; END IF;
    IF v_cupo_manana_medgen IS NULL THEN SELECT id INTO v_cupo_manana_medgen FROM cupo_diario WHERE fecha = CURRENT_DATE + 1 LIMIT 1; END IF;
    IF v_cupo_semana_medgen IS NULL THEN SELECT id INTO v_cupo_semana_medgen FROM cupo_diario WHERE fecha = CURRENT_DATE + 7 LIMIT 1; END IF;

    UPDATE cupo_diario
       SET cupos_ocupados = 0,
           capacidad_maxima = GREATEST(capacidad_maxima, 30)
     WHERE id IN (v_cupo_ayer_medgen, v_cupo_ayer_pedgen, v_cupo_hoy_medgen, v_cupo_hoy_cardio, v_cupo_hoy_pedgen, v_cupo_manana_medgen, v_cupo_semana_medgen);

    FOR r_pac IN SELECT id, dpi, nombres, apellidos FROM paciente ORDER BY id LIMIT 50 LOOP

        IF v_idx BETWEEN 1 AND 15 THEN
            DECLARE
                v_cupo_target uuid := CASE WHEN v_idx <= 8 THEN v_cupo_ayer_medgen ELSE v_cupo_ayer_pedgen END;
            BEGIN
                INSERT INTO cita (paciente_id, cupo_diario_id, hora_estimada, hora_ventana_inicio, hora_ventana_fin, estado, registrado_por, version)
                VALUES (r_pac.id, v_cupo_target, '08:00'::time + ((v_idx * 15) || ' minutes')::interval, '07:45'::time, '08:45'::time, 'atendida', v_user_id, 1)
                RETURNING id INTO v_cita_id;

                INSERT INTO cita_estado_historial (cita_id, estado_anterior, estado_nuevo, usuario_referencia_id, motivo, fecha_cambio)
                VALUES (v_cita_id, NULL, 'pendiente', v_user_id, 'Agendamiento regular', CURRENT_DATE - 1 + '07:00'::time);
                INSERT INTO cita_estado_historial (cita_id, estado_anterior, estado_nuevo, usuario_referencia_id, motivo, fecha_cambio)
                VALUES (v_cita_id, 'pendiente', 'confirmada', v_user_id, 'Check-in enfermería', CURRENT_DATE - 1 + '07:45'::time);
                INSERT INTO cita_estado_historial (cita_id, estado_anterior, estado_nuevo, usuario_referencia_id, motivo, fecha_cambio)
                VALUES (v_cita_id, 'confirmada', 'atendida', v_user_id, 'Consulta médica finalizada con prescripción', CURRENT_DATE - 1 + '08:30'::time);

                v_asig := (SELECT a.id FROM asignacion_diaria_espacio a JOIN cupo_diario cd2 ON cd2.fecha = a.fecha JOIN medico_subespecialidad ms2 ON ms2.id = cd2.medico_subespecialidad_id AND ms2.subespecialidad_id = a.subespecialidad_id WHERE cd2.id = v_cupo_target LIMIT 1);
                INSERT INTO turno (cita_id, asignacion_diaria_espacio_id, numero_turno, estado, intentos_llamado, hora_generado, hora_llamado, hora_atendido)
                VALUES (v_cita_id, v_asig, v_idx, 'atendido', 1, CURRENT_DATE - 1 + '07:45'::time, CURRENT_DATE - 1 + '08:05'::time, CURRENT_DATE - 1 + '08:30'::time);

                UPDATE cupo_diario SET cupos_ocupados = cupos_ocupados + 1 WHERE id = v_cupo_target;
            END;

        ELSIF v_idx BETWEEN 16 AND 25 THEN
            DECLARE
                v_pos INT := v_idx - 15;
            BEGIN
                INSERT INTO cita (paciente_id, cupo_diario_id, hora_estimada, hora_ventana_inicio, hora_ventana_fin, estado, registrado_por, version)
                VALUES (r_pac.id, v_cupo_hoy_medgen, '08:00'::time + ((v_pos * 25) || ' minutes')::interval, '07:45'::time, '08:45'::time, 'confirmada', v_user_id, 0)
                RETURNING id INTO v_cita_id;

                INSERT INTO cita_estado_historial (cita_id, estado_anterior, estado_nuevo, usuario_referencia_id, motivo, fecha_cambio)
                VALUES (v_cita_id, NULL, 'pendiente', v_user_id, 'Agendamiento ventanilla', now() - INTERVAL '3 hours');
                INSERT INTO cita_estado_historial (cita_id, estado_anterior, estado_nuevo, usuario_referencia_id, motivo, fecha_cambio)
                VALUES (v_cita_id, 'pendiente', 'confirmada', v_user_id, 'Paciente en sala de espera HRO', now() - INTERVAL '30 minutes');

                v_asig := (SELECT a.id FROM asignacion_diaria_espacio a JOIN cupo_diario cd2 ON cd2.fecha = a.fecha JOIN medico_subespecialidad ms2 ON ms2.id = cd2.medico_subespecialidad_id AND ms2.subespecialidad_id = a.subespecialidad_id WHERE cd2.id = v_cupo_hoy_medgen LIMIT 1);
                IF v_pos IN (1, 2) THEN
                    INSERT INTO turno (cita_id, asignacion_diaria_espacio_id, numero_turno, estado, intentos_llamado, hora_generado, hora_llamado)
                    VALUES (v_cita_id, v_asig, v_pos, 'llamado', 1, now() - INTERVAL '30 minutes', now() - INTERVAL '5 minutes');
                ELSIF v_pos = 3 THEN
                    INSERT INTO turno (cita_id, asignacion_diaria_espacio_id, numero_turno, estado, intentos_llamado, hora_generado, hora_llamado)
                    VALUES (v_cita_id, v_asig, v_pos, 'no_responde', 2, now() - INTERVAL '40 minutes', now() - INTERVAL '15 minutes');
                ELSE
                    INSERT INTO turno (cita_id, asignacion_diaria_espacio_id, numero_turno, estado, intentos_llamado, hora_generado)
                    VALUES (v_cita_id, v_asig, v_pos, 'en_espera', 0, now() - INTERVAL '30 minutes');
                END IF;

                UPDATE cupo_diario SET cupos_ocupados = cupos_ocupados + 1 WHERE id = v_cupo_hoy_medgen;
            END;

        ELSIF v_idx BETWEEN 26 AND 35 THEN
            DECLARE
                v_cupo_target uuid := CASE WHEN v_idx <= 30 THEN v_cupo_hoy_cardio ELSE v_cupo_manana_medgen END;
                v_pos INT := v_idx - 25;
            BEGIN
                INSERT INTO cita (paciente_id, cupo_diario_id, hora_estimada, hora_ventana_inicio, hora_ventana_fin, estado, registrado_por, version)
                VALUES (r_pac.id, v_cupo_target, '09:00'::time + ((v_pos * 20) || ' minutes')::interval, '08:45'::time, '09:45'::time, 'pendiente', v_user_id, 0)
                RETURNING id INTO v_cita_id;

                INSERT INTO cita_estado_historial (cita_id, estado_anterior, estado_nuevo, usuario_referencia_id, motivo, fecha_cambio)
                VALUES (v_cita_id, NULL, 'pendiente', v_user_id, 'Cita agendada previamente', now() - INTERVAL '1 day');

                UPDATE cupo_diario SET cupos_ocupados = cupos_ocupados + 1 WHERE id = v_cupo_target;
            END;

        ELSIF v_idx BETWEEN 36 AND 40 THEN
            INSERT INTO cita (paciente_id, cupo_diario_id, hora_estimada, hora_ventana_inicio, hora_ventana_fin, estado, registrado_por, version)
            VALUES (r_pac.id, v_cupo_ayer_pedgen, '11:00'::time + (((v_idx - 35) * 20) || ' minutes')::interval, '10:45'::time, '11:45'::time, 'no_asistio', v_user_id, 1)
            RETURNING id INTO v_cita_id;

            INSERT INTO cita_estado_historial (cita_id, estado_anterior, estado_nuevo, usuario_referencia_id, motivo, fecha_cambio)
            VALUES (v_cita_id, NULL, 'pendiente', v_user_id, 'Agendada en sistema', CURRENT_DATE - 1 + '08:00'::time);
            INSERT INTO cita_estado_historial (cita_id, estado_anterior, estado_nuevo, usuario_referencia_id, motivo, fecha_cambio)
            VALUES (v_cita_id, 'pendiente', 'no_asistio', v_user_id, 'Inasistencia al cierre de jornada: Paciente no se presentó a consulta.', CURRENT_DATE - 1 + '14:00'::time);

            UPDATE cupo_diario SET cupos_ocupados = cupos_ocupados + 1 WHERE id = v_cupo_ayer_pedgen;

        ELSIF v_idx BETWEEN 41 AND 45 THEN
            INSERT INTO cita (paciente_id, cupo_diario_id, hora_estimada, hora_ventana_inicio, hora_ventana_fin, estado, registrado_por, version)
            VALUES (r_pac.id, v_cupo_hoy_pedgen, '09:30'::time, '09:00'::time, '10:00'::time, 'cancelada', v_user_id, 1)
            RETURNING id INTO v_cita_id;

            INSERT INTO cita_estado_historial (cita_id, estado_anterior, estado_nuevo, usuario_referencia_id, motivo, fecha_cambio)
            VALUES (v_cita_id, NULL, 'pendiente', v_user_id, 'Cita programada', now() - INTERVAL '2 days');
            INSERT INTO cita_estado_historial (cita_id, estado_anterior, estado_nuevo, usuario_referencia_id, motivo, fecha_cambio)
            VALUES (v_cita_id, 'pendiente', 'cancelada', v_user_id, 'Paciente notificó imposibilidad de traslado desde municipio', now() - INTERVAL '1 day');

        ELSE
            INSERT INTO cita (paciente_id, cupo_diario_id, hora_estimada, hora_ventana_inicio, hora_ventana_fin, estado, registrado_por, version)
            VALUES (r_pac.id, v_cupo_ayer_medgen, '08:30'::time, '08:00'::time, '09:00'::time, 'reprogramada', v_user_id, 1)
            RETURNING id INTO v_cita_id;

            INSERT INTO cita (paciente_id, cupo_diario_id, hora_estimada, hora_ventana_inicio, hora_ventana_fin, estado, cita_origen_id, registrado_por, version)
            VALUES (r_pac.id, v_cupo_semana_medgen, '08:30'::time, '08:00'::time, '09:00'::time, 'pendiente', v_cita_id, v_user_id, 0)
            RETURNING id INTO v_cita_reprog_id;

            INSERT INTO cita_estado_historial (cita_id, estado_anterior, estado_nuevo, usuario_referencia_id, motivo, fecha_cambio)
            VALUES (v_cita_id, NULL, 'pendiente', v_user_id, 'Cita programada original', CURRENT_DATE - 2);
            INSERT INTO cita_estado_historial (cita_id, estado_anterior, estado_nuevo, usuario_referencia_id, motivo, fecha_cambio)
            VALUES (v_cita_id, 'pendiente', 'reprogramada', v_user_id, 'Reprogramación solicitada por ausencia justificada del médico especialista', CURRENT_DATE - 1);

            INSERT INTO cita_estado_historial (cita_id, estado_anterior, estado_nuevo, usuario_referencia_id, motivo, fecha_cambio)
            VALUES (v_cita_reprog_id, NULL, 'pendiente', v_user_id, 'Cita generada por reprogramación de cita #' || v_cita_id, CURRENT_DATE - 1);

            UPDATE cupo_diario SET cupos_ocupados = cupos_ocupados + 1 WHERE id = v_cupo_semana_medgen;
        END IF;

        v_idx := v_idx + 1;
    END LOOP;
END $$;


-- 4. CONTADOR DIARIO DE TURNOS PARA PANTALLAS DE SALA (por asignación diaria)
INSERT INTO contador_turno_diario (asignacion_diaria_espacio_id, turno_actual, turno_siguiente)
SELECT a.id, 2, 11
FROM asignacion_diaria_espacio a
WHERE a.fecha = CURRENT_DATE
ON CONFLICT (asignacion_diaria_espacio_id) DO UPDATE
SET turno_actual = EXCLUDED.turno_actual,
    turno_siguiente = EXCLUDED.turno_siguiente;
