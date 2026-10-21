# Backend — Turnos de Estación de Enfermería

## Objetivo

Implementar en el backend el nuevo flujo de **registro y seguimiento de turnos por estación de enfermería**, reemplazando funcionalmente el registro de carnets de la Mesa COEX.

El módulo debe permitir:

1. Registrar un turno con correlativo por especialidad y número general por estación.
2. Recibir físicamente el expediente.
3. Asignar el turno a una clínica física.
4. Validar al médico por número de colegiado.
5. Vincular el turno con el número de expediente.
6. Llamar, re-llamar, marcar no asistió y marcar atendido.
7. Devolver el expediente y reflejar el movimiento en Archivo.
8. Archivar y cerrar el ciclo.

En esta fase el módulo trabaja de forma independiente para pruebas. No se eliminan todavía las tablas ni el código de `carnet`/COEX.

## Decisiones de negocio

- **Correlativo por especialidad:** cada especialidad tiene su propia serie (`MI1`, `MI2`, `P1`, `P2`).
- **Número general por estación:** cada estación tiene un contador diario propio que incrementa con cualquier especialidad.
  - Ejemplo: `MI4` puede ser el turno general `4`; si después se registra `P1`, será el turno general `5`; luego `MI5` será el `6`.
- **Formato visible:** abreviatura de especialidad + correlativo, sin guion (`MI1`, no `MI-1`).
- **Tope por especialidad:** configurable mediante `especialidad.correlativo_max`. Si es `NULL`, no hay tope.
- **Una especialidad no se repite entre estaciones.** El servicio valida la pertenencia mediante la configuración de estación.
- **El turno general es el que se usa para audio y tablero.** El correlativo por especialidad es para el libro digital y la identificación del expediente.
- **El registro inicial no exige paciente ni expediente.** El doctor vincula el expediente cuando el paciente está en clínica.
- **La clínica se resuelve por QR.** El consultorio abre una URL similar a `?clinica=1`; el frontend resuelve `EspacioFisico.numero = "1"`. No hay selector de clínica.
- **El médico se valida por colegiado.** No se crea un sistema de login real; se reutiliza la identidad mock por cabeceras y se valida contra la tabla `medico`.
- **El doctor ve los pacientes de la clínica**, no una lista filtrada por médico.
- **Archivo es independiente.** El puente con `ExpedienteCiclo` se activa cuando el doctor vincula el expediente y se completa en la devolución/recepción.
- **No se implementa microservicio.** Todo vive en el monolito, en un paquete aislado.

## Estados

Estados principales:

| Estado | Etiqueta | Responsable |
|---|---|---|
| `registrado` | Registrado | Enfermería |
| `recibido` | Recibido | Enfermería |
| `en_clinica` | En clínica | Enfermería |
| `llamado` | Llamado | Médico |
| `no_asistio` | No asistió | Médico |
| `atendido` | Atendido | Médico |
| `devuelto` | Devuelto | Enfermería |
| `archivado` | Archivo | Archivo |

Transiciones permitidas:

```text
registrado  -> recibido
recibido    -> en_clinica
en_clinica  -> llamado | atendido | no_asistio | devuelto
llamado     -> llamado | atendido | no_asistio | devuelto
no_asistio  -> llamado | devuelto
atendido    -> devuelto
devuelto    -> archivado
```

Reglas:

- Un re-llamado se registra como movimiento `llamado -> llamado` e incrementa `llamados`.
- `vincular-expediente` no cambia el estado; solo asocia paciente/expediente/ciclo.
- `devuelto` representa la devolución física de clínica a Archivo.
- `archivado` lo confirma el rol Archivo.

## Modelo de datos — migración V31

Archivo: `backend/src/main/resources/db/migration/V31__turno_estacion.sql`

### Alteración de catálogo

```sql
ALTER TABLE especialidad
    ADD COLUMN correlativo_max INTEGER NULL
    CHECK (correlativo_max IS NULL OR correlativo_max > 0);
```

### Contadores

```text
contador_turno_estacion
  estacion_id BIGINT
  fecha DATE
  ultimo_numero INTEGER
  PK (estacion_id, fecha)

contador_correlativo_especialidad
  especialidad_id BIGINT
  fecha DATE
  ultimo_correlativo INTEGER
  PK (especialidad_id, fecha)
```

### Tabla principal

