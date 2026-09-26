# Actualización del Panel de Administración — Contratos backend (v1.4.0)

Guía para el equipo de **frontend de administración** sobre los nuevos contratos del backend
(épica **SCRUM-109**) y cómo implementarlos. Backend desplegado:
`https://hro-hospital-api.fly.dev/api/v1` (local: `http://localhost:8081/api/v1`).

> Regla base: el frontend **solicita, muestra, edita configuración y refleja decisiones del backend**.
> No recalcula reglas de negocio ni inventa endpoints.

---

## 1. Convenciones generales

- **Envoltura de respuesta** (`ApiResponse`):
  ```json
  { "timestamp": "...", "success": true, "codigo": null, "message": "...", "data": { } }
  ```
  En error: `success=false`, `codigo` (nullable) y `message`.
- **Códigos de error estructurados** (usar `codigo`, no el texto):
  - `DIA_NO_LABORABLE_CON_CITAS` (409), `DIA_NO_LABORABLE_YA_EXISTE` (400)
  - `CUPOS_AGOTADOS` (409), `ACCESO_DENEGADO` (403)
  - Errores de validación → 400 con `data` = mapa campo→mensaje.
- **Autenticación (mock):** el backend resuelve la identidad por cabeceras
  `X-Usuario-Id`, `X-Usuario-Rol`, `X-Usuario-Nombre` (el `client.js` ya las envía).
- **Filtro de estado** en listados administrativos: `?estado=activos|inactivos|todos`
  (omitido = `activos`, para no romper consumidores existentes).

---

## 2. Catálogos: especialidades, subespecialidades y espacios físicos

| Método | Ruta | Notas |
|---|---|---|
| GET | `/especialidades?estado=` | Filtra por estado. |
| PATCH | `/especialidades/{id}/reactivar` | Reactiva (idempotente). |
| GET | `/subespecialidades?estado=` | Catálogo completo filtrado. |
| GET | `/subespecialidades/especialidad/{especialidadId}?estado=` | Filtra por especialidad y estado. |
| PATCH | `/subespecialidades/{id}/reactivar` | Falla con 400 si la **especialidad padre** está inactiva. |
| GET | `/espacios-fisicos?estado=` y `/espacios-fisicos/nivel/{nivel}?estado=` | Filtra por estado. |
| PATCH | `/espacios-fisicos/{id}/reactivar` | Reactiva. |

**Implementación en frontend:** agregar un selector de estado (Activos/Inactivos/Todos) en cada
catálogo; mostrar el botón **Reactivar** cuando `activo=false`. No eliminar registros: la baja es lógica.

---

## 3. Médicos y programación

| Método | Ruta | Notas |
|---|---|---|
| GET | `/medicos?estado=` | Filtra por estado. |
| PATCH | `/medicos/{id}/reactivar` | Reactiva. |
| GET | `/medico-subespecialidades?medicoId=&subespecialidadId=&diaSemana=&estado=` | Listado general con filtros. |
| PUT | `/medico-subespecialidades/{id}` | Edita **horario, capacidad y duración** (no cambia médico/subespecialidad/día). |
| PATCH | `/medico-subespecialidades/{id}/reactivar` | Reactiva; falla si médico/subespecialidad inactivos o hay solapamiento. |

`PUT /medico-subespecialidades/{id}`:
```json
{ "horaInicio": "08:00:00", "horaFin": "12:00:00", "capacidadMaxima": 8, "duracionConsultaMinutos": 30 }
```

**Validaciones del backend (mostrar el `message`):** capacidad que no cabe en la jornada,
horarios solapados del mismo médico/día, duplicidad médico+subespecialidad+día.

**Implementación:** la programación ahora **es editable** (antes no lo era); habilitar el formulario
de edición y la reactivación.

---

## 4. Usuarios, roles y permisos

### Usuarios
| Método | Ruta | Notas |
|---|---|---|
| GET | `/usuarios?estado=&rol=` | Listado con filtros. |
| GET | `/usuarios/{id}` | Detalle. |
| PATCH | `/usuarios/{id}/activar` y `/usuarios/{id}/desactivar` | Idempotentes. |
| PUT | `/usuarios/{id}/rol` | Asigna rol. |

