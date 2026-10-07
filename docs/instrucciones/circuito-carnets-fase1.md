# Circuito digital de carnets y expedientes — Fase 1 (Archivo / Enfermería)

> **Fase:** 1 (circuito de Archivo en transición papel → digital)
> **Responsable:** Luis Rolando Colop Tzoc
> **Fecha límite:** viernes 9 de octubre de 2026
> **Sprint Jira:** Sprint 3 - Archivo
> **Épica de referencia existente:** SCRUM-175 (Fase 1 instalable — Seguimiento de expedientes)
> **Rutas objetivo:** `/enfermeria/carnets`, `/coex` (Mesa COEX, recepción existente), `/archivo`
> **Estado:** plan aprobado para ejecución (documento de trabajo)

---

## 1. Contexto y objetivo

Hoy el personal de Archivo trabaja con un circuito mixto papel/sistema:

1. Un operador de Archivo recoge los **carnets** de los pacientes.
2. Regresa al archivo, **busca a mano** el número de expediente y **junta** el expediente con el carnet.
3. Marca estados (localizado / pendiente / no encontrado) y los lleva a la estación.

La vista de **Registro de carnets** ya existe, pero su tabla se guarda **solo en `localStorage`** del navegador; no hay persistencia, ni sincronización, ni trazabilidad compartida con Archivo.

**Objetivo de la Fase 1:** digitalizar el circuito completo del carnet/expediente para que Archivo y Enfermería trabajen sobre **una misma tabla en tiempo real**, con trazabilidad de quién registra, quién encuentra, quién recibe y quién devuelve — sin tocar el modelo existente de expedientes y dejando lista la migración futura (2–3 semanas) hacia la pre-planeación por citas.

**Fuera de alcance de esta fase:**

- Turnos (el correlativo de carnet **no** es el turno de consulta).
- Pre-planeación de expedientes a partir de las citas del día anterior (llega en la migración futura).
- Actas formales con firmas (en esta fase solo **listado simple**).
- Impresión de etiquetas (el número se escribe a mano).

---

## 2. Decisiones cerradas

| # | Decisión |
|---|---|
| 1 | **Correlativo por ESPECIALIDAD**, sin tope, **único por `(fecha, especialidad)`**. Cada especialidad arranca en 1 independientemente de la estación. |
| 2 | La **estación es una columna real** (no metadato), porque Archivo filtra por estación (p. ej. Pediatría = estación 4). |
| 3 | La **enfermera elige la especialidad** al guardar el carnet (select en el registro). |
| 4 | **Formato visible:** correlativo **+ especialidad** (p. ej. `HEMATOLOGÍA 3`), para no perderlo al emparejar físicamente. |
| 5 | Si el expediente **no existe en el API del hospital → no se registra** el carnet. Carnet ⟺ expediente. |
| 6 | **1 carnet ↔ 1 expediente por día** (sin duplicados del mismo expediente el mismo día). |
| 7 | La **recepción y devolución de expedientes** se hace en **Mesa COEX** (vista existente, `/coex`). No se crea vista nueva: se **conecta** con los datos del carnet y se **integra** con el seguimiento (`expediente_ciclo`). |
| 8 | El circuito **incluye la devolución**: enfermería devuelve y Archivo confirma que recibe, con nombres. |
| 9 | El **guard de devolución es configurable** (tiempo mínimo antes de poder devolver). |
| 10 | **Navegación propia** de la estación de enfermería (navbar/submenú hacia las vistas). |
| 11 | Diseño **aditivo**: no se alteran ni borran `expediente`, `expediente_ciclo`, `expediente_movimiento`, `acta_recepcion`. Se dejan `cita_id`/`expediente_id` **nullable** desde ya para la migración. |
| 12 | Mesa COEX ya ejecuta las transiciones `entregar`/`retornar` del ciclo; el **carnet se vincula por `ciclo_id`** y refleja el mismo hito (`recibido_estacion`/`devuelto_estacion`). Una sola fuente de verdad: `expediente_ciclo`. |

---

## 3. Modelo de datos (propuesto)

### 3.1 `contador_carnet_fecha`

Contador atómico diario por especialidad (mismo patrón que `contador_turno_fecha` + `fn_siguiente_turno_fecha`, migración V11).

