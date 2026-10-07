# Desplegar el frontend en Vercel (+ Keycloak de producción)

> **Objetivo:** publicar el frontend (React/Vite) en Vercel apuntando al backend de Fly
> (`https://hro-hospital-api.fly.dev/api/v1`), con autenticación real por Keycloak en una
> fase posterior. Hoy la app funciona en modo `mock` (cabeceras), suficiente para pruebas.

---

## 1. ¿Qué falta para Vercel?

Casi nada por el lado del backend. Los pendientes reales son:

| # | Pendiente | Estado |
|---|---|---|
| 1 | **URL absoluta del API** (Vercel no tiene el proxy de Vite) | Config en Vercel (`VITE_API_URL`) |
| 2 | **SPA rewrite** para que las rutas funcionen al refrescar | ✅ ya en `frontend/vercel.json` |
| 3 | **CORS del backend** | ✅ ya abierto (`CorsConfig`: `allowedOriginPatterns("*")`) |
| 4 | **Auth real (Keycloak)** | Pendiente (la grande) — §4 |

> En modo **mock** (actual), cualquiera que abra la app entra como el usuario simulado
> (`admin-hro-01` → rol `administrador`). Válido para demo/pruebas, **no** para producción.

---

## 2. Configurar el proyecto en Vercel

1. Importar el repositorio en Vercel y crear el proyecto.
2. **Root Directory:** `frontend` (el `package.json` está ahí).
3. Framework: **Vite** (auto). Build: `npm run build`. Output: `dist`.
   - `frontend/vercel.json` ya fija build, output y el rewrite SPA.
4. **Environment Variables (Production):**

```
VITE_API_URL=https://hro-hospital-api.fly.dev/api/v1
VITE_WS_URL=https://hro-hospital-api.fly.dev/api/v1/ws-turnos
VITE_BACKEND_URL=https://hro-hospital-api.fly.dev
VITE_USE_MOCK=false

# Auth (ver §4). Con mock:
VITE_AUTH_MODE=mock
```

Con `VITE_AUTH_MODE=keycloak` (producción), además:

```
VITE_AUTH_MODE=keycloak
VITE_KEYCLOAK_URL=https://<keycloak-host>          # p. ej. https://hro-keycloak.fly.dev
VITE_KEYCLOAK_REALM=hro
VITE_KEYCLOAK_CLIENT_ID=hro-frontend
```

5. Redeploy. Verificar que las rutas profundas (p. ej. `/archivo`, `/coex`) carguen al refrescar
   (gracias al rewrite).

---

## 3. Backend (Fly) — sin cambios para modo mock

El backend ya está desplegado y con CORS abierto. Solo recuerda:
- `HRO_AUTH_MODE=mock` (actual): autoriza por cabeceras `X-Usuario-*`.
- La integración con el hospital usa los secrets `API_HRO_URL_EXPEDIENTES`, `USERNAME_API_HRO`,
  `PASSWORD_API_HRO` (ya configurados).

---

## 4. Keycloak de producción (auth real)

Hoy `frontend/src/shared/api/authApi.js` autentica con **Direct Access Grant** (usuario/contraseña
→ `POST /realms/hro/protocol/openid-connect/token`). Es un `fetch` del navegador, así que Keycloak
debe: (a) estar hosteado con HTTPS, y (b) permitir el origen de Vercel (CORS) en su cliente.

### 4.1 Levantar Keycloak (recomendado: una app en Fly)

Keycloak necesita su propia base de datos.
```
# 1) Base de datos Postgres para Keycloak (Fly Postgres)
flyctl postgres create --name hro-keycloak-db --region dfw

# 2) App Keycloak
flyctl apps create hro-keycloak
# En la app Keycloak: variables
#   KC_DB=postgres, KC_DB_URL=..., KC_DB_USERNAME=..., KC_DB_PASSWORD=...
#   KC_HOSTNAME=hro-keycloak.fly.dev
#   KEYCLOAK_ADMIN / KEYCLOAK_ADMIN_PASSWORD
#   comando: start-dev --import-realm  (o start --optimized tras configurar)
# 3) Importar el realm existente docker/keycloak/realm-hro.json
```
Alternativas: un Keycloak gestionado o el realm real del hospital.

### 4.2 Configurar el realm/cliente (Admin Console: `https://<keycloak>/admin`)

En el realm `hro`, cliente **`hro-frontend`**:
- **Direct Access Grants Enabled:** ✔ (el login actual usa usuario/contraseña).
- **Web Origins:** agregar el dominio de Vercel y local, p. ej.
  `https://<tu-app>.vercel.app` (o `+` / `*` mientras se estabiliza).
- **Valid Redirect URIs:** agregar `https://<tu-app>.vercel.app/*` (por si luego se usa flujo con redirección).
- Cliente **público** (sin secret) ya que hace `grant_type=password` desde el navegador.

Roles: crear los roles operativos (`archivo`, `enfermeria`, `administrador`, `jefe_enfermeria`,
`personal_citas`, `medico`, …) y asignarlos a los usuarios. El frontend lee el rol del `realm_access.roles`.

### 4.3 Pasar el backend a Keycloak

En Fly (backend):
```
flyctl secrets set HRO_AUTH_MODE=keycloak \
  SPRING_SECURITY_OAUTH2_RESOURCESERVER_JWT_ISSUER_URI=https://<keycloak-host>/realms/hro
```
Con eso el backend valida el **JWT** del usuario (deja de confiar en las cabeceras `X-Usuario-*`).

### 4.4 Pasar el frontend a Keycloak

En Vercel (env vars) poner `VITE_AUTH_MODE=keycloak`, `VITE_KEYCLOAK_URL`, realm y client (§2) y redeploy.

---

## 5. Administrar

- **Keycloak Admin Console** (`https://<keycloak>/admin`): usuarios, roles, clientes, sesiones, políticas de contraseña. Los roles y usuarios viven en Keycloak (no en la BD del sistema).
- **Panel de la app** (`/administracion`, solo rol `administrador`): roles → páginas del SIGHO, catálogos (clínicas/especialidades/espacios), cupos, calendario institucional, reportes y auditoría.
- **Estación de Archivo** (`/archivo`): operación del circuito de carnets/expedientes.

---

## 6. Checklist rápido

- [ ] Proyecto Vercel con root `frontend` y env vars de §2.
- [ ] Rutas profundas cargan al refrescar (`vercel.json`).
- [ ] `VITE_API_URL`/`VITE_WS_URL` absolutos a Fly.
- [ ] (Producción) Keycloak hosteado + `webOrigins` con el dominio de Vercel + `HRO_AUTH_MODE=keycloak` en el backend + `VITE_AUTH_MODE=keycloak` en el frontend.
