-- =====================================================================
-- Migración V8: Índices de consulta para auditoría
-- Hospital Regional de Occidente (HRO)
--
-- El panel administrativo consulta la bitácora con filtros combinados por
-- tabla, usuario, acción y rango de fechas, ordenando por fecha descendente.
-- Se agregan índices para esos accesos (los GIN sobre JSONB ya existen en V3).
-- =====================================================================

CREATE INDEX IF NOT EXISTS idx_auditoria_fecha
    ON auditoria_general (fecha DESC);

CREATE INDEX IF NOT EXISTS idx_auditoria_usuario
    ON auditoria_general (usuario_referencia_id);

CREATE INDEX IF NOT EXISTS idx_auditoria_accion
    ON auditoria_general (accion);
