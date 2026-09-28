-- =====================================================================
-- Migración V11: Contador de turno global por día
-- Hospital Regional de Occidente (HRO)
--
-- El número de turno pasa a ser un contador **global de la fecha** (no por sala).
-- Ej.: #001 -> Clínica 1 (Pediatría), #002 -> Clínica 3 (Ginecología).
-- Se conserva contador_turno_diario por asignación para el tablero (último llamado).
-- =====================================================================

CREATE TABLE contador_turno_fecha (
    fecha           DATE PRIMARY KEY,
    turno_actual    INT NOT NULL DEFAULT 0,
    turno_siguiente INT NOT NULL DEFAULT 1
);

COMMENT ON TABLE contador_turno_fecha IS
    'Correlativo global de turnos por día (todos los pacientes, sin importar subespecialidad/sala).';

CREATE OR REPLACE FUNCTION fn_siguiente_turno_fecha(p_fecha DATE)
RETURNS INT AS $$
DECLARE
    v_turno INT;
BEGIN
    INSERT INTO contador_turno_fecha (fecha, turno_actual, turno_siguiente)
    VALUES (p_fecha, 0, 1)
    ON CONFLICT (fecha) DO NOTHING;

    UPDATE contador_turno_fecha
       SET turno_siguiente = turno_siguiente + 1
     WHERE fecha = p_fecha
    RETURNING turno_siguiente - 1 INTO v_turno;

    RETURN v_turno;
END;
$$ LANGUAGE plpgsql;
