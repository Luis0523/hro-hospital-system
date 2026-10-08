# Instrucciones — Dashboard de administración de la Estación de Archivo

**Área:** Estación de Archivo (seguimiento de expedientes físicos)
**Tipo de trabajo:** Frontend exclusivamente (React + Vite + Tailwind + JavaScript/JSX)
**Responsable sugerido:** Fernanda López (ver tareas en Jira, épica nueva)
**Fecha objetivo:** viernes 9 de octubre de 2026
**Rama de trabajo:** `integracion-circuito-archivo`
**Ubicación del entregable:** `frontend/src/modules/archivo/` (nueva sección `dashboard`)

> Este documento es la instrucción de trabajo. Es la fuente de verdad del alcance, la
> arquitectura y los criterios de aceptación del nuevo dashboard. Complementa —no
> reemplaza— `docs/MODULO_ARCHIVO.md` (contrato del ciclo de expedientes) y el
> `frontend/src/modules/administracion/AGENTS.md` (reglas del panel administrativo).

> **Actualización (backend disponible).** El backend del dashboard **ya está implementado
> y desplegado** (ver `docs/instrucciones/dashboard-archivo-backend.md` y
> `ArchivoDashboardController/Service`). Por tanto:
>
> - `GET /archivo/estadisticas` y `GET /archivo/movimientos` **YA EXISTEN**: en modo real
>   se consumen directamente y **NO** deben ir detrás de `pendienteBackend`.
> - El feed en vivo se suscribe a **`/topic/archivo/movimientos`** (`EventoMovimientoDTO`),
>   **no** a `/topic/archivo`.
> - El enfoque mock-first se conserva **solo** para tests y modo offline
>   (`VITE_USE_MOCK` ausente/`true`); con `VITE_USE_MOCK=false` se usa el backend real.

---

## 0. Advertencia previa: el `AGENTS.md` de la raíz está desactualizado

El `AGENTS.md` de la raíz describe una rama de enfermería con módulos "placeholder".
**Eso ya no es cierto en esta rama.** Antes de empezar, asume el estado real:

- Rama activa: `integracion-circuito-archivo`.
- `src/modules/archivo/` ya está **completo**: páginas operativas, API, mocks, hooks,
  mapeadores y pruebas.
- `src/modules/administracion/` está cerrado ("Fase 10") y es la referencia visual y
  de patrones para cualquier "dashboard administrativo".
- `src/modules/tablero/`, `src/modules/coex/`, `src/modules/carnets/` también existen.

**Consecuencia práctica:** no inventes estructura desde cero. Copia los patrones que ya
existen en `archivo` y `administracion`. El dashboard nuevo es una sección **más** del
módulo `archivo`, no un proyecto aparte.

---

## 1. Objetivo

Construir un **Dashboard de administración de la Estación de Archivo** que permita al
personal responsable de archivo:

1. Ver **estadísticas** de la operación de expedientes (del día, por rango de fechas y
   por unidad/subespecialidad).
2. Ver **cómo se mueven los expedientes entre estados en tiempo real** (entradas,
   transiciones y alertas), con un flujo visual del ciclo y una bitácora en vivo.
3. Detectar **excepciones** (expedientes `no_localizado`, ciclos estancados) de forma
   inmediata.

La interfaz debe ser **parecida a los dashboards administrativos existentes**
(tarjetas de indicadores, alertas explicativas, tablas), respetando los tokens de tema
claro/oscuro del proyecto.

### 1.1 Fuera de alcance (explícito)

- **NO** implementar las secciones placeholder `/archivo/depuracion` ni
  `/archivo/salidas-externas`. Quedan como están.
- **NO** tocar el backend ni la base de datos (no existe en esta rama).
- **NO** implementar la pantalla operativa `/archivo` (`ArchivoPage`) ni sus acciones
  de transición. El dashboard es **observación y análisis**, no operación de campo.
- **NO** introducir una segunda instancia de Axios ni una librería de gráficas nueva sin
  aprobación (ver §7.4 "Gráficas").
