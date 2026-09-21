# Migraciones de Base de Datos (Flyway) - HRO

Este directorio contiene los scripts de migración de base de datos para PostgreSQL administrados mediante Flyway.

Para la documentación detallada sobre arquitectura, índices, triggers y funciones almacenadas, consultar la [Guía Técnica de Base de Datos](../../docs/DOCUMENTACION_BASE_DE_DATOS.md).

## Versiones Disponibles

| Archivo | Versión | Descripción |
| :--- | :---: | :--- |
| `v1_esquemainicial.sql` | V1 | Esquema inicial completo: tablas maestras, pacientes, médicos, clínicas, cupos, citas, turnos, laboratorio y auditoría. |
| `v2_corregir_funciones_cupos.sql` | V2 | Corrección de retorno en `fn_incrementar_cupo` y creación de función de decremento `fn_decrementar_cupo`. |
| `v3_optimizaciones_indices_triggers.sql` | V3 | Índices de alto rendimiento (parciales, compuestos, GIN), trigger de integridad clínica para estados terminales de citas y función atómica de cierre diario `fn_cierre_diario_inasistencias`. |
| `v4_espacios_fisicos_y_asignacion_diaria.sql` | V4 | Separa el espacio físico de la subespecialidad e introduce la asignación diaria (`asignacion_diaria_espacio`, `cierre_asignacion_diaria`, `plano_hospital`). |
| `v5_claves_primarias_uuid.sql` | V5 | Cambia las claves primarias de las tablas principales a UUID (paciente, medico, cupo_diario, etc.) con backfill sin pérdida de datos. |
| `v6_seguimiento_expedientes_fisicos.sql` | V6 | Seguimiento del ciclo de vida físico del expediente: `ubicacion_archivo`, `expediente`, `expediente_ciclo` y `expediente_movimiento`. |

> Los scripts en `backend/src/main/resources/db/migration/` son la fuente que ejecuta Flyway; este directorio mantiene una copia de respaldo con el mismo contenido.
