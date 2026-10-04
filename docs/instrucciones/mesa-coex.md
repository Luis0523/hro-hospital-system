# Mesa COEX — Recepción y devolución de expedientes (Enfermería)

> **Nombre corto de la vista:** **Mesa COEX**
> **Módulo sugerido:** `frontend/src/modules/coex/` · **Ruta sugerida:** `/coex`
> **Rol:** `enfermeria` (estación de Consulta Externa)
> **Backend:** `https://hro-hospital-api.fly.dev/api/v1` (desplegado, modo **mock** por cabeceras)
> **Documento de contrato base:** [`docs/MODULO_ARCHIVO.md`](../MODULO_ARCHIVO.md)

Este documento es una **guía de implementación** para el/la compañero/a de frontend que
construirá la vista "Mesa COEX". Incluye el **por qué**, el **flujo**, y el **detalle de las
rutas del backend** a consumir.

---

## 1. Por qué existe esta vista (contexto)

Hoy el **expediente físico** recorre un camino largo durante la jornada:

```
Archivo  →  búsqueda  →  entrega  →  COEX / Enfermería  →  atención  →  devolución  →  Archivo
```

El **módulo de Archivo** ya digitalizó la mitad del recorrido (rastreo tipo "paquete": buscar,
localizar, despachar). Pero **el otro extremo —la estación de enfermería— aún no confirma
digitalmente**:

- No hay registro digital de **cuáles expedientes se recibieron** ni de **cuáles se devolvieron**.
- El personal **compara a mano** lo físico contra un listado y **firma en papel**.
- Cuando un expediente no regresa, **no se sabe en qué punto se perdió**.
- Los conteos (recibidos/devueltos) son manuales y propensos a error.

### Qué resuelve "Mesa COEX"

Le da a la estación de enfermería una pantalla para **recibir y devolver expedientes con un
checklist virtual**, dejando **trazabilidad completa** y generando el **PDF firmado** de
recibido. Así:

1. El expediente se sigue como un **paquete** de punta a punta (Archivo ↔ Enfermería).
2. Al recibir, **N pacientes quedan marcados** y se descarga la hoja de control **ENVIADO/RECIBIDO**.
3. Al devolver, se registra el **checklist de retorno** y el ciclo queda listo para que Archivo
   lo archive en su ubicación.
4. Cualquier faltante se detecta de inmediato (lo físico vs. lo digital).

> **Idea clave:** el frontend **no calcula estados ni reglas**. El backend es la fuente de
> verdad; la vista **solo muestra y dispara transiciones** válidas.

---

## 2. Flujo funcional (3 pasos)

La vista tiene exactamente **tres momentos**, y todos trabajan sobre el **ciclo de la cita**
(no sobre "el expediente" en abstracto).

### Paso 1 — "Dar/ver las tarjetas" (el lote del día)

La estación ve el **lote de expedientes** que Archivo está preparando/entregando para su área
en la fecha. Es **lectura**:

- Archivo ya escaneó las tarjetas y creó los **ciclos** (estados `pendiente_localizar`,
  `en_busqueda`, `localizado`, `en_transito_entrega`).
- Enfermería ve ese listado, **cuántos son** y en qué estado va cada uno.

> Si más adelante se requiere que Enfermería **registre** la entrega de tarjetas (un alta),
> sería un **endpoint nuevo** de backend (ver §7 "Pendientes").

### Paso 2 — Recibir expedientes (checklist + PDF)

Cuando Archivo **despacha** (`en_transito_entrega`), la estación:

1. Compara lo físico contra la lista.
2. Marca en un **checklist** cada expediente recibido.
3. Al confirmar, **cada expediente** pasa a `entregado`.
4. Genera/descarga el **PDF de recibido** (hoja con columnas **ENVIADO / RECIBIDO** y firmas).

### Paso 3 — Devolver expedientes (checklist)

Terminada la atención, la estación:

