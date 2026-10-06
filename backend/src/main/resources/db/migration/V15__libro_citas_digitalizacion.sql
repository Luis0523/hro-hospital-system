-- =====================================================================
-- Migración V15: libro de citas (digitalización) — Fase 1
-- Hospital Regional de Occidente (HRO)
--
-- Registro diario del libro físico de citas:
--   libro_citas_dia          -> una fila por fecha con los contadores del cuaderno
--                               (Egresos hospitalarios, Sobres de emergencia,
--                                Sobres sellados, T.I.A.)
--   libro_citas_especialidad -> desglose de expedientes por subespecialidad ese día
--
-- El número de expedientes por especialidad proviene, por ahora, del ingreso manual
-- del personal. En una fase posterior se precargará desde la API de Registro Médico.
-- =====================================================================

CREATE TABLE libro_citas_dia (
    id                       BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    fecha                    DATE         NOT NULL UNIQUE,
    egresos_hospitalarios    INT          NOT NULL DEFAULT 0 CHECK (egresos_hospitalarios >= 0),
    sobres_emergencia        INT          NOT NULL DEFAULT 0 CHECK (sobres_emergencia >= 0),
    sobres_sellados          INT          NOT NULL DEFAULT 0 CHECK (sobres_sellados >= 0),
    tia                      INT          NOT NULL DEFAULT 0 CHECK (tia >= 0),
    observaciones            TEXT,
    creado_por_id            BIGINT       NOT NULL REFERENCES usuario_referencia(id) ON DELETE RESTRICT,
    actualizado_por_id       BIGINT       REFERENCES usuario_referencia(id) ON DELETE SET NULL,
    creado_en                TIMESTAMPTZ  NOT NULL DEFAULT now(),
    actualizado_en           TIMESTAMPTZ  NOT NULL DEFAULT now()
);

COMMENT ON TABLE libro_citas_dia IS
    'Registro diario del libro físico de citas: contadores del cuaderno por fecha.';

CREATE TABLE libro_citas_especialidad (
    id                     BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    libro_dia_id           BIGINT NOT NULL REFERENCES libro_citas_dia(id) ON DELETE CASCADE,
    subespecialidad_id     BIGINT NOT NULL REFERENCES subespecialidad(id) ON DELETE RESTRICT,
    cantidad_expedientes   INT    NOT NULL DEFAULT 0 CHECK (cantidad_expedientes >= 0),
    UNIQUE (libro_dia_id, subespecialidad_id)
);

COMMENT ON TABLE libro_citas_especialidad IS
    'Desglose, por subespecialidad, del número de expedientes registrados en el libro para un día.';

CREATE INDEX idx_libro_citas_especialidad_libro ON libro_citas_especialidad(libro_dia_id);