- **NO** implementar reglas de negocio en el frontend: el dashboard **refleja** lo que
  devuelve el backend (o el mock que imita su contrato).

---

## 2. Estado actual relevante del repositorio

Rutas y archivos que debes conocer (rutas relativas a `frontend/`):

| Qué | Ruta | Notas |
| :--- | :--- | :--- |
| Router | `src/router/AppRouter.jsx` | Bloque `RutaPorRol area="archivo"` en las líneas ~83-87. Ahí se registran `/archivo`, `/archivo/depuracion`, `/archivo/salidas-externas`. |
| Guard de rol | `src/router/RutaPorRol.jsx` | Solo aplica en modo keycloak; en mock deja pasar. |
| Layout de Archivo | `src/modules/archivo/components/ArchivoLayout.jsx` | Envuelve cada página, aplica identidad de estación y monta headernavbar. **Reutilízalo.** |
| Navbar de Archivo | `src/modules/archivo/components/ArchivoNavbar.jsx` | Arreglo `SECCIONES_ARCHIVO` (líneas 13-21). **Agrega aquí la entrada del dashboard.** |
| Identidad de estación | `src/modules/archivo/identidadArchivo.js`, `hooks/useIdentidadEstacionArchivo.js` | Establece `X-Usuario-Rol: archivo` automáticamente. No lo dupliques. |
| Estados del ciclo | `src/modules/archivo/estadosExpediente.js` | `ESTADOS_EXPEDIENTE`, `ORDEN_ESTADOS`, `metadatosEstado(estado)`. **Es la única fuente de etiquetas/colores de estado. No crees otro diccionario.** |
| Acciones por estado | `src/modules/archivo/accionesArchivo.js` | `accionesParaEstado`, `mensajeSinAccion`. Referencia para leer el ciclo (solo lectura en el dashboard). |
| API de Archivo | `src/modules/archivo/api/archivoApi.js` | Expone `USANDO_DATOS_MOCK`, `obtenerResumenArchivo`, `obtenerResumenArchivoPdf`, `listarJornadaArchivo`… **`USE_MOCK`, `desenvolver` y `pendienteBackend` son locales y NO se exportan**: el archivo hermano debe declarar sus propios helpers (o exportarlos antes de reutilizarlos). |
| Mappers | `src/modules/archivo/api/archivoMappers.js` | `mapearMovimientoCiclo`, `mapearCiclo`, `mapearJornadaArchivo`. Reutiliza. |
| Mocks | `src/modules/archivo/api/mockData.js` | `resumenArchivoMock`, `jornadaArchivoMock`, `expedientesMock`… Base para los mocks del dashboard. |
| Resumen existente | `src/modules/archivo/components/ResumenEstados.jsx` | Componente de indicadores del día en `ArchivoPage`. Buen punto de partida visual. |
| Referencia administrativa | `src/modules/administracion/pages/DashboardPage.jsx` + `components/TarjetaIndicador.jsx` | Estilo de dashboard admin: `Alert` de aviso + grid de tarjetas. **Imita esta estructura.** |
| Mockup visual | `docs/mockups/panelAdmin/panel_administrador_dashboard/{code.html,screen.png}` | Referencia de composición de un dashboard administrativo. |
| Cliente HTTP | `src/shared/api/client.js` | Única instancia de Axios; añade cabeceras `X-Usuario-*` y `X-Estacion-Id`. |
| UI kit | `src/shared/components/ui/` (`index.js`) | `Button, Input, Select, Card, EstadoBadge, Modal, Alert, EmptyState, Spinner, Table, Icon, Toast`. |
| WebSocket | `src/shared/ws/turnosSocket.js` (`crearClienteTurnos`) y `src/modules/tablero/api/tableroSocket.js` | Patrón STOMP/SockJS. Para el dashboard, el topic es **`/topic/archivo/movimientos`** (`EventoMovimientoDTO`); `/topic/archivo` y `/topic/estacion/{id}` emiten eventos de **carnet**. |
| Contextos | `src/shared/context/` | `useAuth`, `useToast`, `useTema`, `useAcceso`, `useEstacion`. |
| Tema | `src/shared/context/ThemeContext.jsx`, `src/index.css`, `tailwind.config.js` | `darkMode: 'class'`; colores como variables CSS (`bg-surface`, `text-on-surface`, `border-outline-variant`…). |

