# Plan de Integración — Estaciones de Enfermería y Tableros de Turnos por Área

> Documento de planificación e implementación. Define la nueva lógica de **estaciones de enfermería**
> (puestos de trabajo que agrupan subespecialidades) y su efecto en el **tablero de turnos** y en
> el **POS de enfermería**.
> Fecha: 2026-09-26 · Rama: `integracion-estacion-tablero` · Base: `main` @ `d3cbfd0`.

---

## 1. Objetivo

Hoy el tablero de turnos muestra **todos** los turnos del hospital (`TurnoService` publica en
`/topic/tablero`), y el POS de enfermería trabaja con una **estación simulada** y una clínica por
defecto (`clinicas[0]`). Se necesita:

1. Modelar **estaciones de enfermería** reales (hoy 4) en backend.
2. Asignar a cada estación las **subespecialidades** que atiende (pertenencia **única**).
3. Que **cada tablero/TV** muestre **solo** los turnos del área de su estación.
4. Que cada enfermera, al entrar, elija su estación ("minilogin") por rotación de personal, sin
   amarrarla a su usuario.

---

## 2. Decisiones confirmadas

| # | Tema | Decisión |
|---|---|---|
| 1 | Granularidad | La estación agrupa **subespecialidades**. |
| 2 | Pertenencia | **Única**: una subespecialidad pertenece a una sola estación (evita mezclar áreas). |
| 3 | Salas propias | **No** se modelan: las salas (`espacio_fisico`) se **derivan** de la subespecialidad vía `asignacion_diaria_espacio`. No se crea `estacion_espacio_fisico`. |
| 4 | Estación del usuario | **No** se fija al usuario. La estación es **de la sesión**: se elige en un "minilogin", se persiste local (`hro_estacion`) y viaja por header `X-Estacion-Id`. Se registra en bitácora `estacion_acceso` (rotación). |
| 5 | Quién edita | `jefe_enfermeria` y `administrador` gestionan estaciones y su asignación de subespecialidades. |
| 6 | Visibilidad por día | Una subespecialidad se muestra en la estación solo si pertenece a ella **y** tiene horario activo ese día (`subespecialidad_horario.dia_semana = ISODOW(fecha) AND activo = true`). |
| 7 | "Pasar siguiente" | Se mantiene **por asignación/sala** (como hoy con `POST /turnos/asignacion/{id}/siguiente`). |
| 8 | Validación en check-in | **Recomendado**: rechazar check-in cuya subespecialidad no pertenezca a la estación del header. *(a confirmar)* |

---

## 3. Modelo de datos

### 3.1 Esquema actual relevante (post V11)

```
especialidad (id BIGINT PK, nombre UNIQUE, activo)
  └─1:N─ subespecialidad (id BIGINT PK, especialidad_id FK, nombre, activo, UNIQUE(especialidad_id,nombre))
            └─1:N─ subespecialidad_horario (id UUID PK, subespecialidad_id FK, dia_semana 1..7,
                                            hora_inicio, hora_fin, capacidad_maxima,
                                            duracion_consulta_minutos, activo,
                                            UNIQUE(subespecialidad_id,dia_semana))

subespecialidad_horario ─1:N─ cupo_diario (id UUID PK, subespecialidad_horario_id FK, fecha,
                                           capacidad_maxima, cupos_ocupados,
                                           UNIQUE(subespecialidad_horario_id,fecha))
cupo_diario ─1:N─ cita (id BIGINT PK, paciente_id UUID FK, cupo_diario_id UUID FK, estado, ...)
paciente (id UUID PK, dpi UNIQUE, numero_expediente UNIQUE, ...)

espacio_fisico (id UUID PK, numero UNIQUE, nivel, capacidad_camillas, activo, ...)
  └─1:N─ asignacion_diaria_espacio (id BIGINT PK, espacio_fisico_id UUID FK,
                                    subespecialidad_id BIGINT FK, fecha, creado_por FK,
                                    UNIQUE(espacio_fisico_id,fecha))

cita ─1:1─ turno (id BIGINT PK, cita_id BIGINT FK, asignacion_diaria_espacio_id BIGINT FK,
                  numero_turno, estado, intentos_llamado, horas...)

contador_turno_fecha  (fecha PK, turno_actual, turno_siguiente)         -- correlativo GLOBAL/día (V11)
contador_turno_diario (id, asignacion_diaria_espacio_id UNIQUE FK,
                       turno_actual, turno_siguiente)                   -- último llamado por sala (tablero)

usuario_referencia (id BIGINT PK, id_externo UNIQUE, rol_principal CHECK, activo)
auditoria_general (id, tabla_afectada, entidad_id VARCHAR(64), accion,
                   usuario_referencia_id FK, valores_anteriores JSONB, valores_nuevos JSONB, fecha)
```

**Cadena de pertenencia para el tablero:** `turno → asignacion_diaria_espacio → subespecialidad → especialidad`.

