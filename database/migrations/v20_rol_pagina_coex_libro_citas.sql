-- =====================================================================
-- Migración v20: páginas nuevas (Mesa COEX y Libro de Citas) por rol
-- Hospital Regional de Occidente (HRO)
-- =====================================================================

DELETE FROM rol_pagina WHERE rol = 'personal_citas' AND pagina = 'enfermeria';

INSERT INTO rol_pagina (rol, pagina) VALUES
    ('enfermeria',     'coex'),
    ('administrador',  'coex'),
    ('personal_citas', 'libro_citas'),
    ('archivo',        'libro_citas'),
    ('administrador',  'libro_citas')
ON CONFLICT (rol, pagina) DO NOTHING;