---

## 3. Dónde vive el dashboard

### 3.1 Ruta

Nueva ruta dentro del bloque `area="archivo"` de `src/router/AppRouter.jsx`:

```jsx
<Route path="/archivo/dashboard" element={<DashboardArchivoPage />} />
```

Reglas:

- Debe quedar **dentro** del `RutaPorRol area="archivo"`, junto a las otras rutas de archivo.
- No modificar el comportamiento de las rutas existentes.
- La página debe envolverse en `ArchivoLayout` (como `DepuracionExpedientesPage`), para
  heredar identidad de estación, encabezado y navbar.

### 3.2 Navegación

Agregar una entrada en `SECCIONES_ARCHIVO` (`ArchivoNavbar.jsx`), **como primera o
segunda opción** (después de "Expedientes para COEX"):

```js
{ to: '/archivo/dashboard', etiqueta: 'Dashboard', icono: 'monitoring' },
```

Usar un icono Material Symbols válido (ya está cargada la fuente). Sugeridos:
`monitoring`, `insights`, `dashboard`.

### 3.3 Nombre y lenguaje

- UI en **español**.
- Nombre de pantalla: "Dashboard de Archivo" o "Panel de Archivo".
- No usar el término "administración" de forma que se confunda con el módulo
  `/administracion`; este dashboard es de **Archivo**. Preferir "Dashboard de Archivo".

---

## 4. Backend: qué hay y qué no (clave para el enfoque mock-first)

El usuario indicó: **"no hay backend listo para conectar"**. Debes diseñar
**mock-first**, con el contrato real ya existente donde lo haya y contrato **propuesto y
marcado como pendiente** donde no.

### 4.1 Lo que SÍ existe (contrato confirmado)

`GET /archivo/resumen?fecha=YYYY-MM-DD` — resumen operativo diario. Campos:

```
totalCiclos, pendienteLocalizar, enBusqueda, localizado,
enTransitoEntrega, enTransitoRetorno, enTransito, entregado,
archivado, noLocalizado, expedientesNuevos
```

Ya está consumido por `obtenerResumenArchivo({ fecha })` en `archivoApi.js` y mockeado
por `resumenArchivoMock(fecha)`. **Reutilízalo como una de las fuentes del dashboard.**

`GET /archivo/resumen/pdf?fecha=` — PDF del resumen (ya existe `obtenerResumenArchivoPdf`).

### 4.2 Lo que YA existe en el backend (contrato confirmado)

El backend del dashboard está implementado (ver `docs/instrucciones/dashboard-archivo-backend.md`):

- `GET /archivo/estadisticas?desde=&hasta=&subespecialidadId=` → `EstadisticasArchivoDTO`
  (totales, `porEstado` [8 estados en orden], `serieDiaria`, `porUnidad`, `permanencia`).
- `GET /archivo/movimientos?desde=&hasta=&estado=&page=&size=` → `Page<EventoMovimientoDTO>`.
- Tiempo real: cada transición publica `EventoMovimientoDTO` en **`/topic/archivo/movimientos`**.
- Cobertura: estadísticas por rango, por unidad/subespecialidad, serie diaria, permanencia
  (aging) y movimientos en vivo.

**Por tanto, nada de esto se marca como `pendienteBackend`.** El mock se conserva solo para
tests y modo offline; en modo real (`VITE_USE_MOCK=false`) se consumen estos endpoints.

---

## 5. Arquitectura de archivos a crear

Mantén la estructura del módulo. Crea **solo** lo necesario; evita abstracciones
prematuras.

