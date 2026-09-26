# Flujo administrativo de disponibilidad y reprogramación

Documento de definición de la historia **SCRUM-119** y su subtarea **SCRUM-127**
(épica SCRUM-109, backend del Panel de Administración).

Define **cómo** el administrador consulta disponibilidad y gestiona cambios de fecha
cuando una jornada no puede utilizarse (por ejemplo, al bloquear un día no laborable).

> Estado: definición vigente. Los contratos aquí descritos están implementados en el backend.

---

## 1. Filtros necesarios para consultar disponibilidad

`GET /api/v1/cupos` (todos los filtros son opcionales y combinables):

| Filtro | Descripción |
|---|---|
| `subespecialidadId` | Limita a una subespecialidad. |
| `medicoId` | Limita a un médico. |
| `medicoSubespecialidadId` | Limita a una programación concreta (médico + subespecialidad). |
| `fechaInicio` / `fechaFin` | Rango de fechas (ISO `YYYY-MM-DD`). |
| `soloDisponibles` | Si es `true`, omite los cupos sin disponibilidad (`cuposDisponibles = 0`). |

Cada cupo devuelto incluye `capacidadMaxima`, `cuposOcupados`, `cuposDisponibles` y `disponible`.

## 2. Reglas de consulta

- **Rango por defecto:** si no se envía `fechaInicio`, se usa hoy; si no se envía `fechaFin`,
  hoy + 14 días. `fechaFin` no puede ser anterior a `fechaInicio` (400).
- Solo se consideran **programaciones activas** (`medico_subespecialidad.activo = true`).
- Solo se generan cupos para los **días de la semana** en que atiende la programación.
- Se **excluyen los días no laborables** institucionales.
- La consulta puede inicializar el `cupo_diario` de una fecha (misma semántica que el
  agendamiento), por lo que es una operación de escritura controlada, no solo lectura.

## 3. Comportamiento al bloquear fechas

- Al registrar un día no laborable con citas activas, el backend responde **409**
  (`codigo = DIA_NO_LABORABLE_CON_CITAS`) con la lista de citas afectadas. El administrador
  confirma y reintenta con `forzar = true` (ver historia SCRUM-118 / SCRUM-126).
- **No se reprograma nada de forma automática** al bloquear una fecha. Las citas afectadas
  quedan pendientes y el administrador las gestiona una por una.
- Estados considerados bloqueantes: cualquier estado distinto de `cancelada` y `reprogramada`.

## 4. Reprogramación automática

**No existe reprogramación automática.** El backend nunca mueve citas por sí solo.
Toda reprogramación es una acción explícita del administrador con motivo obligatorio,
y queda auditada (transición de estado + bitácora).

## 5. Conservación de médico y subespecialidad

La reprogramación administrativa **conserva el médico y la subespecialidad** de la cita:
solo cambia la fecha (y por tanto el `cupo_diario`), usando la **misma programación**
`medico_subespecialidad` de la cita original.

Para facilitarlo, el backend expone la disponibilidad de la propia cita:

`GET /api/v1/citas/{id}/disponibilidad?fechaInicio=&fechaFin=`

Devuelve los cupos de la **misma programación** de la cita (médico + subespecialidad) en el
rango indicado. El administrador elige una fecha con `disponible = true`.

> El endpoint genérico `POST /api/v1/citas/{id}/reprogramar` sigue aceptando cualquier
> `nuevoCupoDiarioId`; el flujo administrativo recomendado usa la disponibilidad de la
> propia cita para no cambiar médico ni subespecialidad.

## 6. Confirmación previa del cambio

La reprogramación es un flujo de **dos pasos**:

1. **Consultar** la disponibilidad (`GET /citas/{id}/disponibilidad` o `GET /cupos`).
2. **Confirmar** con `POST /citas/{id}/reprogramar` `{ nuevoCupoDiarioId, motivo }`.

El backend valida y aplica el cambio: marca la cita original como `reprogramada`, libera su
cupo, reserva el nuevo cupo de forma atómica y crea una nueva cita enlazada por `cita_origen_id`.
Si el nuevo cupo está lleno, responde **409** (`CUPOS_AGOTADOS`).

## 7. Flujo recomendado (administrador)

```
1. Bloquear fecha        -> POST /dias-no-laborables  (409 + citas afectadas)
2. Confirmar bloqueo     -> POST /dias-no-laborables  { forzar: true }
3. Por cada cita afectada:
   3.1 Consultar fechas  -> GET  /citas/{id}/disponibilidad?fechaInicio=&fechaFin=
   3.2 Elegir cupo libre -> (cuposDisponibles > 0)
   3.3 Confirmar cambio  -> POST /citas/{id}/reprogramar { nuevoCupoDiarioId, motivo }
```

---

## Contratos relacionados

| Método | Ruta | Uso |
|---|---|---|
| `GET` | `/cupos` | Disponibilidad por subespecialidad/médico/programación y rango. |
| `GET` | `/citas/{id}/disponibilidad` | Disponibilidad de la misma programación de la cita. |
| `POST` | `/citas/{id}/reprogramar` | Confirma el cambio de fecha (conservando médico/subespecialidad). |
| `POST` | `/dias-no-laborables` | Bloquea una fecha (con `forzar` si hay citas). |
