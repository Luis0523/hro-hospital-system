# NUEVA ACTUALIZACIÓN — Módulo de Turnos de Estación de Enfermería

**Sistema Hospitalario HRO — Hospital Regional de Occidente**
**Fecha:** 20 de octubre de 2026
**Rama:** `main`
**Módulo backend:** `com.hro.system.turnoestacion`
**Migración:** `V31__turno_estacion.sql`
**Base URL:** `/api/v1`
**Estado:** implementado, con suite de pruebas en verde

> Este documento deja evidencia del trabajo realizado y describe el flujo operativo que se espera seguir.
> La especificación funcional original está en `docs/instrucciones/backend-turnos-estacion.md`.
> El contrato técnico se implementa en `backend/src/main/java/com/hro/system/turnoestacion/`.

---

## 1. Resumen de la actualización

Se implementó un módulo independiente para registrar y seguir los turnos de una estación de enfermería, sin modificar el flujo existente de `Turno`, carnet ni Mesa COEX.

La actualización incluye:

1. Registro de turnos con dos numeraciones simultáneas:
   - **Número general diario por estación**, usado para audio y tablero.
   - **Correlativo diario por especialidad**, usado para el libro digital y la identificación del expediente.
2. Flujo completo de estados desde `registrado` hasta `archivado`.
3. Asignación de clínica física mediante QR.
4. Validación del médico por número de colegiado.
5. Vínculo del turno con el expediente y con el ciclo de Archivo.
6. Llamados, re-llamados, inasistencia y atención.
7. Devolución y archivado reflejados en Archivo.
8. Eliminación controlada de turnos erróneos, con manejo de contadores.
9. Pruebas de integración del circuito completo.

El módulo convive temporalmente con el registro anterior. No se eliminaron tablas ni endpoints de carnet/COEX.

---

## 2. Flujo operativo esperado

### 2.1 Recorrido principal

| # | Momento | Rol | Acción | Endpoint | Estado resultante |
|---|---|---|---|---|---|
| 1 | El paciente llega a Enfermería | `enfermeria`, `jefe_enfermeria`, `administrador` | Registra el turno con estación y especialidad. El backend asigna número general y correlativo de especialidad de forma atómica | `POST /turnos-estacion` | `registrado` |
| 2 | Enfermería recibe el expediente físico | `enfermeria`, `jefe_enfermeria`, `administrador` | Confirma la recepción | `POST /turnos-estacion/{id}/recibir` | `recibido` |
| 3 | Se define el consultorio | `enfermeria`, `jefe_enfermeria`, `administrador` | Asigna la clínica física | `POST /turnos-estacion/{id}/asignar-clinica` | `en_clinica` |
| 4 | El médico entra al consultorio | usuario autenticado | El frontend lee el QR de la clínica y resuelve el espacio físico | `GET /espacios-fisicos/numero/{numero}` | — |
| 5 | El médico consulta los turnos de su clínica | usuario autenticado | Lista los turnos del día filtrados por clínica | `GET /turnos-estacion?espacioFisicoId=...` | — |
| 6 | El médico se identifica y pide el expediente | `medico`, `administrador` | Valida colegiado, clínica y número de expediente; crea o reutiliza el ciclo en Archivo | `POST /turnos-estacion/{id}/vincular-expediente` | sigue `en_clinica` |
| 7 | El médico llama al paciente | `medico`, `administrador` | Primer llamado o re-llamado; incrementa el contador de llamados | `POST /turnos-estacion/{id}/llamar` | `llamado` |
| 8 | El paciente pasa o no pasa | `medico`, `administrador` | Marca atención o inasistencia | `POST /turnos-estacion/{id}/atendido` o `POST /turnos-estacion/{id}/no-asistio` | `atendido` o `no_asistio` |
| 9 | El expediente vuelve a Archivo | `enfermeria`, `jefe_enfermeria`, `archivo`, `administrador` | Registra la devolución física | `POST /turnos-estacion/{id}/devolver` | `devuelto` |
| 10 | Archivo recibe el expediente | `archivo`, `administrador` | Confirma el archivado | `POST /turnos-estacion/{id}/archivar` | `archivado` |

