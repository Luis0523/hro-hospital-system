-- =====================================================================
-- Migración V25: parámetro de Archivo Activo/Pasivo
-- Hospital Regional de Occidente (HRO)
--
-- El archivo se clasifica en ACTIVO (expedientes recientes) y PASIVO
-- (expedientes antiguos) según un número de expediente umbral configurable.
-- Los expedientes con número MAYOR al umbral son ACTIVO; los MENORES o iguales
-- son PASIVO. El umbral lo configura el personal (no se calcula solo).
-- =====================================================================

CREATE TABLE parametro_sistema (
    clave          VARCHAR(60)  PRIMARY KEY,
    valor          VARCHAR(200) NOT NULL,
    actualizado_en TIMESTAMPTZ  NOT NULL DEFAULT now()
);

COMMENT ON TABLE parametro_sistema IS
    'Parámetros configurables del sistema (clave/valor).';

INSERT INTO parametro_sistema (clave, valor)
VALUES ('archivo.umbral_activo', '939819')
ON CONFLICT (clave) DO NOTHING;