```sql
CREATE TABLE contador_carnet_fecha (
    fecha             DATE    NOT NULL,
    especialidad_id   BIGINT  NOT NULL REFERENCES especialidad(id),
    correlativo_actual INT    NOT NULL DEFAULT 0,
    PRIMARY KEY (fecha, especialidad_id)
);

CREATE OR REPLACE FUNCTION fn_siguiente_carnet_fecha(p_fecha DATE, p_especialidad BIGINT)
RETURNS INT AS $$
DECLARE v_resultado INT;
BEGIN
    INSERT INTO contador_carnet_fecha (fecha, especialidad_id, correlativo_actual)
    VALUES (p_fecha, p_especialidad, 0)
    ON CONFLICT (fecha, especialidad_id) DO NOTHING;

    UPDATE contador_carnet_fecha
       SET correlativo_actual = correlativo_actual + 1
     WHERE fecha = p_fecha AND especialidad_id = p_especialidad
    RETURNING correlativo_actual INTO v_resultado;

    RETURN v_resultado;
END;
$$ LANGUAGE plpgsql;
```

### 3.2 `carnet`

| Columna | Tipo | Notas |
|---|---|---|
| `id` | UUID PK | |
| `fecha` | DATE | Día del carnet |
| `correlativo` | INT | Único por `(fecha, especialidad_id)` |
| `especialidad_id` | BIGINT FK | Real (elegida por enfermería) |
| `estacion_id` | BIGINT FK | Real (para filtros de Archivo) |
| `numero_expediente` | VARCHAR(30) | Del API del hospital |
| `paciente_nombre` | VARCHAR(200) | Snapshot |
| `paciente_id` | UUID NULL | Si se conoce |
| `expediente_id` | UUID NULL | Se liga cuando exista en el catálogo local |
| `cita_id` | BIGINT NULL | Futuro (pre-planeación por citas) |
| `ciclo_id` | UUID NULL | Liga a `expediente_ciclo` cuando aplique |
| `estado` | VARCHAR(30) | Ver §4 |
| `observacion` | TEXT NULL | Para no localizado |
| Hitos | | `registrado_por_id`/`_en`, `encontrado_por_id`/`_en`, `no_localizado_por_id`/`_en`, `despachado_por_id`/`_en`, `recibido_expediente_por_id`/`_en`, `devuelto_por_id`/`_en`, `recibido_archivo_por_id`/`_en` |

Restricciones:

```sql
UNIQUE (fecha, especialidad_id, correlativo)
UNIQUE (fecha, numero_expediente)
```

### 3.3 `carnet_movimiento`

Bitácora inmutable (historial): `carnet_id`, `estado_anterior`, `estado_nuevo`, `usuario_referencia_id`, `observacion`, `fecha_movimiento`. Alimenta el historial "quién encontró / quién recibió / quién devolvió".

---

## 4. Máquina de estados del carnet

| Estado | Quién | Acción | Notas |
|---|---|---|---|
| `registrado` | Enfermería | Registra carnet (elige especialidad) | Genera correlativo por especialidad |
| `encontrado` | Archivo | Check "encontré" | Habilita despacho |
| `no_localizado` | Archivo | Check + observación | Permite seguimiento |
| `despachado` | Archivo | "Enviar a la estación" (por lote) | Salida hacia enfermería |
| `recibido_estacion` | Enfermería | "Recibí" | Guarda quién recibe |
| `devuelto_estacion` | Enfermería | "Devuelvo a archivo" | **Bloqueado hasta cumplir el guard de tiempo** |
| `recibido_archivo` | Archivo | "Recibí la devolución" | Cierra el ciclo del carnet |

Reglas:

- Los estados marcados son **inmutables** en la UI (se muestran como etiqueta; no se desmarcan).
- El backend valida la **transición** y el **rol** (Archivo vs Enfermería) de cada acción.
- La devolución exige un **tiempo mínimo configurable** desde `recibido_estacion` (propiedad `hro.carnet.minutos-antes-devolucion`, por defecto 90 min).
- La recepción y la devolución las ejecuta **Mesa COEX**: `recibido_estacion` corresponde a la transición `entregar` del ciclo y `devuelto_estacion` a `retornar`; el carnet se enlaza por `ciclo_id`.
- Modelo extensible: se agregarán estados después (ordenamiento, especialidad/incidente, etc.).