### 2.2 Consulta y seguimiento

| Necesidad | Endpoint |
|---|---|
| Listar turnos del día con filtros | `GET /turnos-estacion` |
| Ver detalle y bitácora de un turno | `GET /turnos-estacion/{id}` |
| Ver libro digital agrupado por especialidad | `GET /turnos-estacion/libro` |

### 2.3 Corrección de errores

| Necesidad | Rol | Endpoint |
|---|---|---|
| Eliminar un turno registrado por error | `enfermeria`, `jefe_enfermeria`, `administrador` | `DELETE /turnos-estacion/{id}` |

Solo se puede eliminar un turno en estado `registrado` y sin paciente ni expediente vinculado.

---

## 3. Máquina de estados

Estados posibles:

| Estado | Etiqueta operativa | Responsable |
|---|---|---|
| `registrado` | Registrado | Enfermería |
| `recibido` | Recibido | Enfermería |
| `en_clinica` | En clínica | Enfermería |
| `llamado` | Llamado | Médico |
| `no_asistio` | No asistió | Médico |
| `atendido` | Atendido | Médico |
| `devuelto` | Devuelto | Enfermería / Archivo |
| `archivado` | Archivado | Archivo |

Transiciones permitidas:

```text
registrado  -> recibido
recibido    -> en_clinica
en_clinica  -> llamado | atendido | no_asistio | devuelto
llamado     -> llamado | atendido | no_asistio | devuelto
no_asistio  -> llamado | devuelto
atendido    -> devuelto
devuelto    -> archivado
archivado   -> (sin transiciones)
```

Reglas importantes:

- No existe un `PUT`/`PATCH` genérico para cambiar el estado. Cada transición tiene su endpoint y sus validaciones.
- Un re-llamado se registra como `llamado -> llamado` e incrementa `llamados`.
- `vincular-expediente` no cambia el estado; solo asocia paciente, expediente, médico y ciclo de Archivo.
- `devuelto` representa la devolución física de la clínica a Archivo.
- `archivado` lo confirma el rol Archivo.

---

## 4. Contrato de API del módulo

Base: `/api/v1/turnos-estacion`

### 4.1 Endpoints

| Método | Ruta | Rol autorizado | Descripción |
|---|---|---|---|
| `POST` | `/turnos-estacion` | `enfermeria`, `jefe_enfermeria`, `administrador` | Registra el turno y asigna correlativos |
| `GET` | `/turnos-estacion` | usuario autenticado | Lista con filtros por fecha, estación, especialidad, clínica y estado |
| `GET` | `/turnos-estacion/{id}` | usuario autenticado | Detalle con bitácora de movimientos |
| `GET` | `/turnos-estacion/libro` | usuario autenticado | Libro digital agrupado por especialidad |
| `POST` | `/turnos-estacion/{id}/recibir` | `enfermeria`, `jefe_enfermeria`, `administrador` | `registrado -> recibido` |
| `POST` | `/turnos-estacion/{id}/asignar-clinica` | `enfermeria`, `jefe_enfermeria`, `administrador` | `recibido -> en_clinica` |
| `POST` | `/turnos-estacion/{id}/vincular-expediente` | `medico`, `administrador` | Vincula paciente, expediente, médico y ciclo de Archivo |
| `POST` | `/turnos-estacion/{id}/llamar` | `medico`, `administrador` | Llama o re-llama al paciente |
| `POST` | `/turnos-estacion/{id}/no-asistio` | `medico`, `administrador` | Marca inasistencia |
| `POST` | `/turnos-estacion/{id}/atendido` | `medico`, `administrador` | Marca atención |
| `POST` | `/turnos-estacion/{id}/devolver` | `enfermeria`, `jefe_enfermeria`, `archivo`, `administrador` | Devuelve el expediente a Archivo |
| `POST` | `/turnos-estacion/{id}/archivar` | `archivo`, `administrador` | Confirma el archivado |
| `DELETE` | `/turnos-estacion/{id}` | `enfermeria`, `jefe_enfermeria`, `administrador` | Elimina o desactiva un turno erróneo |