```
frontend/src/modules/archivo/
├── pages/
│   └── DashboardArchivoPage.jsx        # contenedor/orquestador de la página
├── components/
│   └── dashboard/
│       ├── TarjetaMetrica.jsx          # tarjeta de indicador (variante de TarjetaIndicador)
│       ├── PanelIndicadores.jsx        # grid de TarjetaMetrica
│       ├── GraficaEstados.jsx          # distribución por estado (barras)
│       ├── FlujoCiclo.jsx              # funnel/stepper ORDEN_ESTADOS
│       ├── TablaMovimientos.jsx        # bitácora reciente
│       ├── FeedTiempoReal.jsx          # stream de eventos en vivo
│       ├── FiltroDashboard.jsx         # rango de fechas + unidad/subespecialidad
│       └── IndicadorConexion.jsx       # estado del socket (en vivo / reconectando / mock)
├── api/
│   ├── dashboardArchivoApi.js          # (nuevo, ver §6.3) o extiende archivoApi.js
│   └── dashboardMock.js                # (nuevo) datos y simulación
├── hooks/
│   ├── useDashboardArchivo.js          # carga y estado del dashboard
│   └── useMovimientosArchivoStream.js  # suscripción en tiempo real (real o simulada)
└── utils/
    └── metricasArchivo.js              # cálculos de presentación (agrupar, %, orden)
```

Reglas de arquitectura:

- **Componentes presentacionales**: reciben props y emiten callbacks (`onFiltro`,
  `onRefrescar`). **No llaman a la API ni conocen `USE_MOCK`** (igual que `ColaPanel` o
  `ResumenEstados`).
- **El contenedor** (`DashboardArchivoPage.jsx`) orquesta: estado, efecto de carga,
  refresco, filtros y render de subcomponentes.
- Los **hooks** encapsulan la carga de datos y el socket. No metas `useEffect` de red
  dentro de componentes de UI.
- Imports cross-carpeta con alias `@/`; dentro del módulo, rutas relativas (`../`).
- Componentes `PascalCase.jsx`, hooks `useXxx.js`, extensión `.jsx` explícita en imports.

---

## 6. Datos: API, mocks y contrato propuesto

### 6.1 Patrón obligatorio (idéntico al resto del repo)

Al inicio de la capa de datos:

```js
const USE_MOCK = import.meta.env.MODE === 'test' || import.meta.env.VITE_USE_MOCK !== 'false'
const desenvolver = (respuesta) => respuesta?.data ?? respuesta
```

- Mock activo si es test **o** si `VITE_USE_MOCK` no es exactamente `'false'`.
- En modo real, si el endpoint no existe: `pendienteBackend('...')` (lanza error con
  `error.status = 501`), nunca silencio ni fallback inventado.
- En modo real, los errores se propagan; el contenedor los muestra con `Alert` y ofrece
  reintentar.

### 6.2 Forma de las métricas (mapeadores hacia el dominio visual)

Define en `dashboardArchivoApi.js`/`metricasArchivo.js` la normalización. Ejemplo de
objeto de estadísticas que consumirá la UI (los mocks deben devolver **exactamente esta
forma**, y los mapeadores adaptan la respuesta del backend a ella):

```js
// EstadisticasDashboard {
//   rango: { desde: 'YYYY-MM-DD', hasta: 'YYYY-MM-DD' },
//   totales: {                          // derivable de /archivo/resumen
//     totalCiclos, expedientesNuevos, noLocalizado, archivado, entregado, enTransito
//   },
//   porEstado: [                        // SIEMPRE ordenado por ORDEN_ESTADOS
//     { estado: 'pendiente_localizar', total: 12 },
//     { estado: 'en_busqueda', total: 5 },
//     ...
//   ],
//   serieDiaria: [                      // para tendencia (minigráfica o tabla)
//     { fecha: '2026-10-07', transiciones: 34, ciclosNuevos: 8, noLocalizado: 1 },
//   ],
//   porUnidad: [                        // por subespecialidad/unidad
//     { subespecialidadId: 2, nombre: 'Pediatría General', total: 9, noLocalizado: 1 },
//   ],
//   permanencia: [                      // tiempo promedio por estado (min)
//     { estado: 'en_busqueda', minutosPromedio: 42 },
//   ],
// }
```