> **Origen de creación:** los usuarios se aprovisionan automáticamente (JIT) desde el proveedor
> de identidad externo. El panel **no crea usuarios ni administra contraseñas**.

`PUT /usuarios/{id}/rol` → `{ "rolPrincipal": "medico" }`.

### Roles
`GET /roles` → lista de valores válidos:
`personal_citas`, `enfermeria`, `medico`, `administrador`, `archivo`, `jefe_enfermeria`.

### Permisos por subespecialidad
| Método | Ruta | Notas |
|---|---|---|
| GET | `/usuarios/{id}/permisos?estado=` | Permisos de un usuario. |
| GET | `/permisos-subespecialidad?subespecialidadId=&estado=` | Permisos por subespecialidad. |
| POST | `/permisos-subespecialidad` | Asigna (si existía inactivo, lo reactiva). |
| PATCH | `/permisos-subespecialidad/{id}/desactivar` y `/reactivar` | Baja lógica / reactivación. |

`POST /permisos-subespecialidad` → `{ "usuarioId": 1, "subespecialidadId": 1, "tipoPermiso": "autorizar_cupo" }`.
Tipos válidos: `avanzar_turno`, `generar_orden_laboratorio`, `autorizar_cupo`.

**Implementación:** desbloquear la sección de Usuarios (hoy informativa) y agregar la gestión de
permisos (listar/crear/desactivar/reactivar) con filtro de estado.

---

## 5. Calendario institucional (día no laborable)

`POST /dias-no-laborables` `{ "fecha": "2026-12-25", "motivo": "...", "forzar": false }`

- `201` si no hay citas activas.
- **`409`** con `codigo=DIA_NO_LABORABLE_CON_CITAS` y `data` con las citas afectadas:
  ```json
  {
    "success": false,
    "codigo": "DIA_NO_LABORABLE_CON_CITAS",
    "message": "Existen 1 cita(s) activa(s)...",
    "data": {
      "fecha": "2026-12-25",
      "totalCitas": 1,
      "citas": [{ "id": 7, "horaEstimada": "08:30:00", "estado": "confirmada",
                  "pacienteNombre": "Juan López", "medicoNombre": "Dr. ...", "subespecialidadNombre": "..." }]
    }
  }
  ```
  **Flujo:** mostrar las citas afectadas → pedir confirmación explícita → reintentar con `forzar: true`.
- `400` con `codigo=DIA_NO_LABORABLE_YA_EXISTE` si la fecha ya está registrada.
- `PUT /dias-no-laborables/{id}` `{ "motivo": "..." }` edita el motivo.
- `DELETE /dias-no-laborables/{id}` habilita la fecha.
- **No hay reprogramación automática.**

---

## 6. Disponibilidad y reprogramación

| Método | Ruta | Notas |
|---|---|---|
| GET | `/cupos?subespecialidadId=&medicoId=&medicoSubespecialidadId=&fechaInicio=&fechaFin=&soloDisponibles=` | `soloDisponibles=true` omite cupos sin disponibilidad. |
| GET | `/citas/{id}/disponibilidad?fechaInicio=&fechaFin=` | Cupos de la **misma programación** (médico + subespecialidad) de la cita. |
| POST | `/citas/{id}/reprogramar` `{ "nuevoCupoDiarioId": "...", "motivo": "..." }` | Confirma el cambio. |

**Flujo de 2 pasos:** consultar disponibilidad → elegir cupo con `disponible=true` → confirmar.
Detalle completo en [`FLUJO_ADMIN_DISPONIBILIDAD.md`](./FLUJO_ADMIN_DISPONIBILIDAD.md).

---

## 7. Dashboard

`GET /dashboard/resumen?fecha=YYYY-MM-DD` (por defecto, hoy):

