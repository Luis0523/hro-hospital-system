-- =====================================================================
-- Migración V41: el administrador también accede al área Jefe de Archivo
-- =====================================================================

INSERT INTO rol_pagina (rol, pagina) VALUES
    ('administrador', 'jefe_archivo')
ON CONFLICT (rol, pagina) DO NOTHING;
