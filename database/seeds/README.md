# Datos Iniciales y Seeds de Prueba - HRO

Este directorio contiene los scripts SQL para sembrado de datos en PostgreSQL para el Hospital Regional de Occidente.

Para la documentación detallada sobre estructura, esquemas y relaciones, consultar la [Guía Técnica de Base de Datos](../../docs/DOCUMENTACION_BASE_DE_DATOS.md).

## Scripts Disponibles

1. **`01_pacientes_seeds.sql`**: Catálogo inicial de 10 pacientes de prueba con DPIs y expedientes clínicos.
2. **`02_catalogos_seeds.sql`**: Catálogos base institucionales del HRO (modelo V4):
   - Especialidades médicas (Medicina Interna, Pediatría, Ginecología, Cirugía, Traumatología, Cardiología).
   - Subespecialidades.
   - **Espacios físicos** (salas 101–402) con número, nivel y capacidad de camillas (ya no ligados a una subespecialidad).
   - Médicos especialistas y su **programación por subespecialidad** (`medico_subespecialidad`): día, horario y capacidad. Ej.: Pediatría Especializada solo lunes y jueves.
   - **Permisos por subespecialidad** (`permiso_subespecialidad`).
   - Días feriados oficiales de Guatemala en `dia_no_laborable`.
3. **`03_datos_prueba_50_pacientes_citas_turnos.sql`**:
   - Más de 100 pacientes registrados con nombres de la región suroccidente de Guatemala.
   - Cupos diarios y **asignación diaria** (`asignacion_diaria_espacio`) para fechas de prueba.
   - Citas médicas en los 6 estados del ciclo de vida (`pendiente`, `confirmada`, `atendida`, `cancelada`, `reprogramada`, `no_asistio`).
   - Turnos en sala de espera (`atendido`, `en_espera`, `llamado`, `no_responde`) asociados a la asignación diaria.
   - Registros de auditoría en `cita_estado_historial`.

> **Modelo V4:** la subespecialidad que atiende en cada sala cambia a diario y la decide el jefe de enfermería (`asignacion_diaria_espacio`). Por eso los seeds crean las asignaciones por fecha antes de generar citas y turnos.

