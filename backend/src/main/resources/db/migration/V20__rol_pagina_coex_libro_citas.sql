-- =====================================================================
-- Migración V20: páginas nuevas (Mesa COEX y Libro de Citas) por rol
-- Hospital Regional de Occidente (HRO)
--
-- Registra en el catálogo configurable las áreas nuevas y asigna roles:
--   coex        -> enfermeria, administrador
--   libro_citas -> personal_citas, archivo, administrador
-- El digitador (personal_citas) pasa a aterrizar en Libro de Citas.
-- =====================================================================

-- El rol de digitación ya no usa la estación de enfermería.
DELETE FROM rol_pagina WHERE rol = 'personal_citas' AND pagina = 'enfermeria';

INSERT INTO rol_pagina (rol, pagina) VALUES
    ('enfermeria',     'coex'),
    ('administrador',  'coex'),
    ('personal_citas', 'libro_citas'),
    ('archivo',        'libro_citas'),
    ('administrador',  'libro_citas')
ON CONFLICT (rol, pagina) DO NOTHING;