### 4.2 Filtros del listado

`GET /turnos-estacion`

| Parámetro | Tipo | Obligatorio | Nota |
|---|---|---|---|
| `fecha` | `YYYY-MM-DD` | No | Por defecto, hoy en zona `America/Guatemala` |
| `estacionId` | entero | No | Si no se envía, se usa la estación de la sesión (`X-Estacion-Id`) |
| `especialidadId` | entero | No | Filtra por especialidad |
| `espacioFisicoId` | UUID | No | Filtra por clínica |
| `estado` | texto | No | `registrado`, `recibido`, `en_clinica`, `llamado`, `no_asistio`, `atendido`, `devuelto`, `archivado` |

### 4.3 Registro de turno

```http
POST /api/v1/turnos-estacion
X-Usuario-Id: enfermeria-01
X-Usuario-Rol: enfermeria
X-Usuario-Nombre: Enfermería Turno A
X-Estacion-Id: 1
Content-Type: application/json

{
  "estacionId": 1,
  "especialidadId": 10,
  "fecha": "2026-10-20",
  "pacienteId": null,
  "numeroExpediente": null,
  "pacienteNombre": null,
  "citaId": null
}
```

Respuesta relevante:

```json
{
  "success": true,
  "message": "Turno de estación registrado",
  "data": {
    "id": "0f1c2f8e-4d1b-4f2e-9a7c-3a5b6c7d8e9f",
    "fecha": "2026-10-20",
    "estacionId": 1,
    "estacionNombre": "Estación Central",
    "especialidadId": 10,
    "especialidadNombre": "Medicina Interna",
    "abreviatura": "MI",
    "correlativoEspecialidad": 4,
    "codigo": "MI4",
    "numeroGeneral": 7,
    "estado": "registrado",
    "llamados": 0
  }
}
```

Notas:

- `codigo` se forma con la abreviatura y el correlativo, sin guion: `MI4`.
- Si se envía `numeroExpediente` o `pacienteId`, el backend valida que no exista otro turno activo del mismo paciente/expediente en la fecha.
- Si la especialidad alcanzó su `correlativoMax`, responde `409` con código `CORRELATIVO_AGOTADO` y no consume número general.

### 4.4 Asignar clínica

```json
{
  "espacioFisicoId": "8b7a6c5d-4e3f-2a1b-9c8d-7e6f5a4b3c2d"
}
```

El backend valida que el espacio esté activo y asignado a la especialidad del turno en la fecha.

### 4.5 Vincular expediente

```json
{
  "numeroColegiado": "COL-12345",
  "espacioFisicoId": "8b7a6c5d-4e3f-2a1b-9c8d-7e6f5a4b3c2d",
  "numeroExpediente": "EXP-000123",
  "observacion": "Paciente presente en consultorio"
}
```

Validaciones:

- El turno debe estar en `en_clinica` o `llamado`.
- La clínica enviada debe coincidir con la clínica del turno.
- El médico debe existir y estar activo.
- El expediente debe existir.
- El expediente no debe tener otro turno activo en la misma fecha.
- Si el turno ya tenía paciente, debe coincidir con el paciente del expediente.

### 4.6 Acciones del médico

```json
{
  "numeroColegiado": "COL-12345",
  "espacioFisicoId": "8b7a6c5d-4e3f-2a1b-9c8d-7e6f5a4b3c2d",
  "observacion": "opcional"
}
```

Aplica para:

- `POST /turnos-estacion/{id}/llamar`
- `POST /turnos-estacion/{id}/no-asistio`
- `POST /turnos-estacion/{id}/atendido`

### 4.7 Devolución y archivado

Devolución:

```json
{
  "observacion": "Expediente devuelto a Archivo"
}
```

Archivado:

```json
{
  "ubicacionDestinoId": "uuid-opcional",
  "observacion": "Expediente archivado"
}
```

### 4.8 Eliminación

```json
{
  "motivo": "Registro duplicado por error"
}
```

