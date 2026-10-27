-- =====================================================================
-- Migración V40: rol y página del Jefe de Archivo
-- Hospital Regional de Occidente (HRO)
--
-- El dashboard administrativo de Archivo deja de depender del panel de
-- administración y pasa a su propia área/página con rol dedicado.
-- =====================================================================

ALTER TABLE usuario_referencia
    DROP CONSTRAINT IF EXISTS usuario_referencia_rol_principal_check;

ALTER TABLE usuario_referencia
    ADD CONSTRAINT usuario_referencia_rol_principal_check
        CHECK (rol_principal IN (
            'personal_citas', 'enfermeria', 'medico', 'administrador',
            'archivo', 'jefe_enfermeria', 'jefe_archivo'
        ));

INSERT INTO rol_pagina (rol, pagina) VALUES
    ('jefe_archivo', 'jefe_archivo')
ON CONFLICT (rol, pagina) DO NOTHING;