---

## 5. Vistas y rutas

| Vista | Ruta | Rol | Descripción |
|---|---|---|---|
| Registro de carnets | `/enfermeria/carnets` | enfermería | Campo grande + cámara (ZXing) + **select de especialidad** + correlativo con especialidad |
| Seguimiento en Archivo | `/archivo` | archivo | **Filtro por estación** + tabla con **checkbox** encontrado/no localizado + historial |
| Recepción y devolución | `/coex` | enfermería | **Mesa COEX existente**, conectada a los datos del carnet y al seguimiento: recibe y devuelve por lote |
| Navegación de enfermería | navbar/submenú | enfermería | Acceso a calendario, `/enfermeria/carnets` y `/coex` |

> La vista de registro de carnets **sale de Archivo** y se mueve a enfermería. La recepción/devolución **no se crea**: es **Mesa COEX** (`/coex`), a la que solo se le **conectan los datos** y se le **integra el seguimiento**. A futuro, todas las vistas de enfermería conviven bajo un mismo submenú de estación.

---

## 6. Sincronización en tiempo real

- Publicar en `/topic/archivo` y `/topic/estacion/{estacionId}` al **registrar** un carnet y en **cada transición**.
- Reusar el broker STOMP/SockJS ya configurado (`WebSocketConfig`).
- Frontend: hook de suscripción + **polling de respaldo** en **Mesa COEX** (`useRefrescoAutomatico`), que es quien recibe y devuelve.
- Resultado: Archivo ve llegar los carnets en vivo; **Mesa COEX** refleja en vivo los carnets a recibir/devolver y sus cambios de estado sin recargar.

---

## 7. Regla de emparejamiento físico (que no se revuelvan)

Sin impresora de etiquetas, el número debe **viajar escrito en el expediente**:

1. **Correlativo + especialidad** visible en grande al marcar "encontrado"; Archivo lo **escribe con lapicero** en el expediente (igual que en el carnet). Ej.: `HEMATOLOGÍA 3`.
2. **Lista de picado ordenada por ubicación** (`pasillo/estante/balda`) para recorrer el archivo una sola vez. El orden de picado ≠ orden de entrega: el número escrito es lo que permite reordenar al final.
3. **Despacho por lotes** (~20–30) con listado simple; enfermería recibe por correlativo (1–2 s por carnet), sin buscar entre 30.

---

## 8. Compatibilidad y migración

- Diseño **aditivo**: nuevas tablas y columnas; no se modifica el modelo actual.
- `cita_id` y `expediente_id` quedan **nullable** desde el inicio.
- En la migración futura, Archivo preparará expedientes desde las citas del día anterior y la enfermera solo **confirmará** carnets; se completarán los vínculos sin romper el circuito de Fase 1.

---

## 9. Fases de ejecución

| Fase | Contenido |
|---|---|
| 1.1 | Backend núcleo: migración `carnet` + `carnet_movimiento` + `contador_carnet_fecha` + `fn_…`; `POST /carnets` con validación contra el API del hospital. |
| 1.2 | Backend transiciones: encontrado / no-localizado / despachar / recibir / devolver / recibir-devolución, con RBAC; bitácora e historial; listado simple. |
| 1.3 | Real-time: eventos WebSocket `/topic/archivo` y `/topic/estacion/{id}`. |
| 1.4 | Frontend registro de carnets en `/enfermeria/carnets` (localStorage → backend, select de especialidad, cámara). |
| 1.5 | Frontend Archivo: filtro por estación + checkbox + historial. |
| 1.6 | Frontend **Mesa COEX** (`/coex`): conectar los datos del carnet y el seguimiento; `entregar`/`retornar` ⇒ `recibido_estacion`/`devuelto_estacion`. |
| 1.7 | Listado simple del día. |
| 1.8 | Navbar/submenú de la estación de enfermería (calendario, carnets y COEX). |
| Fase 2 | Pre-planeación por citas + confirmación de carnet (migración futura). |

---

## 10. Criterios de aceptación (Fase 1)