Reglas:

- Solo aplica a turnos en estado `registrado`.
- No aplica a turnos con paciente o expediente.
- Si es el último número general de la estación/fecha:
  - se elimina físicamente;
  - se decrementan ambos contadores;
  - el número puede reutilizarse.
- Si no es el último:
  - se desactiva lógicamente;
  - el número queda reservado;
  - no se reutiliza ni se tocan los contadores.

### 4.9 Libro digital

`GET /api/v1/turnos-estacion/libro?estacionId=1&fecha=2026-10-20`

Devuelve:

- estación y fecha;
- resumen de turnos por estado;
- especialidades de la estación con abreviatura, tope de correlativo, cantidad registrada y turnos del día.

Si no se envía `estacionId`, se usa la estación de la sesión. Si no hay ninguna, responde error de estación requerida.

---

## 5. Cobertura CRUD

| Recurso | Crear | Leer | Actualizar | Borrar |
|---|---|---|---|---|
| **Turno de estación** | `POST /turnos-estacion` | `GET /turnos-estacion`, `GET /{id}`, `GET /libro` | Solo mediante acciones de flujo: recibir, asignar clínica, vincular expediente, llamar, no asistió, atendido, devolver, archivar | `DELETE /{id}` restringido |
| **Bitácora de movimientos** | Generada por cada acción | Incluida en el detalle del turno | No permitido | No permitido (append-only) |

No existe edición libre de un turno. Esto es intencional para que no se puedan saltar las reglas de negocio ni la máquina de estados.

---

## 6. Endpoints de apoyo ya existentes

| Necesidad | Endpoint | Cobertura |
|---|---|---|
| Resolver clínica por QR | `GET /espacios-fisicos/numero/{numero}` | Solo lectura |
| Catálogo de espacios físicos | `GET /espacios-fisicos`, `GET /{id}`, `GET /nivel/{nivel}`, `POST`, `PUT /{id}`, `PATCH /{id}/reactivar`, `DELETE /{id}` | CRUD completo |
| Asignación diaria de clínica a especialidad | `GET /asignaciones-diarias`, `GET /vista`, `POST`, `PUT`, `DELETE /{id}`, `POST /cerrar`, `POST /duplicar` | CRUD y operaciones |
| Buscar médico por colegiado | `GET /medicos/colegiado/{numeroColegiado}` | Solo lectura |
| Catálogo de médicos | `GET /medicos`, `GET /{id}`, `POST`, `PUT /{id}`, `PATCH /{id}/reactivar`, `DELETE /{id}` | CRUD completo |
| Especialidades y tope de correlativo | `GET /especialidades`, `GET /{id}`, `POST`, `PUT /{id}`, `PATCH /{id}/reactivar`, `DELETE /{id}` | CRUD completo |
| Estaciones y especialidades asociadas | `GET /estaciones`, `GET /{id}`, `GET /{id}/especialidades-activas`, `PUT /{id}/especialidades`, `POST`, `PUT /{id}`, `DELETE /{id}` | CRUD y configuración |
| Paciente y expediente para el vínculo | `GET /pacientes/expediente/{numeroExpediente}`, `GET /pacientes/dpi/{dpi}`, `GET /pacientes/buscar`, `GET /expedientes/numero/{numeroExpediente}` | Lectura suficiente |
| Ciclo de Archivo | `GET /expediente-ciclos/{id}`, `GET /expediente-ciclos/expediente/{expedienteId}`, `POST /expedientes/{id}/check-in` | Usado internamente por el puente |

La configuración de `especialidad.correlativoMax` se administra con el CRUD de especialidades. Si es `null`, no hay tope.

---

## 7. Implementación backend

### 7.1 Migración `V31__turno_estacion.sql`

La migración es aditiva y crea:

| Objeto | Propósito |
|---|---|
| `especialidad.correlativo_max` | Tope opcional del correlativo diario por especialidad |
| `contador_turno_estacion` | Último número general por estación y fecha |
| `contador_correlativo_especialidad` | Último correlativo por especialidad y fecha |
| `turno_estacion` | Registro principal del turno |
| `turno_estacion_movimiento` | Bitácora append-only de transiciones |
| `fn_asignar_correlativos_turno(...)` | Asignación atómica de ambos correlativos |