### 3.2 Tablas nuevas (migración V12)

```sql
-- Puesto de trabajo de enfermería
estacion_enfermeria (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo     VARCHAR(30)  NOT NULL UNIQUE,      -- p. ej. 'EST-01'
    nombre     VARCHAR(150) NOT NULL,
    ubicacion  VARCHAR(150),
    activo     BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Subespecialidades a cargo de cada estación (pertenencia ÚNICA)
estacion_subespecialidad (
    id                 BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    estacion_id        BIGINT NOT NULL REFERENCES estacion_enfermeria(id) ON DELETE CASCADE,
    subespecialidad_id BIGINT NOT NULL REFERENCES subespecialidad(id)     ON DELETE RESTRICT,
    activo             BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_estacion_subespecialidad UNIQUE (estacion_id, subespecialidad_id),
    -- pertenencia única (variante recomendada: índice único parcial por activo)
    CONSTRAINT uq_estacion_sub_unica UNIQUE (subespecialidad_id)
);

-- Bitácora de rotación (opcional, para saber quién está en qué estación)
estacion_acceso (
    id                     BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    estacion_id            BIGINT NOT NULL REFERENCES estacion_enfermeria(id) ON DELETE RESTRICT,
    usuario_referencia_id  BIGINT NOT NULL REFERENCES usuario_referencia(id)  ON DELETE RESTRICT,
    entrado_en             TIMESTAMPTZ NOT NULL DEFAULT now(),
    salido_en              TIMESTAMPTZ
);
CREATE INDEX idx_estacion_acceso_estacion ON estacion_acceso(estacion_id);
CREATE INDEX idx_estacion_acceso_usuario  ON estacion_acceso(usuario_referencia_id);
```

> Alternativa si se quiere permitir desactivar una asignación y reasignar después: reemplazar
> `uq_estacion_sub_unica` por un índice único parcial `UNIQUE (subespecialidad_id) WHERE activo`.

### 3.3 Cómo se relaciona todo

```
estacion_enfermeria ─N:M─ subespecialidad ─1:N─ subespecialidad_horario (día activo)
                                   │
                                   ├─1:N─ cupo_diario ─1:N─ cita ─1:1─ turno
                                   └─1:N─ asignacion_diaria_espacio ─1:N─ turno
                                                └─ espacio_fisico (sala derivada)

estacion_enfermeria ─1:N─ estacion_acceso ─N:1─ usuario_referencia
```

**Vista por estación y fecha:**
`subespecialidades de la estación ∩ subespecialidades con horario activo ese día → cupos/citas (agenda) y asignaciones/turnos (cola y tablero)`.

---

## 4. Impacto en backend

### 4.1 Módulo `estacion/` (nuevo)
- Entidades `EstacionEnfermeria`, `EstacionSubespecialidad`, `EstacionAcceso`.
- Repositorios, `EstacionService`, `EstacionController`.
- Endpoints:
  - `GET /estaciones?activo=true` → lista con sus subespecialidades.
  - `GET /estaciones/{id}` → detalle + subespecialidades.
  - `GET /estaciones/{id}/subespecialidades` → ids/nombres.
  - `PUT /estaciones/{id}/subespecialidades` → reemplaza el conjunto (roles `jefe_enfermeria`, `administrador`).
  - `POST/PUT/PATCH/DELETE /estaciones...` → CRUD + baja lógica (roles anteriores).
  - `GET /estaciones/{id}/subespecialidades-activas?fecha=` → filtra por día (`subespecialidad_horario`).
  - `POST /estaciones/{id}/acceso` / `PATCH /estaciones/acceso/{id}/salida` (bitácora, opcional).
- Auditoría de cambios (`AuditoriaEvent`) con `tablaAfectada = "estacion_enfermeria"`.

### 4.2 Contexto de estación en peticiones
- Aceptar header `X-Estacion-Id` en `UsuarioContexto`/`MockProveedorIdentidad` (mismo patrón que `X-Usuario-*`).
- `CorsConfig.allowedHeaders`: agregar `X-Usuario-Id`, `X-Usuario-Rol`, `X-Usuario-Nombre`, `X-Estacion-Id`.
- Exponer `estacionActual()` para servicios que deban validar.

### 4.3 Turnos / tablero
- `TableroTurnoDTO`: añadir `subespecialidadId` y `especialidadId` (hoy no vienen) para rutear/filtrar.
- `TurnoService.notificarActualizacionTablero`: resolver la(s) estación(es) de `asignacion.subespecialidad`
  y publicar en **`/topic/estacion/{estacionId}`** (además de los actuales, por compatibilidad).
- Nuevo `GET /turnos/estacion/{estacionId}/tablero?fecha=` → `List<TableroTurnoDTO>` de todas las
  asignaciones del día cuyas subespecialidades pertenecen a la estación (carga inicial sin esperar WS).