### 6.3 Funciones de API a implementar (contrato confirmado)

En `src/modules/archivo/api/dashboardArchivoApi.js` (archivo hermano; declara sus propios
helpers `USE_MOCK`/`desenvolver`/`pendienteBackend`, que son locales en `archivoApi.js`):

```js
// GET /archivo/estadisticas?desde=&hasta=&subespecialidadId=   (CONFIRMADO)
export async function obtenerEstadisticasArchivo({ desde, hasta, subespecialidadId } = {}) { ... }

// GET /archivo/movimientos?desde=&hasta=&estado=&page=&size=    (CONFIRMADO)
export async function listarMovimientosArchivo({ desde, hasta, estado, page, size } = {}) { ... }

// Reutiliza lo existente:
export { obtenerResumenArchivo, obtenerResumenArchivoPdf } from './archivoApi.js'
```

En modo mock, delega en `dashboardMock.js`. En modo real, usa
`desenvolver(await client.get('/archivo/estadisticas' | '/archivo/movimientos', { params }))`.
`pendienteBackend(...)` queda reservado para cualquier endpoint futuro que aún no exista
(hoy: ninguno de este dashboard).

### 6.4 Mocks (`dashboardMock.js`)

- **Deterministas en test** (sin aleatoriedad no seedeada), variados en desarrollo.
- Reutiliza `expedientesMock` y `jornadaArchivoMock` de `mockData.js` para que los
  números cuadren con la pantalla operativa.
- Exporta un `DASHBOARD_MOCK` etiquetable desde la UI como "Datos simulados" (patrón
  `USANDO_DATOS_MOCK` de `archivoApi.js`).
- Incluye un **emisor de eventos simulado** para el feed de tiempo real (ver §8).

---

## 7. Diseño de la interfaz (detallado)

### 7.1 Estructura general de la página

`DashboardArchivoPage.jsx` renderiza, dentro de `ArchivoLayout`:

1. **Encabezado** — título "Dashboard de Archivo", subtítulo con la fecha/rango activo y
   botón "Actualizar" (`Button` secundario con `Icon name="refresh"`).
2. **Aviso de datos** — `Alert` (`tone="info"`) indicando el origen de los datos:
   - Mock: "Mostrando datos simulados (VITE_USE_MOCK). El backend de estadísticas aún no
     está disponible."
   - Real sin contrato: mismo mensaje pero "pendiente de contrato backend".
   - Reutiliza el enfoque de `DashboardPage.jsx` (que avisa cuando no hay endpoint).
3. **Barra de filtros** — `FiltroDashboard` (rango de fechas + unidad/subespecialidad).
4. **Panel de indicadores** — `PanelIndicadores` (grid responsive de tarjetas).
5. **Flujo del ciclo** — `FlujoCiclo` (stepper/funnel de `ORDEN_ESTADOS` con totales).
6. **Distribución por estado** — `GraficaEstados` (barras horizontales).
7. **Dos columnas (md+):**
   - Izquierda: `TablaMovimientos` (bitácora reciente paginada).
   - Derecha: `FeedTiempoReal` (stream) + `IndicadorConexion`.
8. **Excepciones** — bloque destacado con `no_localizado` y ciclos estancados
   (usa `Alert tone="warning"` o realce con los colores de `ESTADOS_EXPEDIENTE`).

Orden responsive: en móvil, todo en una columna (indicadores → flujo → distribución →
feed → tabla → excepciones).

### 7.2 Indicadores (tarjetas)

Usa una `TarjetaMetrica` propia, modelada sobre
`administracion/components/TarjetaIndicador.jsx` (título, icono, cuerpo, acción) con
`Card` e `Icon` del UI kit. Indicadores mínimos:

