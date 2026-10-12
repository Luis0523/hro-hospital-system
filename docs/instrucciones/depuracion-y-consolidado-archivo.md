# Instrucciones — Depuración de expedientes y Consolidado de Archivo

**Área:** Estación de Archivo (Registro Médico / seguimiento de expedientes físicos)
**Tipo de trabajo:** Frontend exclusivamente (React + Vite + Tailwind + JavaScript/JSX)
**Responsable sugerido:** Fernanda López (épica nueva en Jira, Sprint 3 - Archivo)
**Fecha objetivo:** jueves 8 de octubre de 2026
**Rama de trabajo:** `integracion-circuito-archivo`
**Entregable:** `frontend/src/modules/archivo/` (nuevas secciones `depuracion` y `consolidado`)

> Este documento es la instrucción de trabajo: fuente de verdad del alcance, la
> arquitectura y los criterios de aceptación. Complementa —no reemplaza— `docs/MODULO_ARCHIVO.md`
> (contrato del ciclo de expedientes), `docs/instrucciones/dashboard-archivo.md` y
> `frontend/src/modules/administracion/AGENTS.md`.

---

## 0. Estado real del repositorio (no asumir lo del `AGENTS.md` raíz)

El `AGENTS.md` de la raíz describe una rama de enfermería con módulos "placeholder". **Ya no aplica.** Antes de empezar, asume:

- Rama activa: `integracion-circuito-archivo`.
- `src/modules/archivo/` está completo: páginas, API, mocks, hooks, mapeadores y pruebas.
- `src/modules/carnets/` (circuito de carnets, Fase 1) está operativo y **es la fuente de la
  especialidad por la que entra cada expediente**.
- `src/modules/administracion/` está cerrado y es la referencia visual/de patrones.
- Backend desplegado (Fly): `https://hro-hospital-api.fly.dev/api/v1`. Envelope `ApiResponse`
  → consumir `respuesta.data`. Cabeceras `X-Usuario-*` y `X-Estacion-Id` las agrega `shared/api/client.js`.

**Consecuencia:** no inventes estructura. Copia los patrones de `archivo`, `carnets` y `administracion`.

---

## 1. Alcance de la fase

Dos funcionalidades nuevas, en este orden de prioridad:

1. **Depuración de expedientes** — marcar expedientes como "ya no existen en el sistema"
   (baja lógica / depurado), con registro visual acumulado del día.
2. **Consolidado de Archivo** — estadísticas de trabajo:
   - **Consolidado diario**: sumatoria de expedientes/consultas **por especialidad**
     (dato que ya captura el registro de carnets).
   - **Consolidado mensual**: réplica del *Informe Estadístico de Archivo* que hoy llevan en
     Excel (hoja 1 = informe diario; hoja 2 = detalle de desarchivados por consulta y especialidad).

### Fuera de alcance (explícito)

- **NO** tocar backend/BD: esta fase ya incluye la migración **V23** y las APIs
  (depuración y consolidado) del lado backend. El frontend solo las **consume** (y las mockea
  mientras no estén desplegadas). Rutas y contratos en §2.3, §3.2 y §4.5.
- **NO** implementar la pantalla operativa `/archivo` ni el ciclo de expedientes.
- **NO** recalcular reglas de negocio en el frontend: el backend es la fuente de verdad.
- **NO** agregar dependencias (librerías de gráficas/Excel) sin aprobación.
- **NO** modificar módulos ajenos. Única excepción cross-módulo: `src/router/AppRouter.jsx` y
  `ArchivoNavbar.jsx` (registrar navegación).

---

## 2. Parte A — Depuración de expedientes

### 2.1 Objetivo funcional

Pantalla que permite al personal de Archivo **dar de baja un expediente** del sistema (por ejemplo,
un expediente físico extraviado definitivamente o fusionado). Es un flujo **mínimo**:

