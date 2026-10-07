# Backend — Endpoints del Dashboard de Archivo

> **Para:** quien construye el Dashboard de Archivo (SCRUM-237…242) y su capa de datos.
> **Estado:** implementado en el backend y probado en local. Mapea directo al contrato
> propuesto en `docs/instrucciones/dashboard-archivo.md` §6.2 y §8.2.
> **Base URL (context-path):** `/api/v1`
> - Desplegado (Fly): `https://hro-hospital-api.fly.dev/api/v1`
> - Local: `http://localhost:8081/api/v1`
> **Auth (modo mock):** cabeceras `X-Usuario-Id`, `X-Usuario-Rol`, `X-Estacion-Id`
> (las agrega `src/shared/api/client.js` automáticamente). En modo Keycloak: `Authorization: Bearer`.
> **Envoltura:** todas las respuestas van en `ApiResponse`:
> `{ timestamp, success, codigo, message, data }` → consumir `respuesta.data` (el cliente axios ya devuelve el body; usar `respuesta.data`).

---

## 1. Endpoints disponibles

### 1.1 `GET /archivo/estadisticas` ✅ (nuevo)
Estadísticas del rango para el panel de indicadores, distribución, flujo, serie y permanencia.

**Query params** (todos opcionales):
| Param | Tipo | Notas |
|---|---|---|
| `desde` | `YYYY-MM-DD` | Por defecto: hoy |
| `hasta` | `YYYY-MM-DD` | Por defecto: `desde` |
| `subespecialidadId` | number | Filtra por unidad/área |

**Respuesta `data` → `EstadisticasArchivoDTO`:**
```json
{
  "rango": { "desde": "2026-10-01", "hasta": "2026-10-07" },
  "totales": {
    "totalCiclos": 34,
    "expedientesNuevos": 8,
    "noLocalizado": 2,
    "archivado": 5,
    "entregado": 12,
    "enTransito": 4
  },
  "porEstado": [
    { "estado": "pendiente_localizar", "total": 3 },
    { "estado": "en_busqueda", "total": 5 },
    { "estado": "localizado", "total": 2 },
    { "estado": "en_transito_entrega", "total": 4 },
    { "estado": "entregado", "total": 12 },
    { "estado": "en_transito_retorno", "total": 0 },
    { "estado": "archivado", "total": 5 },
    { "estado": "no_localizado", "total": 2 }
  ],
  "serieDiaria": [
    { "fecha": "2026-10-07", "transiciones": 34, "ciclosNuevos": 8, "noLocalizado": 1 }
  ],
  "porUnidad": [
    { "subespecialidadId": 2, "nombre": "Pediatría General", "total": 9, "noLocalizado": 1 }
  ],
  "permanencia": [
    { "estado": "en_busqueda", "minutosPromedio": 42 }
  ]
}
```
Notas:
- `porEstado` **siempre** viene con los 8 estados en orden (`pendiente_localizar → … → archivado → no_localizado`), con `0` si no hay.
- `no_localizado` va al final (excepción).
- `permanencia` es el promedio (minutos) entre entrar y salir de cada estado, sobre los ciclos del rango.
- `totales.expedientesNuevos` = expedientes físicos creados en el rango.

### 1.2 `GET /archivo/movimientos` ✅ (nuevo)
Bitácora paginada de movimientos del ciclo (tabla + base del feed).

**Query params:**
| Param | Tipo | Notas |
|---|---|---|
| `desde` | `YYYY-MM-DD` | Por defecto: hoy |
| `hasta` | `YYYY-MM-DD` | Por defecto: `desde` |
| `estado` | string | Filtra por **estado nuevo** (transición a ese estado) |
| `page` | number | Base 0, por defecto `0` |
| `size` | number | Por defecto `20` (máx. 200) |

