\# AGENTS.md — Panel de Administración HRO



\## Contexto



Este módulo pertenece al sistema web hospitalario del Hospital Regional de Occidente (HRO).



Rama de trabajo:



`frontend-administrador`



El trabajo de esta rama corresponde exclusivamente al FRONTEND del Panel de Administración.



\## Área principal de trabajo



La implementación propia del módulo debe permanecer en:



`frontend/src/modules/administracion/`



Única modificación cross-module prevista:



`frontend/src/router/AppRouter.jsx`



para registrar las rutas del Panel de Administración.



Antes de modificar cualquier otro archivo fuera del módulo, justificar la necesidad y solicitar autorización.



\---



\## Restricciones de alcance



NO modificar:



\- `frontend/src/modules/enfermeria/`

\- `frontend/src/modules/archivo/`

\- `frontend/src/modules/tablero/`



NO modificar `frontend/src/shared/` salvo necesidad técnica real y previamente autorizada.



NO modificar backend ni base de datos.



NO crear un proyecto React nuevo.



NO introducir una nueva biblioteca de estilos.



NO crear una segunda instancia de Axios.



NO agregar WebSocket al Panel de Administración.



NO inventar endpoints del backend.



NO implementar en frontend reglas de negocio que correspondan al backend.



NO hacer commit ni push salvo instrucción explícita del usuario.



\---



\## Stack del frontend



Seguir el stack existente del repositorio:



\- React 18

\- Vite 5

\- JavaScript / JSX

\- React Router 6

\- TailwindCSS 3

\- Axios mediante `src/shared/api/client.js`

\- Vitest

\- React Testing Library



Usar el alias:



`@/`



para imports entre carpetas cuando corresponda.



\---



\## Componentes compartidos



Antes de crear componentes básicos nuevos, revisar:



`frontend/src/shared/components/ui/`



Reutilizar cuando corresponda:



\- Button

\- Input

\- Select

\- Card

\- EstadoBadge

\- Modal

\- Alert

\- EmptyState

\- Spinner

\- Table

\- Icon

\- Toast



Para autenticación y mensajes revisar:



\- `shared/context/AuthContext.jsx`

\- `shared/context/ToastContext.jsx`



Para HTTP utilizar exclusivamente:



`shared/api/client.js`



\---



\## Estructura esperada del módulo



Mantener una estructura equivalente a:



frontend/src/modules/administracion/

├── pages/

├── components/

├── api/

│   ├── administracionApi.js

│   └── mockData.js

└── hooks/



Crear carpetas únicamente cuando sean necesarias.



No generar abstracciones prematuras.



\---



\## Navegación interna



El Panel de Administración requiere navegación propia.



Rutas previstas:



\- `/administracion`

\- `/administracion/usuarios`

\- `/administracion/clinicas`

\- `/administracion/cupos`

\- `/administracion/calendario`

\- `/administracion/reportes`

\- `/administracion/auditoria`



No debe existir desde este panel navegación visible hacia Enfermería, Archivo o Tablero de Turnos.



\---



\## Secciones funcionales



\### Dashboard



Resumen general.



Puede mostrar:



\- citas del día;

\- cupos disponibles;

\- inasistencias;

\- alertas administrativas.



No duplicar tablas completas de otras secciones.



\### Usuarios y roles



Administrar usuarios locales provenientes del proveedor externo de autenticación.



El frontend NO administra contraseñas ni credenciales.



Debe contemplar:



\- listado;

\- activación/desactivación;

\- roles locales;

\- permisos por clínica.



\### Clínicas



La sección se diseña alrededor del contrato vigente del backend; ver "Modelo de dominio y backend".



No asumir una jerarquía de persistencia concreta (por ejemplo Especialidad → Subespecialidad → Clínica) como modelo obligatorio.



Si el backend vigente modela el concepto de "clínica" mediante otros recursos (por ejemplo espacio físico, asignación diaria u otra estructura), la UI debe adaptarse a ese modelo real.



También deberá contemplarse la asociación entre médicos y clínicas según el contrato vigente del backend.



\### Cupos y capacidad



La interfaz configura parámetros.



El frontend NO calcula disponibilidad real ni genera `cupo\_diario`.



Esas reglas pertenecen al backend.



\### Calendario institucional



Administrar días no laborables.



Ante un conflicto de citas:



1\. enviar solicitud;

2\. mostrar el resultado devuelto por backend;

