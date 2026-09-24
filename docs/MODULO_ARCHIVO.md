# Módulo de Archivo — Seguimiento de Expedientes Físicos

**Sistema Hospitalario HRO — Hospital Regional de Occidente**
**Backend:** `1.4.0` · **Migraciones BD:** `V6__seguimiento_expedientes_fisicos.sql`, `V9__actas_recepcion_expedientes.sql`
**Rol de la estación:** `archivo`
**Base URL:** `{{baseUrl}}` → `http://localhost:8081/api/v1` (o `https://hro-hospital-api.fly.dev/api/v1`)

> Este documento es la fuente de verdad del contrato del módulo de Archivo para el frontend.
> El esquema de base de datos (V6) y el backend (`com.hro.system.archivo`) ya están implementados; la colección de Postman (`06. Estación de Archivo`) contiene ejemplos listos para ejecutar.

---

## 1. Concepto: seguimiento tipo paquete

Un mismo expediente físico **no hace un solo viaje**: hace un viaje de ida y vuelta por cada cita del paciente. Por eso el modelo se separa en tres niveles, igual que `cita` → `cita_estado_historial`:

| Nivel | Tabla | Qué representa |
| :--- | :--- | :--- |
| Objeto físico | `expediente` | El "paquete". Existe **una sola vez por paciente**. |
| Viaje | `expediente_ciclo` | Un recorrido completo asociado a **una cita** específica. |
| Checkpoint | `expediente_movimiento` | Cada evento puntual del viaje (bitácora inmutable). |

**Regla de oro para la UI:** la pantalla de Archivo **siempre trabaja sobre el ciclo de una cita**, nunca sobre "el expediente" en abstracto. Un mismo expediente acumula un ciclo distinto por cada cita futura.

---

## 2. Entidades y campos

### 2.1 `ubicacion_archivo` (catálogo)
| Campo | Tipo | Notas |
| :--- | :--- | :--- |
| `id` | `BIGINT` | Numérico. |
| `pasillo` | `VARCHAR(20)` | Obligatorio. |
| `estante` | `VARCHAR(20)` | Obligatorio. |
| `balda` | `VARCHAR(20)` | Opcional. |
| `descripcion` | `VARCHAR(150)` | Opcional. |

Único por `(pasillo, estante, balda)`.

> **Equivalencia con el modelo operativo (Archivo/Estante/Fila/Caja).**
> La entidad `ubicacion_archivo` **no se renombró** (contrato estable). El mapeo es:
> `pasillo` = **Archivo**, `estante` = **Estante**, `balda` = **Caja**. El concepto **Fila**
> no se modela actualmente. Se gestiona con `GET/POST /ubicaciones-archivo` y
> `PATCH /expedientes/{id}/ubicacion-base`.

### 2.2 `expediente` (objeto físico)
| Campo | Tipo | Notas |
| :--- | :--- | :--- |
| `id` | `UUID` | **Escaneable** (código de barras/QR en la carpeta física). |
| `pacienteId` | `UUID` | Uno por paciente (`UNIQUE`). |
| `numeroExpediente` | `VARCHAR(30)` | Único. Denormalizado desde `paciente.numero_expediente` para búsquedas directas. |
| `ubicacionBaseId` | `BIGINT` | "Casillero" permanente en archivo. |
| `activo` | `BOOLEAN` | Baja lógica. |
| `creadoEn` | `TIMESTAMPTZ` | — |

### 2.3 `expediente_ciclo` (viaje por cita)
| Campo | Tipo | Notas |
| :--- | :--- | :--- |
| `id` | `UUID` | Identificador del ciclo. |
| `expedienteId` | `UUID` | FK a `expediente`. |
| `citaId` | `BIGINT` | **`UNIQUE`**: un solo ciclo por cita. |
| `estadoActual` | `VARCHAR(25)` | Ver §3. |
| `version` | `INT` | Bloqueo optimista; se autoincrementa en cada cambio. |
| `creadoEn` / `actualizadoEn` | `TIMESTAMPTZ` | — |