- [ ] Registrar un carnet asigna un correlativo por especialidad, sin tope, compartido entre estaciones.
- [ ] El carnet se persiste en BD y aparece en Archivo **en tiempo real**.
- [ ] Si el expediente no existe en el API del hospital, **no** se registra el carnet.
- [ ] No se permite duplicar el mismo expediente el mismo día.
- [ ] Archivo puede filtrar por estación y marcar encontrado/no localizado (inmutable).
- [ ] Enfermería recibe y devuelve **desde Mesa COEX** (`/coex`); el carnet refleja el estado y la devolución respeta el guard configurable.
- [ ] El historial muestra quién registró, encontró, recibió y devolvió, con fecha/hora.
- [ ] Existe listado simple del día por estación y especialidad.
- [ ] La vista de registro ya no depende de `localStorage`.

---

## 11. Mapa Jira (Sprint 3 - Archivo, id 36)

Todas: prioridad **High**, responsable **Luis Rolando Colop Tzoc**, fecha límite **2026-10-09**.

### Épica 1 — SCRUM-216 · Backend — Circuito digital de carnets y expedientes (Fase 1 Archivo)
- **SCRUM-218** · Historia: Registro de carnet con correlativo diario por especialidad
- **SCRUM-219** · Historia: Transiciones y seguimiento del carnet (RBAC + guard configurable)
- **SCRUM-220** · Historia: Sincronización en tiempo real de la tabla de carnets (WebSocket)
- **SCRUM-225** · Tarea: Migración BD (carnet, carnet_movimiento, contador_carnet_fecha, fn_siguiente_carnet_fecha)
- **SCRUM-226** · Tarea: Endpoint POST/GET /carnets + validación API hospital y pruebas
- **SCRUM-227** · Tarea: Transiciones del carnet (RBAC) + bitácora e historial
- **SCRUM-228** · Tarea: Guard configurable de tiempo mínimo antes de la devolución
- **SCRUM-229** · Tarea: Publicar eventos WebSocket `/topic/archivo` y `/topic/estacion/{id}`

### Épica 2 — SCRUM-217 · Frontend — Interfaces del circuito de carnets (Fase 1 Archivo)
- **SCRUM-221** · Historia: Registro de carnets (estación de enfermería)
- **SCRUM-222** · Historia: Archivo — seguimiento de carnets del día
- **SCRUM-223** · Historia: Enfermería — recepción y devolución vía Mesa COEX (conectada a carnets y seguimiento)
- **SCRUM-224** · Historia: Navegación de la estación de enfermería (submenú)
- **SCRUM-230** · Tarea: Crear la vista `/enfermeria/carnets` (select de especialidad, cámara, correlativo + especialidad)
- **SCRUM-231** · Tarea: Conectar el registro de carnets a la API real (quitar localStorage)
- **SCRUM-232** · Tarea: Optimizar la vista de Archivo (filtro por estación, checkbox e historial)
- **SCRUM-233** · Tarea: Conectar Mesa COEX con los carnets y el seguimiento (recibir/devolver)
- **SCRUM-234** · Tarea: Crear el navbar/submenú de la estación de enfermería (calendario, carnets, COEX)
- **SCRUM-235** · Tarea: Integrar actualización en tiempo real (WebSocket) en las tablas

### Incidencias existentes relacionadas (Sprint 3 - Archivo)
- SCRUM-175 (épica Fase 1) · SCRUM-179 (check-in/tracking Archivo) · SCRUM-180 (PDF de traspaso) · SCRUM-181 (Enfermería recepción/devolución) · SCRUM-183 (migración de datos).

---

## 12. Riesgos y pendientes

- **Ambigüedad especialidad vs subespecialidad**: se usará **especialidad** según indicación; validar el catálogo real en BD.
- **Devolución inmediata**: el guard mitiga marcar recibir+devolver en el mismo instante; valor configurable.
- **Emparejamiento físico**: depende de que se escriba el número en el expediente; sin eso el circuito digital no evita el desorden.
- **Desempeño del API del hospital**: el registro falla/bloquea si el API no responde (por decisión de negocio: sin expediente no hay carnet).
- **Migración**: mantener el modelo aditivo y no cerrar campos nullable.
- **Acoplamiento COEX↔carnet**: mantener una sola fuente de verdad (`expediente_ciclo`) y no duplicar estados; en Fase 1 el enlace carnet→ciclo puede ser parcial hasta la migración (carnets sin cita).
