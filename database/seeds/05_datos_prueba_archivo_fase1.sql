-- =====================================================================
-- Seed: datos de prueba para la Fase 1 de Archivo
-- Hospital Regional de Occidente (HRO)
--
-- Crea: ubicaciones de archivo, pacientes con expediente real (6 dígitos),
-- su expediente físico, cupos del día y citas de HOY para poder recorrer
-- todo el flujo (jornada -> check-in -> localizar -> despachar ->
-- entregar -> retornar -> archivar).
--
-- Idempotente en su mayor parte (usa ON CONFLICT). Pensado para pruebas.
-- =====================================================================

-- 1) Ubicaciones de archivo (Archivo/Estante/Caja -> pasillo/estante/balda)
INSERT INTO ubicacion_archivo (pasillo, estante, balda, descripcion) VALUES
    ('A', '1', '1', 'Archivo Activo A-1-1'),
    ('A', '1', '2', 'Archivo Activo A-1-2'),
    ('A', '2', '1', 'Archivo Activo A-2-1'),
    ('A', '2', '2', 'Archivo Activo A-2-2'),
    ('B', '1', '1', 'Archivo Activo B-1-1'),
    ('B', '1', '2', 'Archivo Activo B-1-2'),
    ('B', '2', '1', 'Archivo Activo B-2-1'),
    ('B', '2', '2', 'Archivo Activo B-2-2')
ON CONFLICT (pasillo, estante, balda) DO NOTHING;

DO $$
DECLARE
    v_registrado   BIGINT;
    v_cupos        UUID[];
    v_ubicaciones  BIGINT[];
    v_paciente     UUID;
    v_cupo         UUID;
    v_idx_cupo     INT;
    v_idx_ubic     INT;
    v_datos        TEXT[][] := ARRAY[
        ['ANA LUCIA',     'PEREZ GOMEZ',       '2845123450101', '837873', 'F', 'Quetzaltenango, Zona 3, 12 Av 4-56',        '55441122', '1988-04-12'],
        ['CARLOS EDUARDO','RAMIREZ LOPEZ',     '3012456780102', '837874', 'M', 'Quetzaltenango, Zona 1, 5 Calle 8-10',       '55662233', '1975-09-30'],
        ['MARIA JOSE',    'HERNANDEZ CAJAS',   '3123567890103', '837875', 'F', 'Olintepeque, Cantón San Antonio',            '55773344', '1992-01-22'],
        ['JUAN PABLO',    'GARCIA MORALES',    '3234678900104', '837876', 'M', 'Quetzaltenango, Zona 5, Colonia Los Ángeles','55884455', '1983-06-05'],
        ['SOFIA ISABEL',  'MARTINEZ RUIZ',     '3345789010105', '837877', 'F', 'Salcajá, Calle Real 3-45',                   '55995566', '1997-11-18'],
        ['PEDRO ANTONIO', 'CHAVEZ XILOJ',      '3456890120106', '837878', 'M', 'Cantel, Cantón Pasac 2',                     '55116677', '1970-02-28'],
        ['LUCIA FERNANDA','AGUILAR MENDEZ',    '3567901230107', '837879', 'F', 'Quetzaltenango, Zona 6, 14 Av 2-11',         '55227788', '1990-07-09'],
        ['DIEGO ARMANDO', 'CASTILLO SANCHEZ',  '3678012340108', '837880', 'M', 'La Esperanza, Colonia El Tesoro',            '55338899', '1985-12-14']
    ];
    i INT;
BEGIN
    -- Usuario que "registra" las citas (rol archivo).
    SELECT id INTO v_registrado FROM usuario_referencia WHERE id_externo = 'archivo-01' LIMIT 1;
    IF v_registrado IS NULL THEN
        SELECT id INTO v_registrado FROM usuario_referencia ORDER BY id LIMIT 1;
    END IF;

    -- Cupos de HOY: una programación por subespecialidad (los cupos se crean por fecha).
    INSERT INTO cupo_diario (fecha, capacidad_maxima, cupos_ocupados, subespecialidad_horario_id)
    SELECT CURRENT_DATE, sh.capacidad_maxima, 0, sh.id
    FROM subespecialidad_horario sh
    WHERE sh.id IN (
        SELECT DISTINCT ON (subespecialidad_id) id
        FROM subespecialidad_horario
        WHERE activo
        ORDER BY subespecialidad_id, dia_semana
    )
    ON CONFLICT (subespecialidad_horario_id, fecha) DO NOTHING;

    SELECT array_agg(id ORDER BY id) INTO v_cupos FROM cupo_diario WHERE fecha = CURRENT_DATE;
    SELECT array_agg(id ORDER BY id) INTO v_ubicaciones FROM ubicacion_archivo;

    IF v_cupos IS NULL OR array_length(v_cupos, 1) = 0 THEN
        RAISE EXCEPTION 'No hay cupos para hoy; revise la programación (subespecialidad_horario).';
    END IF;

    FOR i IN 1..array_length(v_datos, 1) LOOP
        v_paciente := NULL;
        INSERT INTO paciente (dpi, nombres, apellidos, fecha_nacimiento, sexo, telefono, direccion, numero_expediente)
        VALUES (v_datos[i][3], v_datos[i][1], v_datos[i][2], v_datos[i][8]::date,
                v_datos[i][5], v_datos[i][7], v_datos[i][6], v_datos[i][4])
        ON CONFLICT (numero_expediente) DO NOTHING
        RETURNING id INTO v_paciente;

        IF v_paciente IS NULL THEN
            -- El paciente ya existía; se continúa con el siguiente.
            CONTINUE;
        END IF;

        v_idx_ubic := ((i - 1) % array_length(v_ubicaciones, 1)) + 1;
        INSERT INTO expediente (paciente_id, numero_expediente, ubicacion_base_id)
        VALUES (v_paciente, v_datos[i][4], v_ubicaciones[v_idx_ubic])
        ON CONFLICT DO NOTHING;

        v_idx_cupo := ((i - 1) % array_length(v_cupos, 1)) + 1;
        v_cupo := v_cupos[v_idx_cupo];
        INSERT INTO cita (hora_estimada, estado, registrado_por, paciente_id, cupo_diario_id)
        VALUES (('08:00'::time + ((i - 1) * interval '30 minutes')), 'confirmada', v_registrado, v_paciente, v_cupo);

        UPDATE cupo_diario SET cupos_ocupados = cupos_ocupados + 1 WHERE id = v_cupo;
    END LOOP;
END $$;