### 2.4 `expediente_movimiento` (bitácora)
| Campo | Tipo | Notas |
| :--- | :--- | :--- |
| `id` | `BIGINT` | Interno (no se escanea). |
| `expedienteCicloId` | `UUID` | FK al ciclo. |
| `estadoAnterior` / `estadoNuevo` | `VARCHAR(25)` | Transición registrada. |
| `ubicacionOrigenId` / `ubicacionDestinoId` | `BIGINT` | Opcionales. |
| `usuarioReferenciaId` | `BIGINT` | Se resuelve desde la cabecera `X-Usuario-Id`. |
| `observacion` | `TEXT` | Opcional. |
| `fechaMovimiento` | `TIMESTAMPTZ` | — |

---

## 3. Máquina de estados del ciclo

Estos son los **valores exactos** del `CHECK` en base de datos. La UI debe usar estos literales (snake_case), no traducciones.

| Estado | Significado |
| :--- | :--- |
| `pendiente_localizar` | Ciclo creado; el expediente aún no se busca. |
| `en_busqueda` | Personal de archivo buscándolo en estantería. |
| `localizado` | Encontrado, listo para despachar. |
| `en_transito_entrega` | En camino a la clínica. |
| `entregado` | Recibido en la clínica (en uso). |
| `en_transito_retorno` | De regreso al archivo. |
| `archivado` | Guardado en su ubicación base. Fin del ciclo. |
| `no_localizado` | No se encontró. **No es terminal**: puede reintentarse. |

```
pendiente_localizar ──iniciar-busqueda──▶ en_busqueda ──localizar──▶ localizado
        │                                      ▲                            │
        │                                      │ reintentar-busqueda        │ despachar
        ▼                                      │                            ▼
   no-localizado ◀──no-localizado────── (cualquier estado activo)   en_transito_entrega
                                                                              │ entregar
                                                                              ▼
                                                                          entregado
                                                                              │ retornar
                                                                              ▼
                                                                   en_transito_retorno
                                                                              │ archivar
                                                                              ▼
                                                                          archivado
```

Cada transición **inserta una fila** en `expediente_movimiento` (nunca se actualiza ni se borra).

---

## 4. Endpoints

Todas las respuestas van envueltas en `ApiResponse<T>`:

```json
{ "timestamp": "2026-09-20T10:30:00", "success": true, "message": "…", "data": { } }
```

Las peticiones autentican por cabeceras (modo simulado):
`X-Usuario-Id`, `X-Usuario-Rol`, `X-Usuario-Nombre` (rol `archivo`).

### 4.1 Ubicaciones de archivo (catálogo)
| Método | Ruta | Cuerpo | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/ubicaciones-archivo` | — | Lista el catálogo de ubicaciones. |
| `POST` | `/ubicaciones-archivo` | `{ pasillo, estante, balda?, descripcion? }` | Crea una ubicación. |

### 4.2 Expedientes
| Método | Ruta | Cuerpo / Query | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/expedientes/buscar` | `?filtro=&page=&size=` | Búsqueda paginada por número, DPI o nombre (`data.content`). |
| `GET` | `/expedientes/buscar` | `?codigo=` | Resuelve el **UUID (QR)** o el **número (barras)** exacto y devuelve `data.content` con ese expediente. Código inexistente → `404`. |
| `GET` | `/expedientes/jornada` | `?fecha=&subespecialidadId=` | **Jornada diaria:** citas de la fecha (y unidad opcional) con paciente, número de expediente, `expedienteId`, `cicloId`, `estadoActual` (o `sin_ciclo`) y ubicación base. Fecha por defecto: hoy. |
| `GET` | `/expedientes/{id}` | — | Detalle por UUID (escaneo QR). |
| `GET` | `/expedientes/numero/{numeroExpediente}` | — | Detalle por número (escaneo código de barras). |
| `GET` | `/expedientes/paciente/{pacienteId}` | — | Expediente de un paciente. |
| `POST` | `/expedientes` | `{ pacienteId, numeroExpediente?, ubicacionBaseId? }` | Crea el expediente físico. |
| `PATCH` | `/expedientes/{id}/ubicacion-base` | `{ ubicacionBaseId }` | Reubica el casillero permanente. |

