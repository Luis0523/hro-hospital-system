# Datos Iniciales y Seeds de Prueba - HRO

Este directorio contiene los scripts SQL para sembrado de datos en PostgreSQL para el Hospital Regional de Occidente.

Para la documentación detallada sobre estructura, esquemas y relaciones, consultar la [Guía Técnica de Base de Datos](../../docs/DOCUMENTACION_BASE_DE_DATOS.md).

## Scripts Disponibles

1. **`01_pacientes_seeds.sql`**: Catálogo inicial de 10 pacientes de prueba con DPIs y expedientes clínicos.
2. **`02_catalogos_seeds.sql`**: Catálogos base institucionales del HRO:
   - Especialidades médicas (Medicina Interna, Pediatría, Ginecología, Cirugía, Traumatología, Cardiología).
   - Subespecialidades y consultorios (Clínicas 101, 102, 201, 202, 301, 401, 402).
   - Médicos especialistas con número de colegiado y horarios asignados en `medico_clinica`.
   - Días feriados oficiales de Guatemala en `dia_no_laborable`.
3. **`03_datos_prueba_50_pacientes_citas_turnos.sql`**:
   - Más de 100 pacientes registrados con nombres de la región suroccidente de Guatemala.
   - 57 citas médicas en los 6 estados del ciclo de vida (`pendiente`, `confirmada`, `atendida`, `cancelada`, `reprogramada`, `no_asistio`).
   - 25 turnos en sala de espera (`atendido`, `en_espera`, `llamado`, `no_responde`).
   - 113 registros de auditoría en `cita_estado_historial`.