3\. solicitar confirmación explícita;

4\. reenviar con opción de forzar si el contrato lo permite.



El frontend NO determina por sí mismo si existen conflictos.



\### Reportes



Mostrar resultados calculados por backend.



Como mínimo contemplar:



\- citas programadas;

\- atendidas;

\- canceladas;

\- reprogramadas;

\- inasistencias;

\- demanda por especialidad/subespecialidad;

\- utilización de cupos.



Filtros mínimos:



\- rango de fechas;

\- clínica cuando aplique.



No calcular reportes agregados en frontend.



\### Auditoría



Vista exclusivamente de lectura.



Filtros previstos:



\- usuario;

\- fecha;

\- tipo de acción.



No editar ni eliminar registros de auditoría.



\---



\## API y mocks



Utilizar:



`shared/api/client.js`



No importar Axios directamente dentro del módulo.



Mientras los endpoints definitivos no estén disponibles, utilizar mocks claramente identificados.



Debe poder alternarse mediante el mecanismo existente de:



`VITE\_USE\_MOCK`



No inventar un contrato definitivo de backend.



Si falta un endpoint:



1\. utilizar mock;

2\. documentar el contrato esperado;

3\. marcarlo como pendiente de coordinación con backend.



\---



\## Responsive



Todas las secciones deben ser utilizables tanto en:



\- computadora;

\- teléfono.



Las tablas extensas deben adaptarse de forma razonable a pantallas pequeñas.



No sacrificar funcionalidad esencial en móvil.



\---



\## Flujo de trabajo



Para cada fase:



1\. analizar;

2\. proponer plan;

3\. esperar aprobación cuando la tarea sea significativa;

4\. implementar;

5\. revisar `git diff`;

6\. ejecutar pruebas relevantes;

7\. ejecutar lint;

8\. ejecutar build cuando la fase lo amerite;

9\. corregir errores antes de continuar.



No implementar varias fases grandes simultáneamente.



\---



\## Comandos de validación



Ejecutar desde `frontend/`:



`npm run test:run`



`npm run lint`



`npm run format:check`



`npm run build`



No considerar terminada una fase si introduce errores nuevos.



\---



\## Modelo de dominio y backend



El frontend del Panel de Administración debe adaptarse a los contratos y al modelo vigente expuesto por el backend.



No asumir relaciones de persistencia basándose únicamente en:



\- mockups;

\- documentación histórica;

\- conversaciones anteriores;

\- esquemas de base de datos obsoletos;

\- nombres utilizados antiguamente por la interfaz.



Antes de implementar una funcionalidad que dependa de datos del servidor, verificar:



1\. controladores REST vigentes;

2\. DTOs/request/response utilizados por esos controladores;

3\. servicios relacionados cuando sean necesarios para comprender el comportamiento;

4\. colección Postman, Swagger/OpenAPI o documentación de integración vigente;

5\. migraciones/modelo de persistencia actual como apoyo para comprender la semántica.



El frontend consume contratos de API; no debe depender directamente de nombres internos de tablas PostgreSQL.



Si el requerimiento funcional utiliza el término "clínica", pero el backend vigente modela ese concepto mediante otros recursos (por ejemplo espacio físico, asignación diaria u otra estructura), primero debe analizarse el contrato real y diseñar la UI alrededor de él.



No inventar:



\- endpoints;

\- payloads;

\- campos;

\- relaciones;

\- estados;

\- reglas de negocio



para reproducir un modelo histórico que ya no corresponda al backend actual.



Los mocks del frontend deben imitar el contrato backend que haya sido confirmado. No deben convertirse en un modelo alternativo al backend.



\---



\## Prioridad de fuentes



Cuando existan contradicciones, utilizar este orden:



1\. Contratos REST y código backend vigente que implemente dichos contratos.

2\. Documentación técnica vigente del repositorio (Postman, Swagger/OpenAPI, guía de integración).

3\. Estado real del repositorio y modelo/migraciones actuales cuando ayuden a interpretar el contrato.

4\. Requerimientos funcionales del Panel de Administración y Jira.

5\. Mockups visuales.

6\. Supuestos del agente.



Los requerimientos funcionales definen QUÉ debe poder hacer el administrador.



El backend vigente define CÓMO están estructurados y expuestos los datos que el frontend debe consumir.



Si existe una contradicción que no pueda resolverse examinando el repositorio, marcarla como:



