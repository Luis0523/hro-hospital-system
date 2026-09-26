# Actualización: horario por subespecialidad y turnos (backend v1.5.0+)

Documento para el **frontend** sobre el rediseño (épica **SCRUM-81**): el horario y los cupos
ya **no dependen del médico**; se configuran **por subespecialidad**, y los turnos pasan a
**numeración global del día** con **balanceo de salas**.

- Backend desplegado base: `https://hro-hospital-api.fly.dev/api/v1`
- Migraciones nuevas: **V10** (horario por subespecialidad) y **V11** (contador de turno global).

---

## 1. Qué cambió (resumen)

| Antes | Ahora |
|---|---|
| Horario/capacidad por **médico** (`medico_subespecialidad`: médico + día + horas). | Horario por **subespecialidad** (`subespecialidad_horario`: día + horas + capacidad). |
| `cupo_diario` apuntaba a `medico_subespecialidad_id`. | `cupo_diario` apunta a `subespecialidad_horario_id`. |
| DTOs de cupo/cita/turno exponían `medicoId`/`medicoNombre`. | **Ya no exponen médico**. |
| Turno numerado **por sala**. | Turno numerado **global por día** (todos los pacientes). |
| Una sola sala por subespecialidad (se rompía con 2). | **Varias salas** por subespecialidad; el check-in **balancea**. |

> El médico queda **fuera del flujo operativo** (solo órdenes de laboratorio y su dashboard).
> `medico_subespecialidad` se conserva **solo** para el dashboard del médico.

---

## 2. Horario por subespecialidad (nuevo)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/subespecialidades/{id}/horarios` | Lista los horarios (días/horas) de la subespecialidad. |
| GET | `/subespecialidad-horarios/{id}` | Detalle. |
| POST | `/subespecialidad-horarios` | Crea un día de horario. |
| PUT | `/subespecialidad-horarios/{id}` | Actualiza. |
| PATCH | `/subespecialidad-horarios/{id}/reactivar` | Reactiva (idempotente). |
| DELETE | `/subespecialidad-horarios/{id}` | Baja lógica. |

Request:
```json
{ "subespecialidadId": 2, "diaSemana": 1, "horaInicio": "08:00:00",
  "horaFin": "12:00:00", "capacidadMaxima": 20, "duracionConsultaMinutos": 30 }
```
- `diaSemana`: 1=Lunes … 7=Domingo. **Único por (subespecialidad, día)** → día repetido = `400`.
- Escrituras requieren rol `jefe_enfermeria` o `administrador`.

---

## 3. Cupos (cambio de contrato)

- `GET /cupos?subespecialidadId=&fechaInicio=&fechaFin=&soloDisponibles=` (ya **no** acepta `medicoId`/`medicoSubespecialidadId`).
- `GET /cupos/subespecialidad-horario/{subespecialidadHorarioId}/fecha/{fecha}` (inicializa/consulta).
- `POST /cupos/subespecialidad-horario/{subespecialidadHorarioId}/fecha/{fecha}/reservar`.
- `CupoDiarioResponseDTO` ahora devuelve: `subespecialidadHorarioId`, `subespecialidadId`, `subespecialidadNombre`, `diaSemana`, `horaInicio/Fin`, capacidades y `disponible`. **Sin médico**.

---

## 4. Citas (cambio de contrato)

- `CitaResponseDTO` ya **no** trae `medicoNombre`; sí `subespecialidadNombre`.
- `POST /citas/{id}/reprogramar` sigue igual; la disponibilidad se resuelve por la **misma subespecialidad/horario**.
- `GET /citas/{id}/disponibilidad?fechaInicio=&fechaFin=` (cupos de la misma programación).

---

## 5. Turnos (nuevo comportamiento)

- **Check-in** (`POST /turnos/check-in`): resuelve **todas** las salas de la subespecialidad ese día y asigna la **menos cargada** (balanceo). Si no hay sala → `400` ("el jefe de enfermería debe asignar la sala del día").
- **Numeración global**: el `numeroTurno` es único por **fecha** (ej. `#001 → Clínica 1 (Pediatría)`, `#002 → Clínica 3 (Ginecología)`).
- **Reasignar sala** (nuevo): `PATCH /turnos/{id}/sala?nuevoEspacioFisicoId=&motivo=` → mueve el turno a otra sala de la **misma subespecialidad** (auditado y notificado al tablero).
- `TurnoResponseDTO` ya **no** trae `medicoNombre`; incluye `espacioNumero`, `nivel`, `subespecialidadNombre`.

---

## 6. Tablero (WebSocket)

`/topic/tablero` y `/topic/clinica/{asignacionId}` con `TableroTurnoDTO`
(`espacioNumero`, `nivel`, `subespecialidadNombre`, `turnoActual`, `turnoSiguiente`, `tipoEvento`).
El payload se emite **aunque** la sala aún no tenga contador propio.

---

## 7. Integración recomendada

1. **Configurar horario** por subespecialidad (días/horas/capacidad) en el panel del jefe.
2. **Asignar salas** del día (carpeta de asignación diaria).
3. **Check-in**: el sistema balancea entre las salas de la subespecialidad.
4. **Tablero**: mostrar `numeroTurno` (global) + sala + subespecialidad; permitir **reasignar sala** si se desocupa una antes.
5. No enviar ya `medicoId`/`medicoSubespecialidadId` a `/cupos`; usar `subespecialidadId` u horario.

> Requiere aplicar las migraciones **V10** y **V11** (Flyway al desplegar).