```json
{
  "fecha": "2026-11-09",
  "totalCitas": 42, "citasPendientes": 5, "citasConfirmadas": 20,
  "citasAtendidas": 15, "citasCanceladas": 1, "citasReprogramadas": 1,
  "inasistencias": 2, "capacidadTotal": 60, "cuposOcupados": 42, "cuposDisponibles": 18,
  "tasaInasistencia": 11.76,
  "alertas": [
    { "codigo": "CUPOS_AGOTADOS", "severidad": "ADVERTENCIA", "mensaje": "..." }
  ]
}
```

Alertas: `CITAS_EN_DIA_NO_LABORABLE` (CRITICA), `CUPOS_AGOTADOS` (ADVERTENCIA),
`DIAS_NO_LABORABLES_PROXIMOS` (INFO). **No recalcular en el cliente.**

---

## 8. Reportes

| Método | Ruta | Devuelve |
|---|---|---|
| GET | `/reportes/citas-por-estado?fechaInicio=&fechaFin=` | `total` + `porEstado` (mapa). |
| GET | `/reportes/demanda-por-especialidad?fechaInicio=&fechaFin=` | `items[]` con `totalCitas`, `atendidas`, `inasistencias`. |
| GET | `/reportes/utilizacion-cupos?fechaInicio=&fechaFin=&subespecialidadId=` | `capacidadTotal`, `cuposOcupados`, `cuposDisponibles`, `utilizacionPorcentaje`. |

Por defecto, últimos 30 días. `400` si `fechaFin < fechaInicio`.

---

## 9. Auditoría

`GET /auditoria?tabla=&usuarioId=&accion=&fechaInicio=&fechaFin=&page=&size=`

- **Solo rol `administrador`** (otro rol → `403` `ACCESO_DENEGADO`).
- Respuesta paginada (`data.content`, `data.totalElements`, ...), orden `fecha` DESC.
- Cada ítem (`AuditoriaResponseDTO`): `id`, `tablaAfectada`, `entidadId`, `accion`,
  `usuarioId`, `usuarioNombre`, `valoresAnteriores` (JSON texto), `valoresNuevos` (JSON texto), `fecha`.
- Vista de **solo lectura**. `valoresAnteriores`/`valoresNuevos` son JSON en string (parsear con `JSON.parse`).

---

## 10. Cómo implementarlo en el frontend (recomendaciones)

1. **Capa API:** mantener los métodos en `modules/administracion/api/administracionApi.js`.
   Alternar `VITE_USE_MOCK`: los mocks deben imitar estos contratos; en `VITE_USE_MOCK=false`
   consumen el backend real.
2. **Filtro de estado reutilizable:** un `Select` (Activos/Inactivos/Todos) que se traduce a
   `?estado=`. Omitir el parámetro equivale a `activos`.
3. **Manejo de errores:** leer `error.response.data.codigo`:
   - `DIA_NO_LABORABLE_CON_CITAS` → mostrar citas afectadas y botón "Bloquear de todos modos" (`forzar:true`).
   - `CUPOS_AGOTADOS` → sugerir otra fecha/cupo.
   - `ACCESO_DENEGADO` → mensaje de permisos.
4. **Estados de UI:** usar los componentes compartidos (`Alert`, `EmptyState`, `Spinner`, `Modal`,
   `Table`, `EstadoBadge`) y `ToastContext` para confirmaciones.
5. **Reactivación:** botón visible cuando `activo=false`; tras la acción, refrescar el listado.
6. **No implementar lógica de negocio** (disponibilidad, cálculo de cupos, indicadores): mostrar lo que devuelve el backend.

---

## 11. Migraciones requeridas

- **V7** — columna `activo` en `permiso_subespecialidad` (baja lógica de permisos).
- **V8** — índices de consulta en `auditoria_general`.

Flyway las aplica al desplegar. Verificar en `flyway_schema_history` que `success = true`.

---

## 12. Verificación rápida

```bash
# Salud
curl https://hro-hospital-api.fly.dev/api/v1/health
# Catálogo con filtro (público)
curl "https://hro-hospital-api.fly.dev/api/v1/roles"
# Auditoría (requiere rol administrador; el mock por defecto lo es)
curl "https://hro-hospital-api.fly.dev/api/v1/auditoria?size=1"
```
