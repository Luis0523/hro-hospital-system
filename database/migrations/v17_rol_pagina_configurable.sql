-- =====================================================================
-- Migración v17: páginas por rol (configurable)
-- Hospital Regional de Occidente (HRO)
--
-- Los roles se administran en Keycloak; aquí se configura, por rol, a qué
-- páginas/áreas del SIGHO puede acceder.
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

CREATE INDEX idx_rol_pagina_rol ON rol_pagina(rol);

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