PENDIENTE DE CONFIRMACIÓN



y no inventar una solución.



\---



\## Regla fundamental



El Panel de Administración:



SOLICITA datos,

MUESTRA información,

EDITA configuración,

y REFLEJA decisiones del backend.



No replica lógica de negocio del servidor.

## Estado vigente del módulo y contrato de referencia

Esta sección **sustituye por completo** a la antigua sección "Estado final del módulo (cierre Fase 10)". Se deriva del contrato/backend vigente y de la documentación técnica del repositorio; donde contradiga reglas anteriores de este documento, prevalece esta sección.

No agregar a este documento datos volátiles (posicionamiento de rama, hashes de Git, cantidad de tests, nombres de bundles del build ni fechas), porque quedan obsoletos con rapidez y no son reglas permanentes.

Claves usadas en esta sección:

- **[A]** contrato documentado confirmado.
- **[B]** requerimiento frontend confirmado.
- **[C]** pendiente de verificación contra backend desplegado.

### Fuentes de verdad (prioridad)

1. Contrato/backend desplegado vigente.
2. Colección Postman v2.2.0 y documentación técnica vigente.
3. `ACTUALIZACION_ADMIN_FRONTEND.md`, `GUIA_INTEGRACION_FRONTEND.md` y documentos de flujo.
4. Jira, para alcance funcional.
5. `docs/mockups/panelAdmin/`, para UX/presentación.
6. Este AGENTS, como guía operativa derivada de las anteriores.

Este documento nunca debe contradecir el contrato vigente.

### Convenciones de contrato

- Identidad por cabeceras `X-Usuario-Id`, `X-Usuario-Rol`, `X-Usuario-Nombre` (enviadas por `shared/api/client.js`). No enviar `creadoPorId`.
- Envoltura de respuesta `ApiResponse`: `{ timestamp, success, codigo, message, data }`.
- Manejo programático de errores por `codigo` (no por el texto de `message`).
- Códigos relevantes: `DIA_NO_LABORABLE_CON_CITAS` (409), `DIA_NO_LABORABLE_YA_EXISTE` (400), `CUPOS_AGOTADOS` (409), `ACCESO_DENEGADO` (403).
- Filtro de estado en listados administrativos: `?estado=activos|inactivos|todos` (omitido = `activos`).

#### Errores estructurados — F0B (implementado)

`frontend/src/shared/api/client.js` preserva de forma retrocompatible en el `Error` normalizado: `message`, `status`, `codigo`, `data` y `response` (referencia original de Axios).

Semántica de las propiedades derivadas de `ApiResponse`:

- propiedad ausente → `undefined`;
- el backend envía `null` → se conserva `null`;
- el backend envía un valor → se conserva exactamente.

La lógica frontend debe usar `codigo` para errores estructurados y `message` únicamente para presentación.

### Estado por sección

**Dashboard** — [A] `GET /dashboard/resumen?fecha=` (opcional; default "hoy" del servidor) devuelve indicadores y `alertas[]` (`codigo`/`severidad`/`mensaje`). El frontend usa un único endpoint agregado, envía `fecha=hoyISO()` para el resumen actual y **no recalcula métricas ni inventa alertas**: solo presenta los valores (incluida `tasaInasistencia`, que ya es un porcentaje calculado).

**Catálogos (especialidades, subespecialidades, espacios físicos)** — [A] `?estado=` (default `activos`), `DELETE /{id}` (baja lógica: `activo=false`, HTTP 200) y `PATCH /{id}/reactivar` (`activo=true`, HTTP 200, idempotente). Confirmado en el backend vigente (`origin/backend-admin` y `origin/main`).

**Médicos** — [A] `?estado=`, `PATCH /{id}/reactivar` y `POST/PUT` con `numeroColegiado` (obligatorio, ≤50, único, persistido y presente en `MedicoResponseDTO` y `MedicoSubespecialidadResponseDTO`; SCRUM-92 cubierto).