1. Marca el **checklist de devolución**.
2. Al confirmar, **cada expediente** pasa a `en_transito_retorno`.
3. Luego **Archivo** los recibe y los archiva (fin del ciclo).

### Máquina de estados (valores exactos)

```
pendiente_localizar → en_busqueda → localizado → en_transito_entrega → entregado
       │                                                                    │
       └── no_localizado  ◄── (incidencia)                                 │
                                                                            ▼
                                       archivado ◄── en_transito_retorno ◄──┘
```

| Estado | Significado |
|---|---|
| `pendiente_localizar` | Ciclo creado, aún no se busca. |
| `en_busqueda` | Archivo buscando el expediente. |
| `localizado` | Encontrado, listo para despachar. |
| `en_transito_entrega` | En camino a COEX. **→ recepción** |
| `entregado` | Recibido por enfermería (en uso). **→ devolución** |
| `en_transito_retorno` | De regreso a Archivo. |
| `archivado` | Guardado en su ubicación. **Fin.** |
| `no_localizado` | No encontrado (no terminal). |

**Responsabilidad por transición:** Archivo = `iniciar-busqueda`, `localizar`, `despachar`,
`archivar`, `no-localizado`. **Enfermería = `entregar`, `retornar`.**

---

## 3. Cabeceras y autenticación

El backend desplegado está en **modo mock**: la identidad se resuelve por cabeceras (no hay
login aún). El cliente Axios compartido (`shared/api/client.js`) ya las envía desde
`localStorage`:

| Cabecera | Valor sugerido |
|---|---|
| `X-Usuario-Id` | `enfermeria-01` |
| `X-Usuario-Rol` | `enfermeria` |
| `X-Usuario-Nombre` | Nombre visible |
| `X-Estacion-Id` | Id de la estación (para filtrar por área) |

En desarrollo, fijar en `frontend/.env`:
```
VITE_BACKEND_URL=https://hro-hospital-api.fly.dev
VITE_USUARIO_ID=enfermeria-01
VITE_USUARIO_ROL=enfermeria
VITE_USUARIO_NOMBRE=Enfermería COEX
```

> **Importante:** las transiciones de enfermería (`entregar`/`retornar`) exigen el rol
> `enfermeria` (o `archivo`/`administrador`). Con otro rol la respuesta es **403**.

Todas las respuestas vienen envueltas en `ApiResponse`:
```json
{ "timestamp": "...", "success": true, "message": "...", "data": { } }
```

---

## 4. Rutas del backend (detalle)

Base: `{{baseUrl}} = https://hro-hospital-api.fly.dev/api/v1`

### 4.1 Listar el lote / la cola de trabajo

```http
GET /expediente-ciclos?fecha=YYYY-MM-DD&subespecialidadId=&estado=
X-Usuario-Rol: enfermeria
X-Estacion-Id: 3
```
- Devuelve `ApiResponse<List<ExpedienteCicloResponseDTO>>`.
- `fecha`: fecha de la cita (por defecto, el backend no filtra si se omite; **enviar siempre**).
- `subespecialidadId`: filtra por área específica.
- **Si se omite `subespecialidadId`, el backend filtra por las áreas de la estación** enviada en
  `X-Estacion-Id`. (Ver `MODULO_ARCHIVO.md` / SCRUM-199.)
- `estado`: opcional (p. ej. `en_transito_entrega`).

**`ExpedienteCicloResponseDTO`:**
```json
{
  "id": "a1b2…-uuid",
  "expedienteId": "3f1c…-uuid",
  "numeroExpediente": "EXP-001234",
  "paciente": { "id": "9b2a…-uuid", "nombres": "María", "apellidos": "López", "dpi": "2984…" },
  "citaId": 4821,
  "estadoActual": "en_transito_entrega",
  "version": 3,
  "creadoEn": "2026-10-06T08:00:00",
  "actualizadoEn": "2026-10-06T08:40:00",
  "movimientos": [
    {
      "id": 91,
      "estadoAnterior": "localizado",
      "estadoNuevo": "en_transito_entrega",
      "ubicacionOrigen": { "id": 12, "pasillo": "B", "estante": "14", "balda": "3" },
      "ubicacionDestino": null,
      "usuarioId": 5,
      "usuarioNombre": "Operador Archivo",
      "observacion": "Despachado a COEX",
      "fechaMovimiento": "2026-10-06T08:40:00"
    }
  ]
}
```

