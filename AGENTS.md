# AGENTS.md — Sistema Hospitalario HRO

Sistema web hospitalario (citas, agendas y turnos) del Hospital Regional de Occidente.
Monorepo: `frontend/` (React), `backend/` (Java/Spring Boot), `database/` (PostgreSQL/Flyway), `docker/`, `docs/`.
Documentación y UI en **español**.

## Rama y alcance
- Rama activa: `frontend-estacion-enfermeria`. El trabajo de esta rama es **solo frontend**.
- Esta rama está **11 commits detrás de `main`** y NO incluye backend/BD. Decisión del equipo: no mergear `main` aquí.
- `main` sí tiene el backend Spring Boot completo (paquetes por dominio: `paciente`, `clinica`, `medico`, `cita`, `agenda`, `turno`, `laboratorio`, `auditoria`).
- CI (`.github/workflows/ci.yml`) **solo corre en `main` y `develop`**; los push a `frontend-*` no ejecutan CI. Antes de mergear, el job de frontend hace `npm ci || npm install` y `npm run build`.

## Comandos
Desde `frontend/`:
- `npm install`
- `npm run dev` — Vite en http://localhost:5173
- `npm run build` — genera `frontend/dist/` (es lo que valida el CI)
- `npm run lint` — ESLint (`.eslintrc.cjs`)
- `npm run test:run` — Vitest + Testing Library (usa `test` para watch)
- `npm run format` / `format:check` — Prettier
- `npm run preview`

Backend (existe en `main`, no en esta rama; para levantarlo):
- Java 21 + Maven Wrapper: `./mvnw spring-boot:run` desde `backend/`
- Corre en **http://localhost:8081** con context-path **`/api/v1`**.
- Infra local desde la raíz: `docker-compose up -d` (PostgreSQL 15 + Redis 7).

## Frontend
- Stack: React 18 + Vite 5 + Tailwind 3 + React Router 6 + Headless UI, **JavaScript/JSX** (sin TypeScript).
- Alias `@/` → `src/` (configurado en `vite.config.js` y `jsconfig.json`). Usarlo en imports cross-carpeta.
- UI kit en `src/shared/components/ui/` (`Button`, `Input`, `Select`, `Card`, `EstadoBadge`, `Modal`, `Alert`, `EmptyState`, `Spinner`, `Table`, `Icon`, `Toast`) exportado por `index.js`.
- Pantalla de Enfermería = **una sola pantalla POS** en `src/modules/enfermeria/pages/EnfermeriaPage.jsx` (sin navbar): encabezado (`TopHud`), filtro de clínicas (`ClinicFilter`), calendario (`CalendarioMensual`), cola y estados de turno (`ColaPanel`), confirmación de llegada (`ConfirmacionCita`) y barra de lector (`ScannerDock`).
- Atajos de teclado en la pantalla POS: `Alt+S` enfoca el lector, `Alt+N` pasa el siguiente turno, `Esc` cierra la confirmación.
- Agendamiento: al seleccionar un día con cupo (o al escanear un paciente sin cita hoy) se abre `AgendaPanel` → elegir cupo (clínica/médico) → **"Agendar cita"** (`POST /citas`) → comprobante con ventana de presentación. El `409` (sin cupo) se detecta por `error.status`.
- Estados transversales con Context: `src/shared/context/AuthContext.jsx` (usuario simulado en dev) y `ToastContext.jsx`.
- **Tema claro/oscuro:** `src/shared/context/ThemeContext.jsx` (`useTema`, persistencia `localStorage.hro_tema`, default `prefers-color-scheme`), botón en `TopHud`. Los tokens de color de Tailwind son **variables CSS** definidas en `src/index.css` (`:root` claro / `.dark` oscuro); `darkMode: 'class'` en `tailwind.config.js`. Script anti-FOUC en `index.html`.
- Estructura:
  - `src/router/AppRouter.jsx` — `/` → `/enfermeria` (pantalla POS); otras estaciones como placeholder.
  - `src/modules/enfermeria/{pages,components,api}/`
  - `src/shared/{api,ws,context,components/{ui},utils}/` — reutilizable entre estaciones.
  - Futuras estaciones en `src/modules/{archivo,administracion,tablero}/` (placeholder) con ruta propia.
