-- =====================================================================
-- Seed: 35 expedientes extra para pruebas (activo vs pasivo)
-- Hospital Regional de Occidente (HRO)
--
-- Regla PROVISIONAL (solo para probar en el frontend, pendiente con jefes):
--   - Primeros 2 dígitos del nº de expediente entre 00 y 10  -> PASIVO
--   - Primeros 2 dígitos mayores a 10 (11..99)               -> ACTIVO
--
-- Crea 35 pacientes + su expediente físico + cita de HOY.
-- Idempotente por nº de expediente.
-- =====================================================================

DO $$
DECLARE
    v_registrado  BIGINT;
    v_cupos       UUID[];
    v_ubicaciones BIGINT[];
    v_paciente    UUID;
    v_cupo        UUID;
    v_numero      TEXT;
    v_prefix      INT;
    v_nombres     TEXT[] := ARRAY['MARIA','JOSE','ANA','CARLOS','LUCIA','PEDRO','SOFIA','JUAN',
                                  'DANIELA','LUIS','MARTA','JORGE','ELENA','OSCAR','ROSA',
                                  'MIGUEL','PAOLA','ANDRES','KARLA','FELIPE'];
    v_apellidos   TEXT[] := ARRAY['LOPEZ GARCIA','HERNANDEZ MORALES','PEREZ GOMEZ','CASTILLO RAMIREZ',
                                  'MENDEZ AGUILAR','CHAVEZ XILOJ','CAJAS RUIZ','SANCHEZ MARTINEZ',
                                  'GONZALEZ FLORES','ORTIZ CRUZ','DIAZ JUAREZ','BARRIOS VELASQUEZ',
                                  'TIU CALEL','SAJQUI MAZARIEGOS','GIRON DE LEON','MENDOZA ALVAREZ',
                                  'VASQUEZ ROJAS','LOPEZ CASTRO','GOMEZ LOPEZ','RODRIGUEZ PEREZ'];
    v_municipios  TEXT[] := ARRAY['Quetzaltenango, Zona 1','Quetzaltenango, Zona 3',
                                  'Olintepeque, Cantón San Antonio','Salcajá, Calle Real',
                                  'Cantel, Cantón Pasac','La Esperanza, Colonia El Tesoro',
                                  'San Mateo, Barrio El Centro','San Juan Ostuncalco, Aldea',
                                  'Zunil, Cantón Central','Almolonga, Calle Principal'];
    i INT;
    v_sexo CHAR(1);
BEGIN
    SELECT id INTO v_registrado FROM usuario_referencia WHERE id_externo = 'archivo-01' LIMIT 1;
    IF v_registrado IS NULL THEN
        SELECT id INTO v_registrado FROM usuario_referencia ORDER BY id LIMIT 1;
    END IF;

    -- Asegura cupos de HOY para todas las programaciones activas (capacidad de sobra).
    INSERT INTO cupo_diario (fecha, capacidad_maxima, cupos_ocupados, subespecialidad_horario_id)
    SELECT CURRENT_DATE, sh.capacidad_maxima, 0, sh.id
    FROM subespecialidad_horario sh
    WHERE sh.activo
    ON CONFLICT (subespecialidad_horario_id, fecha) DO NOTHING;

    SELECT array_agg(id ORDER BY id) INTO v_cupos FROM cupo_diario WHERE fecha = CURRENT_DATE;
    SELECT array_agg(id ORDER BY id) INTO v_ubicaciones FROM ubicacion_archivo;

    FOR i IN 1..35 LOOP
        -- 15 pasivos (prefijo 00..10) y 20 activos (prefijo 11..30)
        IF i <= 15 THEN
            v_prefix := (i - 1) % 11;              -- 0..10
        ELSE
            v_prefix := 11 + (i - 16);             -- 11..30
        END IF;
        v_numero := to_char(v_prefix, 'FM00') || lpad((1000 + i)::text, 4, '0');

        v_sexo := CASE WHEN i % 2 = 0 THEN 'F' ELSE 'M' END;

        v_paciente := NULL;
        INSERT INTO paciente (dpi, nombres, apellidos, fecha_nacimiento, sexo, telefono, direccion, numero_expediente)
        VALUES (
            '2845' || lpad((12345678 + i * 211)::text, 9, '0'),
            v_nombres[((i - 1) % array_length(v_nombres, 1)) + 1],
            v_apellidos[((i + 4) % array_length(v_apellidos, 1)) + 1],
            DATE '1965-01-01' + (i * 137),
            v_sexo,
            '5' || lpad((1000000 + i * 137)::text, 7, '0'),
            v_municipios[((i - 1) % array_length(v_municipios, 1)) + 1],
            v_numero
        )
        ON CONFLICT DO NOTHING
        RETURNING id INTO v_paciente;

        IF v_paciente IS NULL THEN
            CONTINUE;
        END IF;

        INSERT INTO expediente (paciente_id, numero_expediente, ubicacion_base_id)
        VALUES (v_paciente, v_numero, v_ubicaciones[((i - 1) % array_length(v_ubicaciones, 1)) + 1])
        ON CONFLICT DO NOTHING;

        v_cupo := v_cupos[((i - 1) % array_length(v_cupos, 1)) + 1];
        INSERT INTO cita (hora_estimada, estado, registrado_por, paciente_id, cupo_diario_id)
        VALUES (('08:00'::time + ((i % 20) * interval '20 minutes')), 'confirmada', v_registrado, v_paciente, v_cupo);

        UPDATE cupo_diario SET cupos_ocupados = cupos_ocupados + 1 WHERE id = v_cupo;
    END LOOP;
END $$;
