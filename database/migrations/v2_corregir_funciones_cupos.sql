-- =====================================================================
-- Corrección y adición de funciones atómicas para control de cupos
-- =====================================================================

-- 1. Corregir fn_incrementar_cupo (v_filas INT para recibir ROW_COUNT)
CREATE OR REPLACE FUNCTION fn_incrementar_cupo(p_cupo_diario_id BIGINT)
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

-- 2. Función atómica para decrementar cupos al cancelar o reprogramar citas
CREATE OR REPLACE FUNCTION fn_decrementar_cupo(p_cupo_diario_id BIGINT)
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
