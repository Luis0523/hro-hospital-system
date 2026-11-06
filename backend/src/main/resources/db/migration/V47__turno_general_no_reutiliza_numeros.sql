-- =====================================================================
-- V47: El número general y el correlativo nunca se reutilizan
--
-- El contador es la fuente de verdad, pero si por cualquier motivo quedara
-- por debajo de los números ya emitidos (restauración, ajuste manual, etc.),
-- se toma como piso el máximo ya registrado. Así el siguiente número siempre
-- es mayor y no choca con turnos activos ni dados de baja.
-- =====================================================================
CREATE OR REPLACE FUNCTION fn_asignar_correlativos_turno(
    p_estacion_id BIGINT,
    p_especialidad_id BIGINT,
    p_fecha DATE
)
RETURNS TABLE(numero_general INTEGER, correlativo_especialidad INTEGER)
LANGUAGE plpgsql
AS $$
DECLARE
    v_general     INTEGER;
    v_correlativo INTEGER;
    v_max         INTEGER;
BEGIN
    INSERT INTO contador_turno_estacion (estacion_id, fecha, ultimo_numero)
    VALUES (p_estacion_id, p_fecha, 0)
    ON CONFLICT (estacion_id, fecha) DO NOTHING;

    SELECT c.ultimo_numero
      INTO v_general
      FROM contador_turno_estacion c
     WHERE c.estacion_id = p_estacion_id
       AND c.fecha = p_fecha
     FOR UPDATE;

    -- Piso: el máximo número general ya emitido para la estación y fecha,
    -- incluyendo turnos dados de baja (activo = false).
    SELECT GREATEST(v_general, COALESCE(MAX(t.numero_general), 0))
      INTO v_general
      FROM turno_estacion t
     WHERE t.fecha = p_fecha
       AND t.estacion_id = p_estacion_id;

    INSERT INTO contador_correlativo_especialidad (especialidad_id, fecha, ultimo_correlativo)
    VALUES (p_especialidad_id, p_fecha, 0)
    ON CONFLICT (especialidad_id, fecha) DO NOTHING;

    SELECT c.ultimo_correlativo
      INTO v_correlativo
      FROM contador_correlativo_especialidad c
     WHERE c.especialidad_id = p_especialidad_id
       AND c.fecha = p_fecha
     FOR UPDATE;

    -- Piso: el máximo correlativo ya emitido para la especialidad y fecha.
    SELECT GREATEST(v_correlativo, COALESCE(MAX(t.correlativo_especialidad), 0))
      INTO v_correlativo
      FROM turno_estacion t
     WHERE t.fecha = p_fecha
       AND t.especialidad_id = p_especialidad_id;

    SELECT e.correlativo_max
      INTO v_max
      FROM especialidad e
     WHERE e.id = p_especialidad_id;

    IF v_max IS NOT NULL AND v_correlativo + 1 > v_max THEN
        RETURN QUERY SELECT NULL::INTEGER, NULL::INTEGER;
        RETURN;
    END IF;

    v_general := v_general + 1;
    v_correlativo := v_correlativo + 1;

    UPDATE contador_turno_estacion
       SET ultimo_numero = v_general
     WHERE estacion_id = p_estacion_id
       AND fecha = p_fecha;

    UPDATE contador_correlativo_especialidad
       SET ultimo_correlativo = v_correlativo
     WHERE especialidad_id = p_especialidad_id
       AND fecha = p_fecha;

    RETURN QUERY SELECT v_general, v_correlativo;
END;
$$;

COMMENT ON FUNCTION fn_asignar_correlativos_turno(BIGINT, BIGINT, DATE) IS
    'Asigna de forma atómica el número general de la estación y el correlativo de la especialidad, sin reutilizar números dados de baja. Devuelve NULL si se agotó el tope.';