**Programación** — [A] listado general `GET /medico-subespecialidades?medicoId=&subespecialidadId=&diaSemana=&estado=`, alta `POST /medico-subespecialidades` (**un registro por día**: `diaSemana` escalar; no existe endpoint batch ni `diasSemana[]` en backend), `PUT /{id}` para editar horario/capacidad/duración (no cambia médico/subespecialidad/día) y `PATCH /{id}/reactivar`. [A] Alta multidía (F9.5 / SCRUM-90): el frontend permite seleccionar varios días con horario/capacidad/duración compartidos y crea **N POST secuenciales** (un `diaSemana` por request); `diasSemana[]` es solo estructura interna del frontend y **nunca** se envía al backend. **Sin** `Promise.all` ni rollback: si un día falla, los éxitos se conservan, se muestra el resultado por día (`role="status"`) y el reintento envía **solo los días fallidos**. La edición permanece de un **único día** (`PUT` no modifica `diaSemana`). El backend conserva la validación de duplicado/solapamiento/reglas.

**Calendario institucional** — [A] `GET /dias-no-laborables`, `/futuros` y `/rango?inicio=&fin=` (inclusivo, ascendente; smoke test desplegado OK); `POST /dias-no-laborables` `{ fecha, motivo, forzar }` → `201`; duplicado → `400` `codigo=DIA_NO_LABORABLE_YA_EXISTE`; conflicto → `409` `codigo=DIA_NO_LABORABLE_CON_CITAS` con `data:{ codigo, fecha, totalCitas, citas[] }`; `PUT /{id}` `{ motivo }` (la fecha no cambia); `DELETE /{id}` habilita la fecha.
[B] Navegación directa `[ < ] [ Mes ▼ ] [ Año ▼ ] [ > ]` y **vista anual** agrupada por mes con selector de año (una sola consulta por rango anual).
[A] `forzar=true` **solo registra el día**: NO cancela, modifica ni reprograma citas (quedan pendientes de gestión manual). La decisión funcional se toma por `codigo`/`data`, no por el texto de `message`.

> **Validación manual del flujo `DIA_NO_LABORABLE_CON_CITAS` → `forzar=true`:** debe realizarse normalmente con `VITE_USE_MOCK=true` (fecha mock `2026-09-20`). No deben crearse citas ni días no laborables en el backend desplegado únicamente con el propósito de provocar este error; las operaciones mutantes contra el backend real quedan reservadas para una prueba de integración controlada posterior. La prueba puntual realizada en F4 contra el backend real fue únicamente `GET /dias-no-laborables/rango` y no modificó datos.

**Usuarios, roles y permisos** — [A] usuarios (`GET /usuarios?estado=&rol=`, `GET /{id}`, `PATCH /{id}/activar|desactivar` idempotentes, `PUT /{id}/rol` `{rolPrincipal}`), `GET /roles` (6 roles) y permisos **por subespecialidad** (`GET /usuarios/{id}/permisos`, `GET /permisos-subespecialidad`, `POST` que reactiva si existía inactivo, `PATCH /{id}/desactivar|reactivar`). Los usuarios se aprovisionan **JIT** desde el proveedor de identidad: **no existe `POST /usuarios`** ni gestión de contraseñas. Tipos de permiso confirmados del enum backend: `avanzar_turno`, `generar_orden_laboratorio`, `autorizar_cupo` (no hay endpoint de catálogo de tipos). Contrato vigente: los endpoints de este módulo **no tienen restricción de rol declarada** (`anyRequest().permitAll()`); el único `@PreAuthorize` actual está en Auditoría.

**Reportes** — [A] `GET /reportes/citas-por-estado`, `/reportes/demanda-por-especialidad` y `/reportes/utilizacion-cupos` con `fechaInicio`/`fechaFin` (default backend: `fin=hoy`, `inicio=fin−30 días`; el frontend envía **fechas locales explícitas**). `porEstado` es un mapa dinámico (no asumir claves ni orden); `utilizacionPorcentaje` ya viene calculado (0–100). Rango inválido (`fechaFin<fechaInicio`) → `400`. El frontend solo muestra: **no recalcula métricas** ni agrega en cliente. **No existe exportación** (Excel/PDF/CSV/Imprimir) y **no** debe usarse `GET /cupos` para construir estadísticas. Endpoints en `permitAll` (sin restricción de rol declarada).

