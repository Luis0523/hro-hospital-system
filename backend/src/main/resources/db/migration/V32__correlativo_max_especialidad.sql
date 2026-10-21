-- =====================================================================
-- V32: Tope de correlativo diario por especialidad
--
-- Medicina Interna (incluidas sus variantes por médico) usa 100.
-- El resto de especialidades usa 18. El valor sigue siendo editable
-- desde el catálogo de especialidades.
-- =====================================================================

ALTER TABLE especialidad
    ALTER COLUMN correlativo_max SET DEFAULT 18;

UPDATE especialidad
   SET correlativo_max = CASE
       WHEN lower(coalesce(nombre, '')) LIKE '%medicina interna%' THEN 100
       ELSE 18
   END
 WHERE correlativo_max IS NULL;

COMMENT ON COLUMN especialidad.correlativo_max IS
    'Tope del correlativo diario de la especialidad en estación de enfermería. Editable desde el catálogo.';