- **Total de ciclos** del rango (`totalCiclos`).
- **Expedientes nuevos** (`expedientesNuevos`).
- **Pendientes de localizar** (`pendienteLocalizar`).
- **En búsqueda / En tránsito** (`enBusqueda` + `enTransito`).
- **Entregados** (`entregado`).
- **Archivados** (`archivado`).
- **No localizados** (`noLocalizado`) — resaltado como **excepción** (rojo).
- **Tiempo promedio de localización** (derivado de `permanencia`), si el mock lo provee.

Cada tarjeta: etiqueta, valor grande (`text-metric-display`), icono y, opcionalmente,
variación vs. período anterior (solo si el contrato lo permite; si no, omitir).

### 7.3 Colores de estado

**Prohibido** crear un segundo diccionario de estados. Usa
`metadatosEstado(estado)` de `estadosExpediente.js` para obtener `{ etiqueta, color,
punto, icono, excepcion }`. El orden visual es siempre `ORDEN_ESTADOS`
(más `no_localizado` en el bloque de excepciones, nunca mezclado en la secuencia normal).

> Nota: `shared/components/ui/EstadoBadge.jsx` mapea estados de **citas/turnos**, no los
> del ciclo de expediente. Para el ciclo usa una insignia propia basada en
> `metadatosEstado`.

### 7.4 Gráficas

Sin librería nueva (restricción de alcance). Implementa las visualizaciones con
**HTML + Tailwind**:

- **Barras horizontales** (`GraficaEstados`): ancho proporcional al máximo; color de
  `metadatosEstado`. Accesible (`role="img"` + `aria-label` con el detalle, o lista con
  cifras visibles).
- **Flujo del ciclo** (`FlujoCiclo`): secuencia de "píldoras" conectadas según
  `ORDEN_ESTADOS`, cada una con su total. No es un stepper interactivo: es lectura.
- **Tendencia diaria** (`serieDiaria`): tabla compacta o minicolumnas; si complica, tabla.

Si consideras necesaria una librería de gráficas, **deténte y solicita aprobación**
(no la instales por iniciativa propia).

### 7.5 Tabla de movimientos

`TablaMovimientos` usando el `Table` del UI kit o una lista semántica:

- Columnas: **Fecha/hora**, **Expediente** (`numeroExpediente`), **Paciente**,
  **Transición** (`estadoAnterior → estadoNuevo` con los colores de estado),
  **Usuario** (`usuarioNombre`), **Observación** (truncada, con `title`).
- Paginación o "cargar más" (respeta `page`/`size` del contrato propuesto).
- Estado vacío con `EmptyState`.
- En móvil, degradar a tarjetas (patrón ya usado en `administracion`: cards bajo `xl`).

Reutiliza `mapearMovimientoCiclo` de `archivoMappers.js` si la forma coincide
(`estadoAnterior/Nuevo`, `usuarioNombre`, `observacion`, `fechaMovimiento`).

### 7.6 Feed de tiempo real

`FeedTiempoReal`: lista acotada (p. ej. últimos 20 eventos) que antepone cada evento
nuevo con una breve animación de entrada. Cada evento muestra: hora, expediente,
transición y usuario. `IndicadorConexion` muestra el estado: **En vivo**, **Reconectando**
o **Simulado (mock)**.

### 7.7 Accesibilidad

- Cada tarjeta/indicador con `aria-label` legible ("Total de ciclos: 34").
- Barras y flujo con alternativa textual (cifras siempre visibles).
- Contraste correcto en claro y oscuro (usar tokens, no colores crudos).
- Navegación por teclado en filtros y botón "Actualizar" (foco visible con
  `focus-visible:outline-*`).
- `aria-live="polite"` en el contenedor del feed para anunciar eventos nuevos sin
  interrumpir.

---

## 8. Tiempo real (mock-first)

El objetivo es dejar **lista la estructura** para conectar el WebSocket real después,
sin depender de él ahora.

### 8.1 Hook `useMovimientosArchivoStream`

Firma sugerida:

```js
const { eventos, estado, reconectar } = useMovimientosArchivoStream({
  topic,          // '/topic/archivo/movimientos' (confirmado)
  habilitado,     // true; en mock se usa el emisor simulado
})
// estado: 'en_vivo' | 'reconectando' | 'simulado' | 'detenido'
```

Comportamiento:

- **Modo real**: usar `crearClienteTurnos({ topics:['/topic/archivo/movimientos'],
  onMensaje, onConectado, onDesconectado, onError })` de `src/shared/ws/turnosSocket.js`;
  `activate()` al montar, `deactivate()` al desmontar. Parsear el mensaje y normalizarlo
  con el mapeador de movimientos. El contrato ya está confirmado.
- **Modo mock**: **no** crear socket. Usa un emisor simulado en `dashboardMock.js` que
  produzca eventos plausibles (de los expedientes de `expedientesMock`) cada pocos
  segundos, con `estado: 'simulado'`.
- **Limpieza obligatoria**: cancelar timer/socket en el cleanup del `useEffect`.
- **No** suscribirse a `/topic/tablero` (es de turnos, no de archivo).

### 8.2 Evento normalizado (forma única)

```js
// EventoMovimiento {
//   id, expedienteId, numeroExpediente, pacienteNombre,
//   estadoAnterior, estadoNuevo, usuarioNombre, observacion,
//   fechaMovimiento // ISO
// }
```

El feed y la tabla consumen **esta misma forma**, venga de mock o de socket.

---

## 9. Estados del ciclo (referencia para leer datos)

No los redefinas; consúmelos de `estadosExpediente.js`. Secuencia normal
(`ORDEN_ESTADOS`):

```
pendiente_localizar → en_busqueda → localizado → en_transito_entrega
→ entregado → en_transito_retorno → archivado
```

Excepción: `no_localizado` (no terminal, se puede reintentar). No es parte de la
secuencia normal y va en el bloque de excepciones. `sin_ciclo` **no** es estado del
ciclo (es de la jornada); trátalo, si aparece, como "aún sin ciclo", no como un paso del
flujo.

(Detalle completo en `docs/MODULO_ARCHIVO.md` §3.)

---

## 10. Tema, diseño y responsive

- **Tokens obligatorios**: `bg-surface`, `bg-surface-container-lowest`,
  `text-on-surface`, `text-on-surface-variant`, `border-outline-variant`,
  `bg-primary-container`, `shadow-card`, `text-metric-display`, tipografías
  `text-headline-*`, `text-title-*`, `text-body-*`, `text-label-*`.
- **Tema claro/oscuro**: verifica ambas variantes (`.dark`). Botón de tema ya está en
  `ArchivoNavbar`; no lo dupliques.
- **Responsive**: grid `grid-cols-1 sm:grid-cols-2 xl:grid-cols-4` para indicadores;
  dos columnas del bloque inferior solo en `lg+`; tablas → tarjetas en móvil.
- No usar colores crudos (p. ej. `bg-blue-500`) salvo en los colores de estado, que ya
  vienen definidos en `estadosExpediente.js` con sus variantes `dark:`.

---

## 11. Pruebas y validación

### 11.1 Pruebas (Vitest + Testing Library)

Crea pruebas co-locadas `*.test.jsx` / `*.test.js`:

- `DashboardArchivoPage.test.jsx`: carga en mock, muestra indicadores, maneja error
  (mock que rechaza) y reintento.
- `PanelIndicadores.test.jsx` / `TarjetaMetrica.test.jsx`: render de valores y formato.
- `GraficaEstados.test.jsx` / `FlujoCiclo.test.jsx`: orden `ORDEN_ESTADOS` y etiquetas.
- `TablaMovimientos.test.jsx`: columnas, transición formateada y estado vacío.
- `useMovimientosArchivoStream.test.jsx`: emite eventos en mock y limpia al desmontar.
- `metricasArchivo.test.js`: agrupaciones/porcentajes con casos borde (0, división por
  cero).