**Respuesta `ExpedienteResponseDTO`:**
```json
{
  "id": "3f1c…-uuid",
  "pacienteId": "9b2a…-uuid",
  "numeroExpediente": "EXP-001234",
  "ubicacionBase": { "id": 12, "pasillo": "B", "estante": "14", "balda": "3" },
  "activo": true,
  "creadoEn": "2026-09-20T10:00:00"
}
```

### 4.3 Ciclos
| Método | Ruta | Cuerpo / Query | Descripción |
| :--- | :--- | :--- | :--- |
| `POST` | `/expediente-ciclos` | `{ expedienteId, citaId }` | Inicia un ciclo (`pendiente_localizar`). `409` si la cita ya tiene ciclo. |
| `GET` | `/expediente-ciclos/{id}` | — | Detalle del ciclo **con su timeline** de movimientos. |
| `GET` | `/expediente-ciclos/cita/{citaId}` | — | Ciclo asociado a una cita. |
| `GET` | `/expediente-ciclos/expediente/{expedienteId}` | — | Historial de ciclos del expediente. |
| `GET` | `/expediente-ciclos` | `?estado=&fecha=` | Cola de trabajo filtrable por estado. |

**Respuesta `ExpedienteCicloResponseDTO`:**
```json
{
  "id": "a1b2…-uuid",
  "expedienteId": "3f1c…-uuid",
  "numeroExpediente": "EXP-001234",
  "paciente": { "id": "9b2a…-uuid", "nombres": "María", "apellidos": "López", "dpi": "2984…" },
  "citaId": 4821,
  "estadoActual": "en_busqueda",
  "version": 2,
  "creadoEn": "2026-09-20T10:00:00",
  "actualizadoEn": "2026-09-20T10:12:00",
  "movimientos": [
    {
      "id": 91,
      "estadoAnterior": "pendiente_localizar",
      "estadoNuevo": "en_busqueda",
      "ubicacionOrigen": null,
      "ubicacionDestino": null,
      "usuario": "archivo-01",
      "observacion": "Se inicia búsqueda en estantería B",
      "fechaMovimiento": "2026-09-20T10:05:00"
    }
  ]
}
```

### 4.4 Transiciones (avanzar el ciclo)
Cada endpoint inserta un `expediente_movimiento` y actualiza `estado_actual`. Todos devuelven el `ExpedienteCicloResponseDTO` actualizado.

| Método | Ruta | Cuerpo | Transición |
| :--- | :--- | :--- | :--- |
| `POST` | `/expediente-ciclos/{id}/iniciar-busqueda` | `{ observacion? }` | `pendiente_localizar` → `en_busqueda` |
| `POST` | `/expediente-ciclos/{id}/localizar` | `{ observacion? }` | `en_busqueda` → `localizado` |
| `POST` | `/expediente-ciclos/{id}/despachar` | `{ ubicacionDestinoId?, observacion? }` | `localizado` → `en_transito_entrega` |
| `POST` | `/expediente-ciclos/{id}/entregar` | `{ observacion? }` | `en_transito_entrega` → `entregado` |
| `POST` | `/expediente-ciclos/{id}/retornar` | `{ observacion? }` | `entregado` → `en_transito_retorno` |
| `POST` | `/expediente-ciclos/{id}/archivar` | `{ ubicacionDestinoId, observacion? }` | `en_transito_retorno` → `archivado` |
| `POST` | `/expediente-ciclos/{id}/no-localizado` | `{ observacion }` | *activo* → `no_localizado` |
| `POST` | `/expediente-ciclos/{id}/reintentar-busqueda` | `{ observacion? }` | `no_localizado` → `en_busqueda` |

**Ejemplo de petición:**
```http
POST /api/v1/expediente-ciclos/a1b2…-uuid/localizar
X-Usuario-Id: archivo-01
X-Usuario-Rol: archivo
Content-Type: application/json

{ "observacion": "Encontrado en pasillo B, estante 14" }
```