### 4.2 Detalle + timeline de un ciclo

```http
GET /expediente-ciclos/{id}
```
Devuelve el ciclo con su `movimientos[]` (los "checkpoints" del paquete). Útil para el detalle.

### 4.3 Recibir un expediente (checklist de recepción)

```http
POST /expediente-ciclos/{id}/entregar
Content-Type: application/json
X-Usuario-Rol: enfermeria

{ "observacion": "Recibido por enfermería COEX" }
```
- Transición `en_transito_entrega → entregado`.
- Cuerpo **opcional**.
- Devuelve el `ExpedienteCicloResponseDTO` actualizado.
- **400** si el estado actual no es `en_transito_entrega`; **403** si el rol no autoriza.

### 4.4 Devolver un expediente (checklist de devolución)

```http
POST /expediente-ciclos/{id}/retornar
Content-Type: application/json
X-Usuario-Rol: enfermeria

{ "observacion": "Atención finalizada" }
```
- Transición `entregado → en_transito_retorno`.
- Cuerpo **opcional**. Devuelve el ciclo actualizado.

### 4.5 Marcar incidencia (no localizado)

```http
POST /expediente-ciclos/{id}/no-localizado
Content-Type: application/json

{ "observacion": "No estaba en la ubicación registrada" }
```
- **Requiere `observacion`** (si falta → 400). Se puede reintentar con
  `POST /expediente-ciclos/{id}/reintentar-busqueda`.

### 4.6 Listado de expedientes que salen (para el PDF de recibido)

```http
GET /archivo/salida?fecha=YYYY-MM-DD
```
```json
{
  "fecha": "2026-10-06",
  "total": 60,
  "items": [
    {
      "expedienteId": "3f1c…-uuid",
      "numeroExpediente": "EXP-001234",
      "pacienteNombre": "María López",
      "citaId": 4821,
      "subespecialidadNombre": "Medicina General",
      "horaEstimada": "08:30:00",
      "estadoActual": "en_transito_entrega"
    }
  ]
}
```
Referencia: estados `localizado` y `en_transito_entrega`.

### 4.7 PDF de recibido (hoja ENVIADO / RECIBIDO)

```http
GET /archivo/salida/pdf?fecha=YYYY-MM-DD
```
- Respuesta binaria: `Content-Type: application/pdf`.
- Contiene: encabezado, **espacios para logos**, columnas **ENVIADO / RECIBIDO**, líneas de
  **firma** (Entrega – Archivo / Recibe – COEX-Enfermería), fecha, total y usuario generador.
- En el frontend, descargar con `responseType: 'blob'` y disparar la descarga (ver
  `frontend/src/modules/archivo/utils/descargarBlob.js`).

### 4.8 Resumen del día (opcional, para encabezado de la vista)

```http
GET /archivo/resumen?fecha=YYYY-MM-DD
GET /archivo/resumen/pdf?fecha=YYYY-MM-DD
```
Indicadores: total de ciclos, pendientes, en búsqueda, localizados, en tránsito, entregados,
archivados, no localizados, expedientes nuevos.

---

## 5. Diseño y componentes (basarse en el módulo de Archivo)

**Objetivo:** misma identidad visual y patrones que
`frontend/src/modules/archivo/`. Reutilizar lo que ya existe:

| Referencia | Uso |
|---|---|
| `frontend/src/modules/archivo/components/ArchivoLayout.jsx` | Header + navbar del área. |
| `.../ListadoCompactoExpediente.jsx` | Fila con checkbox (recepción/devolución). |
| `.../ResumenEstados.jsx` | Barra de resumen por estado. |
| `.../ScannerExpediente.jsx` | Búsqueda/escaneo por código (opcional en esta vista). |
| `.../FiltrosArchivo.jsx` | Filtro por fecha / área. |
| `.../ExpedienteStepper.jsx` | Línea de tiempo del ciclo (detalle). |
| `frontend/src/shared/components/ui/*` | `Button`, `Input`, `Select`, `Card`, `Alert`, `EmptyState`, `Spinner`, `Modal`, `Icon`, `Toast`. |
| `frontend/src/index.css` | Tokens de color (`bg-surface`, `text-on-surface`, `primary`, `outline-variant`, …). |

Referencia visual del módulo: **`docs/mockups/archivo/DESIGN.md`**.

**Reglas de UI**
- **Mobile-first** y usable en escritorio (la estación puede tener varias pantallas).
- Checkbox por expediente + **"seleccionar todo"**; acción masiva = **N llamadas** (una por
  ciclo) o, si se prefiere, incremental con feedback por fila.
- Estados de **carga / error / vacío** con los componentes compartidos.
- Mostrar `numeroExpediente`, paciente, área y `estadoActual` con `EstadoBadge`.
- No calcular estados: solo habilitar el botón cuando `estadoActual` corresponda.
- Tras cada transición, refrescar (`GET /expediente-ciclos?fecha=`) o tomar el DTO devuelto.

**Secciones sugeridas**
1. **Encabezado:** nombre de la estación + fecha.
2. **Resumen del día** (recibidos / pendientes / devueltos).
3. **Pendientes de recibir** (`en_transito_entrega`) → botón "Recibir".
4. **En uso** (`entregado`) → botón "Devolver".
5. **Acciones:** "Descargar PDF de recibido" (usa §4.7).

---

## 6. Criterios de aceptación

- [ ] El listado respeta **fecha** y **área** (por `subespecialidadId` o por `X-Estacion-Id`).
- [ ] Solo se muestran transiciones válidas según `estadoActual`.
- [ ] "Recibir" envía `POST /expediente-ciclos/{id}/entregar` y refresca.
- [ ] "Devolver" envía `POST /expediente-ciclos/{id}/retornar` y refresca.
- [ ] Se puede descargar el **PDF de recibido** (`/archivo/salida/pdf`).
- [ ] Manejo de `400` (transición inválida), `403` (rol), `404`, `409` con mensajes claros.
- [ ] Responsive (móvil, tablet, escritorio) y accesible por teclado.
- [ ] Pruebas con Vitest + Testing Library; `npm run lint` y `npm run build` sin errores nuevos.

---

## 7. Pendientes / coordinación con backend

1. **PDF de devolución.** Hoy existe el PDF de salida/traspaso (§4.7, ENVIADO/RECIBIDO). Para
   una constancia **separada de devolución** se requiere un endpoint nuevo
   (p. ej. `GET /archivo/devolucion/pdf?fecha=`). Mientras tanto, reutilizar el mismo documento
   o el **acta de recepción** (`GET /actas-recepcion/{id}/pdf`).
2. **Registrar entrega de tarjetas (paso 1).** Si Enfermería debe *dar de alta* el lote en vez de
   solo verlo, hace falta un endpoint nuevo. Por ahora el paso 1 es **lectura**.
3. **Acción masiva (bulk).** No hay endpoint de lote; el checklist envía una llamada por ciclo.

---

## 8. Referencias

- `docs/MODULO_ARCHIVO.md` — contrato completo del módulo Archivo.
- `docs/ACTUALIZACION_ARCHIVO_FRONTEND.md` — resumen de contratos disponibles.
- `docs/mockups/archivo/DESIGN.md` — referencia visual.
- `frontend/src/modules/archivo/` — implementación de referencia.
