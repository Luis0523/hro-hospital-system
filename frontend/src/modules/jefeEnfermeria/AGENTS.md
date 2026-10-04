# AGENTS.md — Área Jefe de Enfermería

Área frontend de operación diaria del **Jefe de Enfermería** del Hospital Regional de Occidente (HRO).
Ruta base: **`/jefe-enfermeria`** · Módulo: `frontend/src/modules/jefeEnfermeria/`.
Rama de trabajo: `frontend-jefe-operativo`.

## Rutas

| Ruta | Pantalla | Propósito |
|---|---|---|
| `/jefe-enfermeria` | `CroquisPage` | Asignación diaria de subespecialidad por espacio físico (sala); cobertura, cierre, duplicar y reasignación en caliente. |
| `/jefe-enfermeria/horarios` | `HorariosPage` | CRUD de horario por subespecialidad (día, horas, capacidad, duración). |
| `/jefe-enfermeria/estaciones` | `EstacionesPage` | Gestión de estaciones (subespecialidades a cargo) + bitácora como mini reportes. |
| `/jefe-enfermeria/reportes` | `ReportesPage` | Citas por estado, demanda por especialidad, utilización de cupos. |

El layout (`JefeEnfermeriaLayout`) y el menú (`MenuLateralJefe`) son propios del área.

## Endpoints consumidos (contrato real del backend)

- Asignación diaria: `GET /asignaciones-diarias/vista?fecha=&nivel=`, `PUT /asignaciones-diarias`
  (`{espacioFisicoId, subespecialidadId, fecha}`), `DELETE /asignaciones-diarias/{id}`,
  `GET /asignaciones-diarias/cobertura?fecha=`, `POST /asignaciones-diarias/cerrar?fecha=`,
  `POST /asignaciones-diarias/duplicar?fechaOrigen=&fechaDestino=`,
  `POST /asignaciones-diarias/{id}/reasignar?nuevoEspacioFisicoId=&motivo=`.
  - **Una sala puede tener varias subespecialidades**; la unicidad es `(espacio, fecha, subespecialidad)`.
- Horario: `GET /subespecialidades/{id}/horarios`, `POST /subespecialidad-horarios`,
  `PUT /subespecialidad-horarios/{id}`, `PATCH /subespecialidad-horarios/{id}/reactivar`,
  `DELETE /subespecialidad-horarios/{id}`.
- Estaciones: `GET /estaciones`, `POST/PUT/DELETE /estaciones...`,
  `PUT /estaciones/{id}/subespecialidades`, `GET /estaciones/{id}/accesos?abiertos=`.
- Catálogos de apoyo: `GET /espacios-fisicos`, `GET /subespecialidades`.
- Reportes: `GET /reportes/citas-por-estado`, `/reportes/demanda-por-especialidad`,
  `/reportes/utilizacion-cupos`.

## Rol y autenticación

- El backend exige rol `jefe_enfermeria` o `administrador` en las escrituras del área.
- Hoy **no hay auth real**: `RequiereRol` está **cableado pero sin bloquear** (`aplicar=false`).
- Identidad simulada ajustable por entorno (`frontend/.env`): `VITE_USUARIO_ID`,
  `VITE_USUARIO_ROL`, `VITE_USUARIO_NOMBRE`. Para probar contra el backend usar
  `VITE_USUARIO_ID=jefe-enfermeria-01` y `VITE_USUARIO_ROL=jefe_enfermeria` (si no, 403).

## Convenciones

- **Usar solo datos del backend**; no inventar endpoints, campos ni reglas. Los mockups son solo
  referencia visual; el diseño real usa los tokens del design system (`bg-surface`, `text-on-surface`,
  `primary`, etc.), **no** el `slate/hro-blue` del panel admin.
- **Responsive obligatorio**: tabla en `xl` y **tarjetas en móvil**; menú overlay en móvil.
- **Mocks**: `api/mockData.js` imita los DTO reales; `USE_MOCK` = `MODE==='test' || VITE_USE_MOCK!=='false'`.
  `reiniciarJefeMock()` reinicia datos para tests.
- Componentes reutilizables: `shared/components/ui/*` (`Button`, `Modal`, `Alert`, `Spinner`, `Icon`).

## Validación (desde `frontend/`)

`npm run test:run` · `npm run lint` · `npm run build` — no considerar terminado un cambio si
introduce errores nuevos.