---

### 4.5 Actas de recepción

Un acta agrupa **N expedientes** de una jornada/unidad e identifica quién entrega y quién recibe.

| Método | Ruta | Cuerpo / Query | Descripción |
| :--- | :--- | :--- | :--- |
| `POST` | `/actas-recepcion` | `{ fecha?, subespecialidadId?, usuarioEntregaId?, usuarioRecibeId?, observaciones?, expedienteIds[] }` | Crea el acta y genera el número `ACT-YYYY-NNNN`. Si se omite `usuarioEntregaId`, se usa el usuario autenticado. |
| `GET` | `/actas-recepcion` | `?fecha=&subespecialidadId=` | Lista de actas (resumen). |
| `GET` | `/actas-recepcion/{id}` | — | Detalle del acta con la lista de expedientes. |
| `GET` | `/actas-recepcion/{id}/pdf` | — | Descarga el **PDF** oficial del acta (`application/pdf`). |

### 4.6 Resumen operativo diario

| Método | Ruta | Query | Descripción |
| :--- | :--- | :--- | :--- |
| `GET` | `/archivo/resumen` | `?fecha=` | Indicadores del día: `totalCiclos`, `pendienteLocalizar`, `enBusqueda`, `localizado`, `enTransitoEntrega`, `enTransitoRetorno`, `enTransito`, `entregado`, `archivado`, `noLocalizado`, `expedientesNuevos`. |
| `GET` | `/archivo/resumen/pdf` | `?fecha=` | Descarga el **PDF** del resumen (`application/pdf`), con fecha y usuario generador. |

---

## 5. Códigos de error y manejo en el frontend

| Código | Cuándo | Acción sugerida en UI |
| :--- | :--- | :--- |
| `400` | Transición inválida desde el estado actual | Mostrar alerta y refrescar el ciclo. |
| `404` | Expediente/ciclo no encontrado | Ofrecer búsqueda manual o creación. |
| `409` | La cita ya tiene un ciclo (o `numeroExpediente`/ubicación duplicados) | Abrir el ciclo existente en lugar de crear otro. |
| `400` | Validación de campos o transición inválida | Resaltar campos del formulario o refrescar el ciclo. |

---

## 6. Guía rápida para la pantalla de Archivo

1. **Entrada por escaneo:** leer QR (UUID) → `GET /expedientes/{id}`; o código de barras (número) → `GET /expedientes/numero/{numeroExpediente}`.
2. **Mostrar el viaje:** con el `citaId` de la cita del día, `GET /expediente-ciclos/cita/{citaId}`. Si no existe, ofrecer `POST /expediente-ciclos` (manejar `409`).
3. **Avanzar el recorrido:** botones contextuales según `estadoActual` (solo las transiciones válidas de §3). Enviar siempre `observacion` cuando la transición sea una incidencia (`no-localizado`).
4. **Timeline:** renderizar `movimientos[]` en orden como los "checkpoints" del paquete (usuario, fecha, ubicación y observación).
5. **Estados visuales:** mapear los 8 literales a etiquetas/colores en un solo diccionario compartido para evitar divergencias.

---

## 7. Variables Postman

La colección oficial (`docs/postman/HRO_Hospital_System_API.postman_collection.json`) incluye la carpeta **`06. Estación de Archivo (Expedientes Físicos)`** con todos estos requests. El entorno aporta:

| Variable | Uso |
| :--- | :--- |
| `expedienteId` | UUID del expediente (escaneo QR). |
| `numeroExpediente` | Número impreso (escaneo de barras). |
| `expedienteCicloId` | UUID del ciclo a operar. |
| `ubicacionArchivoId` | Id de una ubicación del catálogo. |
| `actaId` | Id de un acta de recepción (para detalle/PDF). |

Recuerda cambiar el perfil de la estación en el entorno:
`usuarioExterno = archivo-01`, `usuarioRol = archivo`.