En `MODE === 'test'` **siempre se usa mock** (`USE_MOCK` ya lo garantiza).

### 11.2 Comandos (desde `frontend/`)

```bash
npm run test:run     # debe pasar
npm run lint         # sin errores nuevos
npm run build        # debe compilar (es lo que valida el CI)
```

Opcional recomendado: `npm run format` sobre los archivos nuevos.

---

## 12. Restricciones (no hacer)

- No modificar módulos ajenos (`enfermeria`, `coex`, `tablero`, `login`, etc.).
  La única modificación cross-módulo permitida es `src/router/AppRouter.jsx` (registrar
  la ruta) y, si aplica, `src/modules/archivo/components/ArchivoNavbar.jsx`.
- No tocar `src/shared/` sin necesidad técnica real.
- No crear una segunda instancia de Axios; usa `@/shared/api/client`.
- No inventar endpoints/payloads/estados como definitivos: márcalos como **propuestos**
  y déjalos detrás de `pendienteBackend`.
- No implementar lógica de negocio (cálculo de disponibilidad, validación de
  transiciones, etc.) en el frontend.
- No agregar dependencias (librerías de gráficas, de estado, de fechas) sin aprobación.
- No hacer `git commit` ni `git push` (instrucción explícita del responsable).

---

## 13. Criterios de aceptación

1. Existe `/archivo/dashboard`, accesible desde el navbar de Archivo y protegida por
   `area="archivo"`.
2. Se ve el aviso de origen de datos y el sistema **funciona 100% en mock** con
   `VITE_USE_MOCK` ausente/`true`.
3. Con `VITE_USE_MOCK=false`, los endpoints inexistentes fallan con `error.status = 501`
   y la UI lo comunica (sin datos falsos silenciosos).
4. Indicadores, distribución por estado, flujo del ciclo, tabla de movimientos, feed en
   vivo y bloque de excepciones están implementados.
5. El feed se actualiza en tiempo real (simulado en mock) con estado de conexión visible.
6. Tema claro/oscuro correctos; responsive usable en móvil.
7. `npm run test:run`, `npm run lint` y `npm run build` pasan sin errores nuevos.
8. Los estados usan exclusivamente `estadosExpediente.js` (sin diccionario paralelo).

---

## 14. Plan sugerido por fases (y su correspondencia en Jira)

| Fase | Contenido | Tarea Jira |
| :--- | :--- | :--- |
| 1 | Contrato propuesto + capa de datos mock + utilidades de métricas | Tarea 1 |
| 2 | Ruta, navbar, layout y componentes base (tarjetas/avisos) | Tarea 2 |
| 3 | Panel de indicadores, distribución por estado y filtros | Tarea 3 |
| 4 | Flujo del ciclo, tabla de movimientos y bloque de excepciones | Tarea 4 |
| 5 | Tiempo real (hook de stream + feed + indicador de conexión) | Tarea 5 |
| 6 | Pruebas, accesibilidad, tema/responsive y validaciones finales | Tarea 6 |

Cada tarea se mueve a **En curso** al comenzarla y a **En revisión** al terminarla
(flujo Jira HRO). La épica y las tareas están asignadas a Fernanda López, prioridad
**Highest**, con vencimiento **2026-10-09**.

---

## 15. Referencias

- `docs/MODULO_ARCHIVO.md` — contrato del ciclo de expedientes (fuente de verdad).
- `docs/ACTUALIZACION_ARCHIVO_FRONTEND.md` — actualizaciones del contrato de archivo.
- `frontend/src/modules/administracion/AGENTS.md` — reglas y patrón del panel admin.
- `frontend/src/modules/archivo/estadosExpediente.js` — estados y colores.
- `frontend/src/modules/administracion/pages/DashboardPage.jsx` — patrón visual de dashboard.
- `docs/mockups/panelAdmin/panel_administrador_dashboard/` — mockup de referencia.
- `frontend/src/shared/ws/turnosSocket.js` — patrón WebSocket del proyecto.