- El diseño de referencia POS está en `context/mock/estacion/` (`DESIGN.md`, `code.html`, `screen.png`). No recrear el proyecto React; trabajar dentro de `frontend/`.

## Integración con el backend
- Contrato oficial: `docs/postman/` (colección v2.1) y `docs/GUIA_INTEGRACION_FRONTEND.md`.
- **Backend desplegado:** `https://hro-hospital-api.fly.dev/api/v1` (definido en `frontend/.env`). Local alternativo: `http://localhost:8081/api/v1`.
- `VITE_API_URL` (default `/api/v1`) y `VITE_WS_URL` (default `/api/v1/ws`).
- Vite proxya `/api` (con `ws: true`) a `VITE_BACKEND_URL` para evitar CORS.
- `vite.config.js` define `global: 'globalThis'` — **necesario** para `sockjs-client`. No quitar.
- `VITE_USE_MOCK=false` en `.env` conecta al backend real; con `true` usa `modules/enfermeria/api/mockData.js`. **En modo test (Vitest) siempre se usa mock** (`import.meta.env.MODE === 'test'`).
- **Auth mock por cabeceras:** `client.js` envía `X-Usuario-Id`, `X-Usuario-Rol`, `X-Usuario-Nombre` desde `AuthContext`/`localStorage` (default `enfermeria-01`). `usuarioId` en cuerpos/query ya **no se usa**.
- El backend envuelve respuestas en `ApiResponse`: `{ timestamp, success, message, data }`. El cliente axios devuelve el body; las APIs hacen `respuesta.data`.
- Endpoints de Enfermería (contrato real):
  - `POST /turnos/check-in` `{ citaId }` · `GET /turnos/clinica/{clinicaId}?fecha=YYYY-MM-DD` · `GET /turnos/activos`
  - `POST /turnos/{id}/llamar` · `/no-responde?motivo=` · `/reintegrar` `{motivo}` · `/atendido`
  - `POST /citas` `{ pacienteId, cupoDiarioId }` · `GET /citas/{id}` · `GET /citas/paciente/{id}`
  - `GET /pacientes/buscar?filtro=` (paginado, `data.content`), `/pacientes/dpi/{dpi}`, `/pacientes/expediente/{exp}`
  - `GET /cupos?clinicaId=&fechaInicio=&fechaFin=` · `GET /dias-no-laborables?anio=`
  - **Catálogos: `/clinicas`, `/especialidades`, `/subespecialidades`, `/medicos`** (NO existe `/catalogos/*`).
- Código `409` = cupos agotados: mostrar alerta destacada sugiriendo otra fecha/médico.
- WebSocket: STOMP sobre SockJS en `/api/v1/ws`; topics `/topic/tablero` y `/topic/clinica/{clinicaId}`. Ver `src/shared/ws/turnosSocket.js`.

## Gotchas
- No commitear `context/` (notas locales `avances/`, `instrucciones/`, `mock/`); está en `.git/info/exclude`.
- `frontend/.env` (ignorado por Git) apunta al backend desplegado; `.env.example` documenta las variables.
- `docs/` se trajo de `main` de forma parcial con `git checkout origin/main -- docs/`; contiene la colección Postman y la guía de integración (fuente de verdad de endpoints).
- `.gitignore` de la rama ignora `cinbtext.md` (typo), no `cibtext.md`. `cibtext.md` sí está versionado y es la fuente de contexto del diseño (entidades, lógica de turnos/inasistencia).
- Posible desajuste CI/Java: el workflow usa JDK 17 pero `backend/pom.xml` (en `main`) declara `java.version=21`. Verificar antes de tocar backend.