```text
turno_estacion
  id UUID PK
  fecha DATE NOT NULL
  estacion_id BIGINT NOT NULL FK
  especialidad_id BIGINT NOT NULL FK
  correlativo_especialidad INTEGER NOT NULL
  numero_general INTEGER NOT NULL
  estado VARCHAR(20) NOT NULL
  paciente_id UUID NULL FK
  expediente_id UUID NULL FK
  numero_expediente VARCHAR(30) NULL
  paciente_nombre VARCHAR(200) NULL
  cita_id BIGINT NULL FK
  expediente_ciclo_id UUID NULL FK
  espacio_fisico_id UUID NULL FK
  medico_id UUID NULL FK
  llamados INTEGER NOT NULL DEFAULT 0
  ultimo_llamado_en TIMESTAMPTZ NULL
  registrado_por_id BIGINT NOT NULL FK
  registrado_en TIMESTAMPTZ NOT NULL
  recibido_por_id BIGINT NULL FK
  recibido_en TIMESTAMPTZ NULL
  asignado_por_id BIGINT NULL FK
  asignado_en TIMESTAMPTZ NULL
  atendido_por_id BIGINT NULL FK
  atendido_en TIMESTAMPTZ NULL
  no_asistio_por_id BIGINT NULL FK
  no_asistio_en TIMESTAMPTZ NULL
  devuelto_por_id BIGINT NULL FK
  devuelto_en TIMESTAMPTZ NULL
  archivado_por_id BIGINT NULL FK
  archivado_en TIMESTAMPTZ NULL
  activo BOOLEAN NOT NULL DEFAULT TRUE
  eliminado_por_id BIGINT NULL FK
  eliminado_en TIMESTAMPTZ NULL
  motivo_eliminacion TEXT NULL
  observacion TEXT NULL
  creado_en TIMESTAMPTZ NOT NULL
  actualizado_en TIMESTAMPTZ NOT NULL
```

Restricciones:

- `UNIQUE (fecha, estacion_id, numero_general)`
- `UNIQUE (fecha, especialidad_id, correlativo_especialidad)`
- Índice único parcial `(fecha, numero_expediente) WHERE numero_expediente IS NOT NULL`
- `CHECK` de estados.
- `CHECK (numero_general > 0)`.
- `CHECK (correlativo_especialidad > 0)`.

### Bitácora

```text
turno_estacion_movimiento
  id BIGINT PK
  turno_estacion_id UUID NOT NULL FK
  estado_anterior VARCHAR(20) NULL
  estado_nuevo VARCHAR(20) NOT NULL
  usuario_referencia_id BIGINT NULL FK
  medico_id UUID NULL FK
  observacion TEXT NULL
  fecha_movimiento TIMESTAMPTZ NOT NULL
```

Es append-only. No se actualiza ni se borra.

### Función de asignación atómica

`fn_asignar_correlativos_turno(p_estacion_id, p_especialidad_id, p_fecha)`:

1. Bloquea primero el contador de la estación y luego el de la especialidad, siempre en el mismo orden.
2. Crea las filas de contador si no existen.
3. Verifica `especialidad.correlativo_max`.
4. Incrementa ambos contadores.
5. Devuelve `numero_general` y `correlativo_especialidad`.
6. Si el tope se agotó, lanza error y no incrementa el contador general.

La traducción del error de tope debe responder **409 Conflict**.

## Módulo y clases

Paquete: `com.hro.system.turnoestacion`

```text
entity/TurnoEstacion.java
entity/TurnoEstacionMovimiento.java
entity/EstadoTurnoEstacion.java
repository/TurnoEstacionRepository.java
repository/TurnoEstacionMovimientoRepository.java
service/TurnoEstacionService.java
service/EnfermeriaArchivoBridgeService.java
controller/TurnoEstacionController.java
dto/...
```

No modificar `com.hro.system.turno.entity.Turno` ni sus endpoints.

## API

