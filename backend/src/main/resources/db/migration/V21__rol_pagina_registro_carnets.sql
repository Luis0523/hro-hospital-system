-- =====================================================================
-- Migración V21: página "Registro de carnets" por rol
-- Hospital Regional de Occidente (HRO)
--
-- Registra en el catálogo configurable el área de registro rápido de carnets
-- (/archivo/registro-carnets) y la asigna al rol de Archivo y al administrador.
-- El nombre de la página coincide con el enum PaginaSistema.REGISTRO_CARNETS.
-- =====================================================================

INSERT INTO rol_pagina (rol, pagina) VALUES
    ('archivo',       'registro_carnets'),
    ('administrador', 'registro_carnets')
ON CONFLICT (rol, pagina) DO NOTHING;
