-- V26: amplía los valores permitidos en auditoria_general.accion.
--
-- El constraint original (V1) sólo permitía 'crear', 'actualizar' y 'eliminar',
-- pero varios servicios publican también acciones de baja/alta lógica
-- ('reactivar', 'desactivar', 'activar'). Al fallar la inserción de la bitácora,
-- la transacción de negocio (REQUIRES_NEW) quedaba marcada rollback-only y la
-- operación devolvía HTTP 500 (p. ej. desactivar una especialidad).
--
-- Se elimina cualquier CHECK existente sobre la columna "accion" (sin depender
-- del nombre autogenerado) y se recrea con el conjunto real de valores.

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