1. Se ingresa **únicamente el número de expediente**.
2. El sistema **busca automáticamente** en la API y **muestra el nombre del paciente**.
3. Si el usuario confirma, el expediente queda **marcado como depurado** ("ya no existe").
4. Se acumula una **tabla/bitácora** de los expedientes depurados (igual experiencia que
   `RegistroCarnetsPage`, **pero sin correlativo**: no se asigna ningún numeral).

### 2.2 Comportamiento UX (espejo de `RegistroCarnetsPage`)

Referencia directa: `frontend/src/modules/archivo/pages/RegistroCarnetsPage.jsx` y su hook
`useRegistroCarnets`. Reutilizar la misma ergonomía:

- Encabezado con fecha (`formatearFechaLarga(hoyIso())`) y aviso de "lector listo · foco permanente".
- Campo único grande (`h-16`, `text-[26px]`), `autoFocus`, foco permanente, `useEscanerCodigo`
  para lectura por cámara y lector, `Enter` para disparar.
- Al escribir/leer: **búsqueda automática** (debounce corto) → tarjeta de confirmación con
  **nombre del paciente** y **número de expediente**.
- Botón **"Marcar como depurado"** (o "Confirmar baja") solo si la búsqueda encontró al paciente.
- **Sin correlativo.** La tabla solo registra: `numeroExpediente`, `pacienteNombre`, `hora`,
  (opcional) `motivo`/`observación` y quién lo hizo.
- Aviso destacado: "Este expediente quedará marcado como **no existente** en el sistema."
- Estados: `buscando`, `encontrado`, `no_encontrado`, `depurado`, `duplicado` (ya estaba depurado),
  `error`.

### 2.3 Regla de negocio clave (backend)

Al marcar un expediente como depurado, **si en el futuro alguien consulta ese expediente el sistema
debe responder que ya no existe** (no un simple "no encontrado" genérico). Por eso:

