-- =====================================================================
-- Migración V17: páginas por rol (configurable)
-- Hospital Regional de Occidente (HRO)
--
-- Los roles se administran en Keycloak; aquí se configura, por rol, a qué
-- páginas/áreas del SIGHO puede acceder. Permite agregar roles nuevos sin
-- tocar código.
-- =====================================================================

CREATE TABLE rol_pagina (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    rol             VARCHAR(40)  NOT NULL,
    pagina          VARCHAR(40)  NOT NULL,
    activo          BOOLEAN      NOT NULL DEFAULT TRUE,
    creado_en       TIMESTAMPTZ  NOT NULL DEFAULT now(),
    actualizado_en  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_rol_pagina UNIQUE (rol, pagina)
);

COMMENT ON TABLE rol_pagina IS
    'Páginas/áreas del SIGHO permitidas por rol (configurable desde el panel de administración).';

CREATE INDEX idx_rol_pagina_rol ON rol_pagina(rol);

-- Valores por defecto (equivalen al mapeo que antes estaba en código).
INSERT INTO rol_pagina (rol, pagina) VALUES
    ('archivo',         'archivo'),
    ('enfermeria',      'enfermeria'),
    ('medico',          'enfermeria'),
    ('personal_citas',  'enfermeria'),
    ('jefe_enfermeria', 'jefe_enfermeria'),
    ('administrador',   'archivo'),
    ('administrador',   'enfermeria'),
    ('administrador',   'administracion'),
    ('administrador',   'jefe_enfermeria')
ON CONFLICT (rol, pagina) DO NOTHING;