Características clave:

- El número general es diario y por estación.
- El correlativo de especialidad es diario y global por especialidad, por lo que no se repite entre estaciones.
- La función bloquea primero el contador de estación y luego el de especialidad, siempre en el mismo orden, para evitar deadlocks.
- Si el tope de especialidad está agotado, devuelve `NULL` y no incrementa el contador general.
- El índice único de expediente por fecha es parcial (`numero_expediente IS NOT NULL AND activo`), de modo que un turno eliminado lógicamente no bloquee un nuevo registro.

### 7.2 Paquete `com.hro.system.turnoestacion`

```text
entity/
  TurnoEstacion.java
  TurnoEstacionMovimiento.java
  EstadoTurnoEstacion.java
repository/
  TurnoEstacionRepository.java
  TurnoEstacionMovimientoRepository.java
service/
  TurnoEstacionService.java
  EnfermeriaArchivoBridgeService.java
controller/
  TurnoEstacionController.java
dto/
  CrearTurnoEstacionRequestDTO.java
  AsignarClinicaRequestDTO.java
  VincularExpedienteRequestDTO.java
  AccionMedicoRequestDTO.java
  DevolverTurnoRequestDTO.java
  ArchivarTurnoRequestDTO.java
  EliminarTurnoRequestDTO.java
  TurnoEstacionResponseDTO.java
  TurnoEstacionMovimientoResponseDTO.java
  LibroTurnoEstacionResponseDTO.java
```

### 7.3 Integración con Archivo

`EnfermeriaArchivoBridgeService` conecta el turno con el ciclo físico del expediente:

- **Al vincular expediente:**
  - busca un ciclo abierto del expediente;
  - si no existe, lo crea en estado `entregado`;
  - si existe, lo reutiliza;
  - guarda `expedienteCicloId` en el turno;
  - registra el movimiento correspondiente.
- **Al devolver:**
  - si el ciclo está en `entregado`, lo pasa a `en_transito_retorno`;
  - si no, no fuerza la transición y mantiene la historia local.
- **Al archivar:**
  - refleja el archivado en el ciclo de Archivo.

La historia de Enfermería queda en `turno_estacion_movimiento` y la de Archivo en `expediente_movimiento`.

### 7.4 Seguridad y contexto

- La identidad se toma de las cabeceras mock existentes: `X-Usuario-Id`, `X-Usuario-Rol`, `X-Usuario-Nombre`.
- La estación de la sesión viaja en `X-Estacion-Id`.
- Si la cabecera de estación está presente, el backend valida que coincida con la estación del turno o de la petición.
- Los roles se validan con `@PreAuthorize` por endpoint.
- El usuario se aprovisiona de forma JIT en `usuario_referencia`, igual que en el resto del sistema.

---

## 8. Validaciones y errores esperados

### 8.1 Validaciones principales

- Estación existente y activa.
- Especialidad existente, activa y perteneciente a la estación.
- Fecha válida.
- Clínica existente, activa y asignada a la especialidad en la fecha.
- Médico existente y activo.
- Colegiado obligatorio en acciones del médico y en el vínculo de expediente.
- Expediente existente.
- Paciente del turno consistente con el paciente del expediente o de la cita.
- Un expediente no puede tener dos turnos activos en la misma fecha.
- Un paciente no puede tener dos turnos activos en la misma fecha.
- Una cita no puede tener dos turnos activos en la misma fecha.
- Transiciones de estado válidas.
- Turno activo para consultas y acciones.

### 8.2 Códigos de error relevantes