**Auditoría** — [A] `GET /auditoria` paginado (`tabla`, `usuarioId`, `accion`, `fechaInicio`, `fechaFin`, `page`, `size`; sin control de `sort`), `page` base 0, `size` default 20, orden `fecha` DESC. Restringido con `@PreAuthorize("hasRole('administrador')")`; otros roles → `403` `codigo=ACCESO_DENEGADO` (verificado contra backend desplegado: `enfermeria` → 403, `administrador` → 200). DTO de 9 campos: `id`, `tablaAfectada`, `entidadId` (String), `accion`, `usuarioId` (Long|null), `usuarioNombre` (String|null), `valoresAnteriores` (String|null), `valoresNuevos` (String|null), `fecha` (OffsetDateTime); **no** exponer `usuarioReferencia`. `tabla`/`accion` se comparan por **igualdad case-insensitive**; `fechaInicio`/`fechaFin` son ISO `YYYY-MM-DD` y **`fechaFin` es inclusiva de todo el día**; `fechaFin<fechaInicio` **no produce 400** (devuelve página vacía). `valoresAnteriores`/`valoresNuevos` son **JSON en string** → parseo seguro (`JSON.parse`, nunca `eval`; si falla, mostrar el texto original). Vista de **solo lectura**: sin editar/eliminar/restaurar/exportar/copiar; puede contener **PII**, por lo que el detalle se abre bajo demanda (nunca en la tabla) y no se registra en consola. No existe endpoint catálogo de tablas/acciones: los filtros son texto libre con sugerencias **no exhaustivas**.

**Disponibilidad / reprogramación (F9)** — [A] Reprogramación manual de una cita afectada, integrada al conflicto del Calendario (409 `DIA_NO_LABORABLE_CON_CITAS`). Flujo de 2 pasos sobre la **misma programación** (conserva médico y subespecialidad): `GET /citas/{id}/disponibilidad?fechaInicio=&fechaFin=` (default `hoy..+14`; `fin<inicio` → 400) devuelve `CupoDiarioResponseDTO` (seleccionable solo si `disponible = cuposDisponibles>0`), y `POST /citas/{id}/reprogramar` `{ nuevoCupoDiarioId (UUID), motivo }` (motivo obligatorio) → **201** con la **nueva** cita `pendiente`; la original pasa a `reprogramada` y libera su cupo. Estados terminales (`atendida|cancelada|reprogramada|no_asistio`) → 400. Cupo ocupado concurrentemente → 409 `CUPOS_AGOTADOS` (el frontend refresca la disponibilidad y exige nueva selección; **no** reintenta automáticamente). **No se usa `GET /cupos` en el frontend de F9** (desplegado y `origin/main` difieren en sus filtros y `/cupos` puede inicializar `cupo_diario`; la disponibilidad de la cita ya encapsula). `GET /citas/{id}/disponibilidad` también puede inicializar `cupo_diario`. **No existe reprogramación automática** y **no hay endpoint** para volver a listar las citas afectadas de un día ya bloqueado: el flujo vive solo mientras se conserva el payload del conflicto en memoria (sin `localStorage`). PII: mostrar lo mínimo, sin log/copia/exportación.

### Reactivación y baja lógica

La reactivación se realiza con `PATCH /{id}/reactivar` (documentada en especialidades, subespecialidades, espacios físicos, médicos y programación). La baja lógica se realiza con `DELETE /{id}` (`activo=false`, HTTP 200), confirmada en el backend vigente para los tres catálogos. No implementar reactivación fuera del contrato vigente.

### Clínicas

No existe una entidad "Clínica" vigente: el concepto se modela mediante especialidad, subespecialidad y espacio físico. No reintroducir `clinicaId`.

### Referencia visual del módulo

- `docs/mockups/panelAdmin/` es la referencia visual del módulo.
- Usar los tokens M3 ya definidos en `tailwind.config.js`; no repetir colores hex arbitrarios cuando exista un token.
- Los mockups gobiernan presentación/UX, **no** contratos backend.
- Si un mockup contradice el contrato o Jira, prevalece el contrato funcional.
- Conservar el responsive móvil existente aunque el mockup sea desktop.
- La alineación visual con los mockups está en alcance y se aplica por fase; no se difiere toda al final.

### Deuda técnica conocida (vigente)

- Limitaciones heredadas de `shared/ui` (`Input`, `Select`, `Modal`, `Table`) y del scrollbar global.
- `format:check` global falla por archivos ajenos al módulo.
- Contratos pendientes de verificación contra backend desplegado (marcados [C] en esta sección): creación parcial de programación (SCRUM-90); significado original de SCRUM-91 (no se usa para justificar el selector mes/año del Calendario, que es un requerimiento frontend confirmado).

### Regla fundamental

EL FRONTEND SE ADAPTA AL BACKEND VIGENTE.

No inventar endpoints, payloads, relaciones, estados ni reglas de negocio.