**Respuesta `data` → `Page<EventoMovimientoDTO>`** (formato Spring `Page`):
```json
{
  "content": [
    {
      "id": 128,
      "expedienteId": "7f2c…",
      "numeroExpediente": "EXP-2024-035",
      "pacienteNombre": "María Fernanda López García",
      "estadoAnterior": "en_busqueda",
      "estadoNuevo": "localizado",
      "usuarioNombre": "Personal de Archivo",
      "observacion": null,
      "fechaMovimiento": "2026-10-07T10:20:31.123-06:00"
    }
  ],
  "totalElements": 1,
  "totalPages": 1,
  "size": 20,
  "number": 0,
  "first": true,
  "last": true
}
```

### 1.3 `GET /archivo/resumen?fecha=YYYY-MM-DD` ✅ (ya existía)
Resumen operativo **de un día**. Úsalo para la tarjeta "hoy".
`data`:
```json
{
  "fecha": "2026-10-07",
  "totalCiclos": 34, "pendienteLocalizar": 3, "enBusqueda": 5, "localizado": 2,
  "enTransitoEntrega": 4, "enTransitoRetorno": 0, "enTransito": 4,
  "entregado": 12, "archivado": 5, "noLocalizado": 2, "expedientesNuevos": 8
}
```

### 1.4 `GET /archivo/resumen/pdf?fecha=YYYY-MM-DD` ✅ (ya existía)
Devuelve binario `application/pdf` (sin envoltura `ApiResponse`). Pedir con `responseType: 'blob'`.

### 1.5 `GET /archivo/salida?fecha=` y `GET /archivo/salida/pdf?fecha=` ✅ (ya existían)
Listado/documento de expedientes que salen del Archivo (localizados / en tránsito de entrega).

---

## 2. Tiempo real (WebSocket)

- **Endpoint STOMP/SockJS:** `/api/v1/ws-turnos` (SockJS requiere `http/https`).
- Cliente del repo: `crearClienteTurnos` de `src/shared/ws/turnosSocket.js`.

**Topics y formas:**

| Topic | Emite | Cuándo |
|---|---|---|
| `/topic/archivo/movimientos` | `EventoMovimientoDTO` (misma forma que §1.2) | En **cada transición de un ciclo** de expediente (Archivo) |
| `/topic/archivo` | `CarnetResponseDTO` (evento de **carnet**, Fase 1) | Al registrar un carnet y en cada transición de carnet |
| `/topic/estacion/{estacionId}` | `CarnetResponseDTO` | Transición de carnet de esa estación |

Recomendación para el Dashboard: **suscribirse a `/topic/archivo/movimientos`** para el feed de bitácora (forma `EventoMovimientoDTO`). **No** suscribirse a `/topic/tablero` (es de turnos).

> Si en Fase 1 no hay ciclos aún, el feed recibirá poco o nada; el dashboard trabaja mock-first. Al integrar citas (Fase 2), este topic empezará a emitir.

---

## 3. Correspondencia con el contrato propuesto del doc de dashboard

| Doc dashboard (§6.3) | Endpoint real | Estado |
|---|---|---|
| `obtenerEstadisticasArchivo({desde,hasta,subespecialidadId})` | `GET /archivo/estadisticas` | ✅ implementado |
| `listarMovimientosArchivo({desde,hasta,estado,page,size})` | `GET /archivo/movimientos` | ✅ implementado |
| `obtenerResumenArchivo({fecha})` | `GET /archivo/resumen` | ✅ ya existía |
| `obtenerResumenArchivoPdf({fecha})` | `GET /archivo/resumen/pdf` | ✅ ya existía |
| Feed en vivo `/topic/archivo` | `/topic/archivo/movimientos` | ✅ implementado |

Los endpoints de §1.1 y §1.2 ya **no** deben ir detrás de `pendienteBackend`; el resto siguen igual.

---

## 4. Notas y reglas

- Fechas sin hora: `desde`/`hasta` son inclusivos por día (`hasta` incluye todo el día).
- Envelope: siempre leer `respuesta.data`.
- Volumen: `size` máximo 200.
- Estados: usar `ordena`/etiquetas del frontend (`estadosExpediente.js`); el backend devuelve las claves crudas.
- El backend es la fuente de verdad: no recalcular negocio en el frontend.