- El estado de depuración es **baja lógica** (no borrado físico).
- La búsqueda de un expediente depurado debe devolver una **señal explícita** ("depurado / dado de
  baja") para que la UI lo distinga de "código inexistente".
- **Contrato REAL ya implementado en el backend** (rama `integracion-circuito-archivo`,
  migración Flyway **V23**; desplegar antes de consumir en modo real):
  - `POST /expedientes/depuracion` · body `{ numeroExpediente, motivo? }` → **201** con
    `data`: `{ id, expedienteId, numeroExpediente, pacienteNombre, motivo, usuarioNombre, depuradoEn }`.
    - **404** si el número no existe; **409** (`EXPEDIENTE_YA_DEPURADO`) si ya estaba depurado.
  - `GET /expedientes/depuracion?fecha=YYYY-MM-DD` → **200** con `data`: arreglo de
    `{ id, expedienteId, numeroExpediente, pacienteNombre, motivo, usuarioNombre, depuradoEn }`
    (fecha por defecto: hoy). Es la bitácora del día (sin correlativo).
  - **Señal "ya no existe" en la búsqueda:** `GET /expedientes/buscar?codigo={exp}` ahora devuelve
    el expediente con `data.content[0].depurado = true`. Igual en `GET /expedientes/numero/{n}`
    (`data.depurado` + `data.depuradoEn`). La UI debe leer ese flag y mostrar "Expediente depurado
    (ya no existe)", en vez de un 404 ambiguo.
- Para el nombre del paciente en modo **mock**, reusar `buscarExpedientePorCodigo` /
  `buscarPacientePorExpediente` de `archivoApi.js` (o el mock del módulo de depuración).

> Sigue siendo **mock-first** (`VITE_USE_MOCK`): implementa el mock con la MISMA forma de arriba.
> En modo real, conecta a estos endpoints; ya no van detrás de `pendienteBackend`.

---

## 3. Parte B — Consolidado diario por especialidad

### 3.1 Objetivo

Para una fecha, mostrar la **sumatoria de expedientes/consultas por especialidad**. La
especialidad ya la conocemos porque **cada carnet se registra eligiendo su especialidad**
(`POST /carnets { numeroExpediente, especialidadId, estacionId }`).

Ejemplo: de 100 expedientes del día → Medicina Interna 80, Pediatría 12, Cirugía 8…
Se listan todas las especialidades con su total y el gran total del día.

### 3.2 Fuente de datos

- **Endpoint REAL ya implementado** (V23, agregación en BD):
  `GET /archivo/consolidado/diario?fecha=YYYY-MM-DD` → **200** con `data`:
  ```json
  {
    "fecha": "2026-10-07",
    "total": 34,
    "totalDepurados": 2,
    "porEspecialidad": [
      { "especialidadId": 3, "especialidadNombre": "Medicina Interna", "total": 21 }
    ]
  }
  ```
  `total` = suma de la especialidad del día; `totalDepurados` = expedientes depurados de ese día.
  Ordenado de mayor a menor. Fecha por defecto: hoy. (La agregación sale de la función
  `fn_archivo_consolidado_diario` sobre `carnet`; el frontend no agrupa por su cuenta.)
- Alternativa ya existente: `GET /carnets?fecha=YYYY-MM-DD` (cada carnet con su especialidad).
- En mock, derivar de `carnetsApi`/`mockData` para que los números cuadren con el registro de carnets.

### 3.3 UI

- Tarjeta de "Total del día" + lista/tabla por especialidad ordenada de mayor a menor.
- Barras horizontales simples con HTML + Tailwind (sin librería de gráficas); color de la barra
  con tokens de tema. Cifras **siempre visibles** junto a la barra.
- Selector de fecha (por defecto hoy).
- Estado vacío cuando no hay carnets.

---

## 4. Parte C — Consolidado mensual (Informe Estadístico de Archivo)

Réplica de la estructura del archivo `Estadistico de archivo REAL HRO.xls`. Tiene **dos tablas
relacionadas** y un bloque de totales. La UI debe reflejar esa estructura, no reinventarla.

### 4.1 Tabla 1 — "INFORME ESTADÍSTICO DE ARCHIVO" (resumen por día)

| Campo | Significado | Origen | Fórmula / regla |
| :--- | :--- | :--- | :--- |
| `DIA` | Día del registro | Ingresado | — |
| `HA` | Historias Archivadas | **Calculado** | `HA = TOTAL * 2` ⚠️ confirmar con Archivo |
| `EH` | Egresos Hospitalarios | Ingresado | — |
| `HDT` | Historias Desarchivadas por Trabajos | Ingresado | — |
| `HDC` | Historias Desarchivadas por Consulta | **Calculado** | = `TOTAL` de la Tabla 2 del mismo día |
| `SOBRES` | Cantidad de sobres | Ingresado | — |
| `HR` | Historias Revisadas | Ingresado | — |
| `HD` | Historias Depuradas | **Derivado** | conteo del módulo de **Depuración** de ese día |
| `TOTAL` | Total de trabajo contabilizado | **Calculado** | `EH + HDT + HDC + SOBRES + HR + HD` |
| `TIA` | Tarjetas Índice Archivadas | Ingresado | — |

> **Ojo (fórmula real del Excel):** el `TOTAL` **no** incluye `HA` ni `TIA`. Y `HA = TOTAL * 2`
> está programado así en el Excel; **déjalo marcado para confirmar** si la regla se mantiene en el sistema.

### 4.2 Tabla 2 — Detalle de Historias Desarchivadas por Consulta

| Campo | Significado | Origen |
| :--- | :--- | :--- |
| `DIA` | Día | — |
| `MEDICINA` | Solicitadas por Medicina | Ingresado / carnets |
| `HEMODIALISIS` | Solicitadas por Hemodiálisis | Ingresado / carnets |
| `SUB_TOTAL` | `MEDICINA + HEMODIALISIS` | **Calculado** |
| `CIRUGIA` | Solicitadas por Cirugía | Ingresado / carnets |
| `TRAUMATOLOGIA` | Solicitadas por Traumatología | Ingresado / carnets |
| `GINECO_OBSTETRICIA` | Solicitadas por Gineco-Obstetricia | Ingresado / carnets |
| `PEDIATRIA` | Solicitadas por Pediatría | Ingresado / carnets |
| `PSICOSOCIAL` | Solicitadas por Psicosocial | Ingresado / carnets |
| `ODONTOLOGIA` | Solicitadas por Odontología | Ingresado / carnets |
| `CLINICA_MUJER` | Clínica de la Mujer | Ingresado / carnets |
| `CLINICA_VIH` | Clínica #1 VIH | Ingresado / carnets |
| `TOTAL` | Total desarchivado por consulta del día | **Calculado** |

Fórmulas:
- `SUB_TOTAL = MEDICINA + HEMODIALISIS`
- `TOTAL = SUB_TOTAL + CIRUGIA + TRAUMATOLOGIA + GINECO_OBSTETRICIA + PEDIATRIA + PSICOSOCIAL + ODONTOLOGIA + CLINICA_MUJER + CLINICA_VIH`
- Ese `TOTAL` alimenta `HDC` de la Tabla 1.

**Relación real del Excel:** `Especialidades → TOTAL por consulta → HDC → TOTAL diario → HA`.

### 4.3 Bloque de totales

El Excel además trae totales acumulados por columna (`SUM`) y un resumen de:
**Tarjetas Índice Archivadas, Tarjetas Índice Depuradas, Sobres Numerados y Total del trabajo realizado.**
Mostrarlos como franja de cierre del consolidado (mes completo).

### 4.4 Cómo se arma en el sistema (mapeo)

- **Derivables hoy** desde datos existentes:
  - `HDC` = total de carnets del día (agrupado por especialidad) → alimenta la Tabla 1.
  - Detalle por especialidad de la Tabla 2 = carnets por especialidad (mismas cifras que el
    consolidado diario).
  - `HD` (Historias Depuradas) = conteo del módulo de Depuración.
- **Campos que hoy no captura el sistema** (Excel ingresado a mano):
  `EH`, `HDT`, `SOBRES`, `HR`, `TIA` (+ los "Tarjetas Índice" del bloque final).
  → En esta fase se muestran como **editable manual** (input) o **placeholder "pendiente de captura"**;
  **no inventar** valores. Documentar que requieren captura futura (backend/formulario).
- **Calculados en frontend solo para presentación**: `SUB_TOTAL`, `TOTAL`, `HA`. Aun así, cuando el
  backend entregue el consolidado, **preferir el valor del backend** y usar el cálculo como respaldo/mock.

### 4.5 Contrato REAL ya implementado (V23)

```
GET /archivo/consolidado/mensual?anio=YYYY&mes=M      (o ?desde=YYYY-MM-DD&hasta=YYYY-MM-DD)
→ data: {
    rango:   { desde: "2026-10-01", hasta: "2026-10-31" },
    informe: [                       // Tabla 1, una fila por día CON actividad
      { dia: "2026-10-01", hdc: 34, hd: 2 }   // hdc = carnets del día; hd = depurados del día
    ],
    detalle: [                       // Tabla 2, una fila por día
      { dia: "2026-10-01", total: 34,
        porEspecialidad: [ { especialidadId: 3, especialidadNombre: "Medicina Interna", total: 21 } ] }
    ],
    totales: {                       // acumulados del rango
      totalCarnets: 210, totalDepurados: 9,
      porEspecialidad: [ { especialidadId: 3, especialidadNombre: "Medicina Interna", total: 120 } ]
    }
  }
```

**Cómo mapearlo a la Tabla 1 del Excel** (el frontend compone las columnas):
- `HDC` ← `informe[].hdc` (carnets del día).
- `HD`  ← `informe[].hd` (depurados del día, del módulo de Depuración).
- `TOTAL`, `HA = TOTAL*2`, y las columnas de captura manual (`EH`, `HDT`, `SOBRES`, `HR`, `TIA`)
  **no** vienen del backend: el frontend las calcula/edita o las muestra como "pendiente de captura".

**Cómo mapearlo a la Tabla 2 del Excel:** `detalle[].porEspecialidad` es dinámico (catálogo real
de especialidades). El frontend decide cómo presentarlo (columnas fijas del Excel o tabla dinámica).

- Fechas: `anio`+`mes` (mes 1–12) o bien `desde`/`hasta`. Por defecto: **mes actual**.
- Agregación en BD vía `fn_archivo_consolidado_mensual` + vista `vw_archivo_resumen_diario`.
- En mock: generar un mes determinista (sin aleatoriedad no seedeada) y **consistente** con el
  consolidado diario y con los carnets, respetando esta forma.
- **Export PDF** (opcional, futuro): reusar el patrón de `obtenerResumenArchivoPdf` (Blob).

---

## 5. Arquitectura de archivos a crear

Mantén la estructura del módulo (`pages`, `components`, `api`, `hooks`, `utils`). Solo lo necesario.

```
frontend/src/modules/archivo/
├── pages/
│   ├── DepuracionExpedientesPage.jsx      # ya existe la ruta/placeholder: completar la pantalla
│   └── ConsolidadoArchivoPage.jsx         # nueva: consolidado diario + mensual (tabs)
├── components/
│   ├── depuracion/
│   │   ├── BuscadorExpedienteDepurar.jsx  # campo único + búsqueda automática
│   │   ├── TarjetaConfirmacionDepurar.jsx # nombre del paciente + botón "Marcar como depurado"
│   │   └── TablaDepurados.jsx             # bitácora del día (sin correlativo)
│   └── consolidado/
│       ├── ConsolidadoDiario.jsx          # total del día + barras por especialidad
│       ├── TablaInformeEstadistico.jsx    # Tabla 1 (resumen por día)
│       ├── TablaDetalleConsulta.jsx       # Tabla 2 (detalle por especialidad)
│       ├── BloqueTotalesMes.jsx           # acumulados + tarjetas índice
│       └── BarraEspecialidad.jsx          # barra horizontal accesible
├── api/
│   ├── depuracionArchivoApi.js            # (nuevo) buscar/confirmar depuración + mock
│   ├── consolidadoArchivoApi.js           # (nuevo) diario y mensual + mock
│   └── mockData.js                        # reutilizar expedientesMock/carnets mock
├── hooks/
│   ├── useDepuracionExpediente.js
│   └── useConsolidadoArchivo.js
└── utils/
    └── metricasConsolidado.js             # agrupar por especialidad, fórmulas del Excel, %s
```

Reglas:
- **Presentacionales** (reciben props, emiten callbacks): los componentes.
- **Contenedor** (orquesta estado, carga, filtros): las páginas + hooks.
- Imports cross-carpeta con `@/`; dentro del módulo, relativos (`../`). `.jsx` explícito.
- Reutiliza: `ArchivoLayout`, `ArchivoNavbar`, `estadosExpediente.js`, `ui` (`Button, Input, Table,
  Alert, EmptyState, Card, Icon, Spinner`), `useEscanerCodigo`, `@/shared/utils/fecha`.

---

## 6. Navegación y rutas

- Registrar en `AppRouter.jsx`, dentro de `RutaPorRol area="archivo"`:
  - `/archivo/depuracion` → `DepuracionExpedientesPage` (hoy es placeholder; **completar**).
  - `/archivo/consolidado` → `ConsolidadoArchivoPage` (nueva).
- Agregar entradas en `SECCIONES_ARCHIVO` (`ArchivoNavbar.jsx`):
  - `{ to: '/archivo/depuracion', etiqueta: 'Depuración', icono: 'delete_sweep' }`
  - `{ to: '/archivo/consolidado', etiqueta: 'Consolidado', icono: 'insights' }`
- Envolver cada página en `ArchivoLayout` para heredar identidad/encabezado/navbar.
- UI en **español**; tema claro/oscuro con tokens; responsive (tablas → tarjetas en móvil).

---

## 7. Pruebas y validación (desde `frontend/`)

Pruebas co-locadas `*.test.jsx` / `*.test.js` (Vitest + Testing Library). `MODE === 'test'` usa mock siempre.

- `DepuracionExpedientesPage.test.jsx`: búsqueda encuentra/NO encuentra, duplicado, confirmación, tabla del día.
- `ConsolidadoArchivoPage.test.jsx`: carga en mock, diario por especialidad, informe + detalle.
- `metricasConsolidado.test.js`: agrupación por especialidad, `SUB_TOTAL`, `TOTAL`, `HA = TOTAL*2`,
  casos borde (0, división por cero, mes vacío).
- `TablaInformeEstadistico.test.jsx` / `TablaDetalleConsulta.test.jsx`: columnas y fórmulas.

```bash
npm run test:run
npm run lint
npm run build
```
Opcional: `npm run format` sobre archivos nuevos.

---

## 8. Criterios de aceptación

1. `/archivo/depuracion` permite ingresar **solo el número de expediente**, muestra el **nombre
   del paciente** y marca el expediente como depurado, con **bitácora del día sin correlativo**.
2. Consultar (buscar) un expediente depurado devuelve una señal explícita de **"depurado / ya no
   existe"** (mock en frontend; en real, `data.depurado = true` del backend).
3. `/archivo/consolidado` muestra el **consolidado diario por especialidad** (de los carnets) con
   total del día, y el **consolidado mensual** con la Tabla 1, la Tabla 2 y el bloque de totales.
4. Las fórmulas (`SUB_TOTAL`, `TOTAL`, `HA`) y la relación Tabla2→`HDC`→Tabla1 se respetan; los
   campos no capturados se muestran como "pendiente de captura", nunca inventados.
5. Funciona 100% en mock (`VITE_USE_MOCK` ausente/`true`); en modo real consume los endpoints
   reales de §2.3, §3.2 y §4.5 (si aún no están desplegados, propaga el error y la UI lo comunica,
   sin datos falsos).
6. Tema claro/oscuro correctos y responsive usable en móvil.
7. `npm run test:run`, `npm run lint`, `npm run build` pasan sin errores nuevos.

---

## 9. Correspondencia con Jira (épica nueva, Sprint 3 - Archivo)

| # | Tarea | Contenido |
| :--- | :--- | :--- |
| 1 | **SCRUM-244** Depuración de expedientes | Búsqueda por número de expediente, confirmación, bitácora del día y regla de baja lógica. |
| 2 | **SCRUM-245** Consolidado diario por especialidad | Sumatoria de carnets por especialidad + total del día. |
| 3 | **SCRUM-246** Consolidado mensual (Informe Estadístico) | Tabla 1 + Tabla 2 + fórmulas + bloque de totales. |
| 4 | **SCRUM-247** Navegación, pruebas y responsive | Rutas/navbar, tema claro/oscuro, tests y build. |
| 5 | **SCRUM-248** (backend) Depuración | Migración V23 + `POST/GET /expedientes/depuracion` + señal `depurado` en búsqueda. |
| 6 | **SCRUM-249** (backend) Consolidado | Vistas/funciones + `GET /archivo/consolidado/diario` y `/mensual`. |

Cada tarea: **En curso** al empezarla y **En revisión** al terminarla (flujo Jira HRO).

---

## 10. Referencias

- `docs/MODULO_ARCHIVO.md` — contrato del ciclo de expedientes.
- `docs/instrucciones/dashboard-archivo.md` y `dashboard-archivo-backend.md` — patrón y contratos.
- `frontend/src/modules/archivo/pages/RegistroCarnetsPage.jsx` — patrón UX a espejar (sin correlativo).
- `frontend/src/modules/carnets/api/carnetsApi.js` — origen de la especialidad por expediente.
- `frontend/src/modules/archivo/api/archivoApi.js` — API y `pendienteBackend`.
- `frontend/src/modules/archivo/estadosExpediente.js` — estados/etiquetas (única fuente).
- `frontend/src/modules/administracion/AGENTS.md` — reglas del panel admin (referencia).
- Excel legado: `Estadistico de archivo REAL HRO.xls` (no versionado; transcripción en §4).