Base: `/turnos-estacion`

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/turnos-estacion` | Registrar turno y asignar correlativos |
| `GET` | `/turnos-estacion` | Listar con filtros |
| `GET` | `/turnos-estacion/libro` | Libro digital por estación/fecha |
| `GET` | `/turnos-estacion/{id}` | Detalle con timeline |
| `POST` | `/turnos-estacion/{id}/recibir` | Marcar recibido |
| `POST` | `/turnos-estacion/{id}/asignar-clinica` | Asignar clínica física |
| `POST` | `/turnos-estacion/{id}/vincular-expediente` | Vincular expediente |
| `POST` | `/turnos-estacion/{id}/llamar` | Llamar o re-llamar |
| `POST` | `/turnos-estacion/{id}/no-asistio` | Marcar no asistió |
| `POST` | `/turnos-estacion/{id}/atendido` | Marcar atendido |
| `POST` | `/turnos-estacion/{id}/devolver` | Devolver a Archivo |
| `POST` | `/turnos-estacion/{id}/archivar` | Archivo confirma recepción |
| `DELETE` | `/turnos-estacion/{id}` | Eliminar/desactivar correlativo |

### Registro

```json
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
  "id": "uuid",
  "fecha": "2026-10-20",
  "estacionId": 1,
  "especialidadId": 10,
  "especialidadNombre": "Medicina Interna",
  "abreviatura": "MI",
  "correlativoEspecialidad": 4,
  "codigo": "MI4",
  "numeroGeneral": 4,
  "estado": "registrado",
  "llamados": 0
}
```

### Asignar clínica

```json
{
  "espacioFisicoId": "uuid"
}
```

### Vincular expediente

```json
{
  "numeroColegiado": "12345",
  "espacioFisicoId": "uuid",
  "numeroExpediente": "EXP-000123"
}
```

### Acciones del médico

```json
{
  "numeroColegiado": "12345",
  "espacioFisicoId": "uuid",
  "observacion": "opcional"
}
```

Se validan:

- que el médico exista y esté activo;
- que el turno esté asignado a la clínica enviada;
- que la transición sea válida.

### Devolución

```json
{
  "observacion": "opcional"
}
```

### Archivado

```json
{
  "ubicacionDestinoId": "uuid-opcional",
  "observacion": "opcional"
}
```

### Libro digital

`GET /turnos-estacion/libro?estacionId=1&fecha=2026-10-20`

Devuelve:

- estación y fecha;
- resumen por estado;
- especialidades de la estación con `abreviatura`, `correlativoMax`, `registrados` y turnos.

## Endpoints de apoyo

### Clínica por QR

`GET /espacios-fisicos/numero/{numero}`

Devuelve el `EspacioFisicoResponseDTO` correspondiente. El frontend transforma `?clinica=1` en esta llamada. No se crea entidad `Clinica`.

### Médico por colegiado

Se reutiliza:

`GET /medicos/colegiado/{numeroColegiado}`

## Seguridad

- Registrar, recibir, asignar clínica, devolver y eliminar:
  - `enfermeria`, `jefe_enfermeria`, `administrador`.
- Vincular expediente, llamar, no asistió y atendido:
  - `medico`, `administrador`.
- Archivar:
  - `archivo`, `administrador`.

Respetar `X-Estacion-Id` cuando esté presente y validar que coincida con la estación del turno.

## Reglas de borrado

Solo se puede eliminar un turno en estado `registrado`, sin paciente y sin expediente.

- Si es el **último turno general** de la estación/fecha:
  - se elimina físicamente;
  - se decrementan ambos contadores;
  - el número puede reutilizarse.
- Si no es el último:
  - se desactiva lógicamente (`activo = false`);
  - se guarda `motivo_eliminacion` si viene;
  - el número queda reservado y no se reutiliza;
  - no se tocan los contadores.

Un turno con paciente/expediente vinculado nunca se elimina; solo puede seguir su flujo.

## Integración con Archivo

Servicio: `EnfermeriaArchivoBridgeService`.

### Al vincular expediente

1. Resolver `Expediente` por `numero_expediente`.
2. Completar `paciente_id`, `paciente_nombre` y `numero_expediente` en el turno.
3. Buscar un ciclo abierto del expediente.
4. Si no existe, crear `ExpedienteCiclo` en estado `entregado` con cita opcional.
5. Registrar movimiento `null -> entregado` con observación “Vinculado desde estación de enfermería”.
6. Guardar `expediente_ciclo_id` en el turno.

Si ya existe un ciclo abierto, se reutiliza y no se fuerza un estado distinto.

### Al devolver

- Si el ciclo está en `entregado`, llamar a `ArchivoService.retornar` para pasar a `en_transito_retorno`.
- Si no está en `entregado`, no forzar la transición; mantener la historia local y registrar advertencia.

### Al archivar

- Llamar a `ArchivoService.archivar` para pasar a `archivado`.
- Requiere rol `archivo` o `administrador`.

La historia de Enfermería queda en `turno_estacion_movimiento`; la de Archivo en `expediente_movimiento`.

## Validaciones

- Estación existente y activa.
- Especialidad existente.
- Especialidad asociada a la estación.
- Fecha válida.
- Clínica existente, activa y asignada a la fecha.
- Médico existente y activo.
- Expediente existente; si se vincula, debe pertenecer al paciente indicado.
- Un expediente no puede repetirse en dos turnos activos de la misma fecha.
- Transiciones de estado válidas.
- Roles autorizados por acción.

## Pruebas mínimas

1. Secuencia `MI1 -> P1 -> MI2` produce turnos generales `1 -> 2 -> 3`.
2. Dos registros concurrentes en la misma estación no repiten número general.
3. Dos registros concurrentes de la misma especialidad no repiten correlativo.
4. Tope agotado responde 409 y no consume turno general.
5. Re-llamado incrementa `llamados` y deja movimiento.
6. No se permite `atendido -> llamado`.
7. Borrado físico del último turno decrementa contadores.
8. Borrado de un turno anterior es lógico y no reutiliza número.
9. Doctor con colegiado inválido recibe 404/403.
10. Clínica de otra sede o no asignada es rechazada.
11. Vínculo con expediente crea/reutiliza `ExpedienteCiclo` y movimiento.
12. Devolución y archivado reflejan estados en Archivo.
13. `GET /espacios-fisicos/numero/{numero}` resuelve el QR.

## Criterios de aceptación

- `V31` aplica correctamente sobre la base actual.
- No se modifica el flujo existente de `Turno`, `carnet` ni Archivo.
- El nuevo módulo compila y pasa `./mvnw test`.
- Swagger documenta todos los endpoints.
- El libro digital devuelve correlativos, número general y resumen por estado.
- La devolución a Archivo queda registrada en ambos historiales.
- El frontend puede construir la pantalla sin selector de clínica ni de especialidad duplicada.
