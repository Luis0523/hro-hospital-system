-- =====================================================================
-- Migración V18: libro de citas por expediente individual
-- Hospital Regional de Occidente (HRO)
--
-- El libro de citas se digitaliza capturando cada cita por su número de
-- expediente (se resuelve el paciente). Cada fila = una cita a atender.
-- =====================================================================

CREATE TABLE libro_citas_expediente (
    id                 BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    numero_expediente  VARCHAR(30)  NOT NULL,
    paciente_id        UUID         NOT NULL REFERENCES paciente(id) ON DELETE RESTRICT,
    fecha              DATE         NOT NULL,
    subespecialidad_id BIGINT       NOT NULL REFERENCES subespecialidad(id) ON DELETE RESTRICT,
    creado_por_id      BIGINT       NOT NULL REFERENCES usuario_referencia(id) ON DELETE RESTRICT,
    creado_en          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_libro_citas_expediente UNIQUE (fecha, subespecialidad_id, numero_expediente)
);

COMMENT ON TABLE libro_citas_expediente IS
    'Citas digitalizadas del libro físico: una fila por expediente/fecha/subespecialidad.';

CREATE INDEX idx_libro_citas_expediente_fecha ON libro_citas_expediente(fecha);