| Código | Situación | HTTP esperado |
|---|---|---|
| `CORRELATIVO_AGOTADO` | Se alcanzó `especialidad.correlativoMax` | `409` |
| `EXPEDIENTE_CON_TURNO` | El expediente ya tiene turno activo ese día | `409` |
| `PACIENTE_CON_TURNO` | El paciente ya tiene turno activo ese día | `409` |
| `CITA_CON_TURNO` | La cita ya tiene turno activo ese día | `409` |
| `PACIENTE_EXPEDIENTE_INCONSISTENTE` | Paciente y expediente no coinciden | `409` |
| `PACIENTE_CITA_INCONSISTENTE` | Paciente y cita no coinciden | `409` |
| `TRANSICION_INVALIDA` | Transición no permitida | `409` |
| `CLINICA_NO_ASIGNADA` | La clínica no está asignada a la especialidad/fecha | `409` |
| `SIN_CLINICA` | El turno aún no tiene clínica | `409` |
| `CLINICA_DISTINTA` | La clínica enviada no es la del turno | `409` |
| `EXPEDIENTE_YA_VINCULADO` | El turno ya tiene otro expediente | `409` |
| `TURNO_NO_ELIMINABLE` | Se intenta eliminar un turno que ya avanzó | `409` |
| `TURNO_CON_PACIENTE` | Se intenta eliminar un turno con paciente/expediente | `409` |
| `ESPECIALIDAD_NO_PERTENECE` | La especialidad no pertenece a la estación | `400` |
| `ESTACION_INCORRECTA` | La estación de la sesión no coincide | `400` |
| `ESTACION_INACTIVA` | La estación está inactiva | `400` |
| `ESPACIO_INACTIVO` | La clínica está fuera de servicio | `400` |
| `MEDICO_INACTIVO` | El médico está inactivo | `400` |
| `COLEGIADO_REQUERIDO` | Falta el número de colegiado | `400` |
| `ESTADO_INVALIDO` | Filtro de estado no reconocido | `400` |
| Recursos no encontrados | Turno, estación, especialidad, médico, paciente, expediente o clínica inexistente | `404` |
| Sin rol autorizado | El usuario no tiene el rol del endpoint | `403` |

---

## 9. Pruebas y evidencia

### 9.1 Suite completa

```text
Tests: 212
Failures: 0
Errors: 0
Skipped: 0
```

### 9.2 Pruebas nuevas del módulo

Clase: `TurnoEstacionCircuitoTest`

| Prueba | Qué valida |
|---|---|
| Circuito completo | Registrar, recibir, asignar clínica, vincular expediente, llamar, atender, devolver y archivar |
| Tope de especialidad | Al agotarse el tope responde `409` y no consume número general |
| Borrado y contadores | El borrado lógico intermedio no reutiliza números; el último se borra físicamente y decrementa contadores |
| Vínculo requiere clínica | No se puede vincular expediente antes de enviar el turno a la clínica |

Comando de ejecución:

```bash
cd backend
./mvnw -q test
```

---

## 10. Pendientes y siguientes pasos

1. Integrar el frontend de Enfermería con estos endpoints.
2. Integrar la vista del médico:
   - lectura del QR de clínica;
   - listado de turnos de la clínica;
   - vínculo de expediente y acciones de llamado/atención.
3. Agregar los endpoints nuevos a la colección Postman.
4. Evaluar si el tablero nuevo requiere eventos en tiempo real. El módulo actualmente es REST y no publica WebSocket propio.
5. Mantener el flujo anterior de carnet/COEX hasta que el nuevo flujo esté validado en operación.
6. Documentar la configuración de `correlativoMax` por especialidad en el manual de administración.

---

## 11. Referencias

- Especificación funcional: `docs/instrucciones/backend-turnos-estacion.md`
- Migración: `backend/src/main/resources/db/migration/V31__turno_estacion.sql`
- Controlador: `backend/src/main/java/com/hro/system/turnoestacion/controller/TurnoEstacionController.java`
- Servicio principal: `backend/src/main/java/com/hro/system/turnoestacion/service/TurnoEstacionService.java`
- Puente con Archivo: `backend/src/main/java/com/hro/system/turnoestacion/service/EnfermeriaArchivoBridgeService.java`
- Pruebas: `backend/src/test/java/com/hro/system/turnoestacion/controller/TurnoEstacionCircuitoTest.java`