- Filtro de cola por estación: `GET /turnos/estacion/{estacionId}?fecha=&incluirNoResponde=true`
  (por defecto solo activos; `incluirNoResponde=true` agrega los no respondidos para el panel de reintegración).
- Validación de check-in (recomendada): rechazar si la `subespecialidad` de la cita no pertenece a `X-Estacion-Id`.
- Se conserva `POST /turnos/asignacion/{id}/siguiente` (por sala).

### 4.4 Datos
- Migración **V12** (`estacion_enfermeria`, `estacion_subespecialidad`, `estacion_acceso`).
- **Seeds**: 4 estaciones y asignación de subespecialidades existentes (usar `database/seeds/02_catalogos_seeds.sql`).
- Nota: `database/seeds/03_...sql` está desactualizado respecto a V10 (usa `medico_subespecialidad`); no reutilizar tal cual.

### 4.5 Documentación
- Actualizar `docs/GUIA_INTEGRACION_FRONTEND.md` y la colección Postman: `/estaciones`,
  `X-Estacion-Id`, `/topic/estacion/{id}`, `/turnos/estacion/{id}/tablero`.

---

## 5. Impacto en frontend

- **Selector de estación real** (`SeleccionEstacionPage`/`SelectorEstacion`): consume `GET /estaciones`;
  "minilogin" tras iniciar sesión; persiste `hro_estacion`; navega a `/enfermeria`.
- **Cliente axios** (`shared/api/client.js`): enviar `X-Estacion-Id` desde `localStorage.estacion`.
- **Contexto**: exponer estación actual (contexto `Estacion` o extender `AuthContext`); guard de ruta que
  exija estación seleccionada; enlazar `/seleccion-estacion` desde el login/logout.
- **POS de enfermería**: filtrar agenda (cupos) y cola por las subespecialidades de la estación
  (eliminar `clinicas[0]`); `TopHud` muestra la estación real (hoy "ESTACIÓN 04" fijo).
- **Tablero**: dejar `?sala` + `tablero-config.json` (ids de asignación) y pasar a `?estacion=CODE`;
  suscribirse a `/topic/estacion/{id}`; carga inicial con `GET /turnos/estacion/{id}/tablero?fecha=`.
- **Administración (opcional)**: pestaña "Estaciones" en `ClinicasPage` para CRUD y asignación de
  subespecialidades (roles jefe de enfermería/admin).

---

## 6. Fases y tareas

| # | Fase | Entregable |
|---|---|---|
| 1 | Modelo de datos (V12) | Migración + seeds de 4 estaciones |
| 2 | Módulo `estacion` backend | Entidades/repo/servicio/controller + CRUD + asignación |
| 3 | Contexto de estación | Header `X-Estacion-Id` + CORS + bitácora `estacion_acceso` |
| 4 | Turnos/tablero backend | DTO + `/topic/estacion/{id}` + endpoint de tablero por estación + filtros |
| 5 | Frontend selector + POS | Minilogin, persistencia, header, filtrado por estación |
| 6 | Frontend tablero | `?estacion=`, suscripción WS, carga inicial |
| 7 | Administración | Pestaña de gestión de estaciones (opcional) |
| 8 | Docs/Postman | Contrato actualizado |

---

## 7. Riesgos y consideraciones

- **Compatibilidad**: conservar `/topic/tablero` y `/topic/clinica/{id}` para no romper al tablero actual.
- **Subespecialidad sin estación**: sus turnos no aparecerían en ningún tablero → definir comportamiento
  (excluir y avisar en la vista de administración). La cobertura ya se valida con `fn_subespecialidades_sin_asignar`.
- **Día sin horario activo**: aunque pertenezca a la estación, si no tiene horario ese día no debe aparecer.
- **Rotación**: una estación puede tener varias enfermeras; el `X-Estacion-Id` es de sesión, no de usuario.
- **Deploy/entorno**: el backend actual en `main` tenía dos artefactos de merge que impedían compilar/arrancar
  (`ReporteAdminService`, `CupoDiarioRepository`), ya corregidos en esta rama.

---

## 8. Criterios de aceptación

- [ ] Existe `GET /estaciones` con subespecialidades y seeds de 4 estaciones.
- [ ] `PUT /estaciones/{id}/subespecialidades` permite asignar/desasignar (pertenencia única) con roles correctos.
- [ ] Una subespecialidad solo puede pertenecer a una estación (constraint en BD).
- [ ] El backend acepta `X-Estacion-Id` (CORS incluido) y no rompe si falta.
- [ ] Cada tablero recibe solo eventos de su estación por `/topic/estacion/{id}`.
- [ ] `GET /turnos/estacion/{id}/tablero?fecha=` devuelve solo las salas/subespecialidades de la estación.
- [ ] La visibilidad respeta el horario activo del día.
- [ ] El POS filtra agenda/cola por estación y envía el header.
- [ ] Documentación y Postman actualizados.
