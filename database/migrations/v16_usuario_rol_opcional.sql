-- =====================================================================
-- Migración v16: rol de usuario opcional
-- Hospital Regional de Occidente (HRO)
--
-- Los roles se administran en Keycloak y viajan en el token (realm_access.roles).
-- El sistema autoriza a partir del token, no de la base. Por lo que la columna
-- rol_principal deja de ser obligatoria y queda solo como legado (nullable).
-- =====================================================================

ALTER TABLE usuario_referencia ALTER COLUMN rol_principal DROP NOT NULL;

COMMENT ON COLUMN usuario_referencia.rol_principal IS
    'Rol de acceso (legado, nullable). Los roles se administran en Keycloak y se resuelven desde el token; esta columna no se usa funcionalmente.';
