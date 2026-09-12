# Historial de Fases y Avances de Desarrollo
## Sistema de Gestión Hospitalaria - Hospital Regional de Occidente (HRO)

**Versión:** 1.0.0-SNAPSHOT  
**Fecha de corte:** 11 de Septiembre de 2026  
**Rama principal de desarrollo:** `backend-fundacion`  
**Stack tecnológico principal:** Java 21, Spring Boot 3.3.3, PostgreSQL 16, Redis 7, Flyway, Docker, OpenAPI / Swagger.

---

## Índice General
1. [Visión General del Proyecto](#1-visión-general-del-proyecto)
2. [Fase 1: Infraestructura Base y Arquitectura Núcleo](#2-fase-1-infraestructura-base-y-arquitectura-núcleo)
3. [Fase 2: Gestión de Pacientes y Expedientes](#3-fase-2-gestión-de-pacientes-y-expedientes)
4. [Fase 3: Catálogos Médicos y Calendario Institucional](#4-fase-3-catálogos-médicos-y-calendario-institucional)
5. [Fase 4: Control Atómico y Concurrente de Cupos Diarios (SCRUM-78)](#5-fase-4-control-atómico-y-concurrente-de-cupos-diarios-scrum-78)
6. [Fase 5: Ciclo de Vida de Citas, Turnos y Reglas de Inasistencia](#6-fase-5-ciclo-de-vida-de-citas-turnos-y-reglas-de-inasistencia)
7. [Métricas de Calidad y Suite de Pruebas](#7-métricas-de-calidad-y-suite-de-pruebas)

---

## 1. Visión General del Proyecto

El Sistema de Gestión Hospitalaria del Hospital Regional de Occidente (HRO) tiene como objetivo modernizar y digitalizar el agendamiento de citas, la asignación de consultorios y médicos, el control de capacidad diaria y la gestión en tiempo real de filas y turnos en salas de espera de Consulta Externa.

### Principios Rectores de Arquitectura:
- **Cero Sobreventa (*Zero Overbooking*):** Ningún médico puede tener más citas que su capacidad real asignada, garantizado a nivel atómico por el motor de base de datos.
- **Desacoplamiento Clínico:** El sistema no almacena el expediente clínico completo (gestionado por el sistema hospitalario preexistente), sino únicamente datos demográficos y un puntero de referencia (`numero_expediente`).
- **Trazabilidad Inmutable:** Cada cambio de estado operativo (agendamiento, confirmación, reprogramación, llamado, inasistencia) deja un rastro inmutable en bitácoras de auditoría.
- **Parametrización Dinámica (v1):** Ningún valor numérico de reglas de negocio está fijado en duro (*hardcoded*), facilitando la calibración mediante el futuro estudio de inasistencias y tiempos reales.

---

## 2. Fase 1: Infraestructura Base y Arquitectura Núcleo

### 2.1 Contenedores y Base de Datos
- Orquestación mediante `docker-compose.yml` con servicios de PostgreSQL 16 (`hro-postgres`, puerto 5432) y Redis 7 (`hro-redis`, puerto 6379).
- Esquema relacional estructurado en migraciones Flyway (`V1__esquema_inicial.sql`):
  - Tablas de seguridad y usuarios: `usuario_referencia`.
  - Tablas de catálogos: `especialidad`, `subespecialidad`, `clinica`.
  - Tablas médicas y de horarios: `medico`, `medico_clinica`.
  - Tablas de calendario y cupos: `dia_no_laborable`, `cupo_diario`.
  - Tablas de citas y filas: `paciente`, `cita`, `cita_estado_historial`, `contador_turno_diario`, `turno`.
  - Tablas de bitácora general: `auditoria_general`.

### 2.2 Estándar de Comunicación y Manejo Global de Errores
- Encapsulación uniforme de respuestas HTTP mediante la clase genérica `ApiResponse<T>`:
  - `success` (boolean), `message` (String), `data` (T), `timestamp` (LocalDateTime).
- Controlador de excepciones global (`GlobalExceptionHandler`) con mapeo semántico de códigos HTTP:
  - `400 Bad Request`: Validaciones de campos (`MethodArgumentNotValidException`) y reglas de negocio (`BusinessException`).
  - `404 Not Found`: Recursos no encontrados (`ResourceNotFoundException`).
  - `409 Conflict`: Saturación de cupos y condiciones de carrera (`CupoAgotadoException`).
  - `500 Internal Server Error`: Errores no controlados.
- Documentación viva mediante Swagger / OpenAPI 3 en `/api/v1/swagger-ui.html`.

---

## 3. Fase 2: Gestión de Pacientes y Expedientes

### 3.1 Modelo de Datos y Validación
- Entidad `Paciente`:
  - `dpi` (identificador único guatemalteco de 13 dígitos).
  - `nombres` y `apellidos`.
  - `fecha_nacimiento` y `sexo` (`'M'` o `'F'`).
  - `telefono` y `direccion`.
  - `numero_expediente` (referencia externa única hacia el sistema de archivo del hospital).
- DTOs con validación Bean Validation: `CrearPacienteRequestDTO`, `ActualizarPacienteRequestDTO`, `PacienteResponseDTO`.

### 3.2 Capacidades Expuestas
- Registro y actualización de pacientes con validación preventiva de duplicidad de DPI y expediente.
- Búsqueda flexible por DPI exacto, número de expediente o coincidencia parcial de nombres y apellidos.
- Paginación y ordenamiento dinámico con `Pageable`.

---

## 4. Fase 3: Catálogos Médicos y Calendario Institucional

### 4.1 Jerarquía Médica y Asignación de Consultorios
- Estructura jerárquica: `Especialidad` $\rightarrow$ `Subespecialidad` $\rightarrow$ `Clínica`.
- Registro de Médicos con validación de número de colegiado activo.
- **Asignación de Horarios (`medico_clinica`):**
  - Mapeo del día de la semana (1 = Lunes ... 7 = Domingo).
  - Ventana de atención (`hora_inicio` y `hora_fin`).
  - `capacidad_maxima`: Pacientes máximos que puede atender el médico en esa jornada.
  - `duracion_consulta_minutos`: Duración promedio estimada de atención.
  - Borrado lógico (*soft delete*) preservando citas históricas.

### 4.2 Calendario Institucional (`dia_no_laborable`)
- Registro de feriados, asuetos y suspensiones institucionales por año o rango de fechas.
- **Regla HU-15:** El sistema rechaza preventivamente registrar un día no laborable si ya existen citas activas agendadas para esa fecha, obligando a su reprogramación previa.
- Carga de datos base (*seeds* en `02_catalogos_seeds.sql`) con especialidades, clínicas, médicos y feriados nacionales.

---

## 5. Fase 4: Control Atómico y Concurrente de Cupos Diarios (SCRUM-78)

### 5.1 Prevención de Condiciones de Carrera (*Race Conditions*)
- Implementación de la tabla `cupo_diario` con restricción física:
  `CHECK (cupos_ocupados <= capacidad_maxima)`.
- **Migración `V2__corregir_funciones_cupos.sql`:**
  - `fn_incrementar_cupo(p_cupo_diario_id BIGINT)`: Operación indivisible a nivel de motor PostgreSQL:
    ```sql
    UPDATE cupo_diario
       SET cupos_ocupados = cupos_ocupados + 1
     WHERE id = p_cupo_diario_id
       AND cupos_ocupados < capacidad_maxima;
    ```
  - `fn_decrementar_cupo(p_cupo_diario_id BIGINT)`: Operación atómica para liberar cupos ante cancelaciones o reprogramaciones.
  - Inicialización idempotente con `ON CONFLICT (medico_clinica_id, fecha) DO NOTHING` para evitar excepciones de llave duplicada cuando múltiples ventanillas abren la agenda concurrentemente.

### 5.2 Validación de Estrés Concurrente
- Prueba automatizada `CupoDiarioConcurrenciaTest`:
  - 10 hilos simultáneos disparados al mismo milisegundo exacto (`CountDownLatch`) compitiendo por **3 únicos cupos**.
  - **Resultado:** Exactamente 3 reservas aprobadas, 7 solicitudes rechazadas con HTTP 409 Conflict, y el contador físico en base de datos quedó en exactamente 3 (**cero sobreventa**).

---

## 6. Fase 5: Ciclo de Vida de Citas, Turnos y Reglas de Inasistencia

### 6.1 Parametrización Externa v1 (`HroAgendaProperties.java`)
- Centralización de variables numéricas en `application.yml` bajo `hro.agenda`:
  - Duración de consulta por defecto (35 min).
  - Margen base de presentación (15 min).
  - Incremento por incertidumbre acumulada en la fila (5 min por cada bloque de 5 turnos).
  - Margen máximo superior de tolerancia (45 min).
  - Tiempo de gracia tras llamado (180 seg).
  - Reintentos máximos antes de clasificar como `no_responde` (3 intentos).
- TODOs y comentarios técnicos en el código para su reemplazo por el modelo estadístico final.

### 6.2 Cálculo de Hora Estimada y Ventana de Tolerancia
- Cálculo de posición en la fila: `posicion = citasActivas + 1`.
- Invocación a función PostgreSQL `fn_calcular_hora_estimada(hora_inicio, duracion, posicion)`.
- Generación de ventana de presentación en el comprobante del paciente (`horaVentanaInicio` y `horaVentanaFin`).
- Tolerancia total a citas en papel migradas retroactivamente que carezcan de hora estimada inicial.

### 6.3 Máquina de Estados y Trazabilidad Obligatoria
- Estados soportados: `pendiente`, `confirmada`, `atendida`, `cancelada`, `reprogramada`, `no_asistio`.
- Inserción estricta en `cita_estado_historial` en cada transición con usuario, motivo y hora.
- **Reprogramación:** La cita original pasa a `reprogramada` y libera su cupo; se crea una nueva cita hija con `cita_origen_id = citaOriginal.getId()` y su propio cupo reservado.
- **Cancelación:** Libera el cupo atómicamente y exige motivo de auditoría médica.

### 6.4 Check-in de Enfermería y Sistema de Turnos en Sala
- El turno se genera únicamente el día de la cita al registrarse la llegada presencial en enfermería (`POST /turnos/check-in`).
- Asignación atómica de turno correlativo mediante `fn_siguiente_turno(clinica_id, fecha)`.
- Emisión de eventos en tiempo real mediante WebSocket STOMP (`/topic/tablero` y `/topic/clinica/{id}`).

### 6.5 Llamado, No Responde, Reintegración y Cierre de Jornada
- **Llamado:** Pasa a `llamado`, incrementa contador de intentos y actualiza el turno actual visible en el tablero de sala.
- **No Responde:** Si expira el tiempo de gracia o no responde a los llamados, pasa a `no_responde` permitiendo avanzar la fila inmediatamente sin demorar a los demás pacientes.
- **Reintegración el mismo día:** Si el paciente regresa más tarde, el sistema **conserva la misma cita y el mismo turno**, actualizando su estado a `reintegrado` y asignándole una nueva posición al final de la fila actual con `fn_siguiente_turno`.
- **Cierre Diario de Jornada:** Turnos en `no_responde` y citas pendientes sin check-in pasan a `no_asistio`. **No se libera cupo en `cupo_diario`**, ya que el día culminó y el espacio no puede reasignarse.

---

---

## 7. Fase 6: Optimizaciones de Base de Datos, Índices, Triggers y Seeds (~50 Pacientes)

### A. Migración V3 (`V3__optimizaciones_indices_triggers.sql`)
1. **Índices de Alto Rendimiento (postgres-patterns):**
   - **Índice Parcial (`idx_cita_activas_cupo`):** Indexa `cita(cupo_diario_id)` filtrando `WHERE estado NOT IN ('cancelada', 'reprogramada')`. Reduce drásticamente el costo de cálculo de cupos activos por horario.
   - **Índice Compuesto (`idx_paciente_apellidos_nombres`):** Autocompletado y búsqueda de pacientes sin escaneos secuenciales.
   - **Índice Compuesto (`idx_cita_cupo_estado`):** Filtros rápidos por cupo y estado de cita.
   - **Índice Compuesto (`idx_turno_cita_estado` y `idx_turno_estado_hora`):** Agiliza consultas de pantalla de sala y colas por estado.
   - **Índices GIN (`idx_auditoria_valores_nuevos_gin`, `idx_auditoria_valores_anteriores_gin`):** Búsqueda eficiente en campos JSONB de auditoría general.
2. **Regla Clínica de Integridad mediante Trigger PostgreSQL (`trg_prevenir_modificacion_estado_terminal_cita`):**
   - Rechaza a nivel de motor de base de datos (`RAISE EXCEPTION`) cualquier intento de reactivar o mutar citas en estados terminales (`'atendida'`, `'cancelada'`, `'reprogramada'`, `'no_asistio'`).
3. **Función Atómica de Cierre Diario en Base de Datos (`fn_cierre_diario_inasistencias`):**
   - Recibe `(p_fecha, p_clinica_id, p_usuario_id)` y ejecuta en una sola transacción el cierre de jornada: pasa citas pendientes/no atendidas a `no_asistio`, genera auditoría en lote en `cita_estado_historial`, y limpia turnos no respondidos sin liberar cupos.
   - Conectada al backend en `CitaRepository.ejecutarCierreDiarioSp` y `CitaService.ejecutarCierreDiario`.

### B. Seeds de Datos de Prueba Completos (`03_datos_prueba_50_pacientes_citas_turnos.sql`)
- **Población:** 50+ pacientes con nombres guatemaltecos realistas, DPIs de 13 dígitos del suroccidente (Quetzaltenango, Salcajá, Cantel, Olintepeque, Almolonga, San Juan Ostuncalco, Zunil, Coatepeque, etc.) y expedientes clínicos únicos.
- **Distribución de Citas y Turnos:**
  - Citas en todos los 6 estados del ciclo de vida (`pendiente`, `confirmada`, `atendida`, `cancelada`, `reprogramada`, `no_asistio`).
  - Turnos en sala (`en_espera`, `llamado`, `no_responde`, `atendido`).
  - Historial de estados (`cita_estado_historial`) con trazabilidad completa.

---

## 8. Métricas de Calidad y Suite de Pruebas

Toda la lógica de negocio, persistencia, triggers y funciones atómicas están respaldadas por pruebas de integración automatizadas ejecutadas contra PostgreSQL en Docker:

```
[INFO] -------------------------------------------------------
[INFO]  T E S T S
[INFO] -------------------------------------------------------
[INFO] Running com.hro.system.agenda.controller.CupoDiarioConcurrenciaTest (1 test)
[INFO] Running com.hro.system.cita.controller.CitaCicloDeVidaTest (6 tests)
[INFO] Running com.hro.system.turno.controller.TurnoInasistenciaTest (3 tests)
[INFO] Running com.hro.system.clinica.controller.CatalogosYCalendarioTest (7 tests)
[INFO] Running com.hro.system.paciente.controller.PacienteControllerTest (8 tests)
[INFO] Running com.hro.system.HroHospitalSystemApplicationTests (1 test)
[INFO] Tests run: 26, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

| Módulo Evaluado | Pruebas | Resultado | Aspectos Clave Validados |
| :--- | :---: | :---: | :--- |
| Concurrencia de Cupos | 1 | ✅ 100% | 10 hilos simultáneos, cero sobreventa, liberación atómica |
| Ciclo de Vida de Citas | 6 | ✅ 100% | Cierre atómico con SP PostgreSQL, Trigger de estados terminales, ventanas dinámicas, reprogramación genealógica, cancelación, tolerancia a papel |
| Turnos e Inasistencias | 3 | ✅ 100% | Check-in atómico, llamado, no-responde, reintegración al final de la fila, cierre diario sin liberar cupo |
| Catálogos y Calendario | 7 | ✅ 100% | CRUDs jerárquicos, asignación médico-clínica, bloqueo preventivo HU-15 |
| Gestión de Pacientes | 8 | ✅ 100% | Validaciones DPI, expediente único, paginación, filtros |
| Contexto de Aplicación | 1 | ✅ 100% | Inyección de dependencias, Flyway V1/V2/V3 y Beans de configuración |
| **Total General** | **26** | **100% Éxito** | **Cero fallos, cero errores** |
