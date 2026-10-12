-- v26: amplía los valores permitidos en auditoria_general.accion.
-- Ver backend/src/main/resources/db/migration/V26__auditoria_accion_valores.sql

DO $$
DECLARE
    c record;
BEGIN
    FOR c IN
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'auditoria_general'::regclass
          AND contype = 'c'
          AND pg_get_constraintdef(oid) ILIKE '%accion%'
    LOOP
        EXECUTE format('ALTER TABLE auditoria_general DROP CONSTRAINT %I', c.conname);
    END LOOP;
END $$;

ALTER TABLE auditoria_general
    ADD CONSTRAINT auditoria_general_accion_check
    CHECK (accion IN ('crear', 'actualizar', 'eliminar', 'reactivar', 'desactivar', 'activar'));
