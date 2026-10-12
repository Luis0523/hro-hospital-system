/**
 * Autenticación contra Keycloak por Direct Access Grant (usuario/contraseña).
 *
 * Opción B acordada: el formulario es propio (mockup SIGHO) y canjea las
 * credenciales en el endpoint de token del realm. El rol se lee del propio JWT;
 * los roles se administran en Keycloak, no en la base del sistema.
 */

const KEYCLOAK_URL = import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8090'
const KEYCLOAK_REALM = import.meta.env.VITE_KEYCLOAK_REALM || 'hro'
const KEYCLOAK_CLIENT_ID = import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'hro-frontend'

/**
 * Roles internos de Keycloak que NO representan un rol operativo del SIGHO.
 * Cualquier otro rol del realm (incluidos roles nuevos como "tecnico") se
 * considera válido, de modo que no haya que tocar código al crear roles.
 */
const ROLES_IGNORADOS = new Set(['offline_access', 'uma_authorization'])

function esRolOperativo(rol) {
  return typeof rol === 'string' && !ROLES_IGNORADOS.has(rol) && !rol.startsWith('default-roles-')
}

/** Ruta inicial de cada rol. */
export function inicioPorRol(rol) {
  switch (rol) {
    case 'archivo':
      return '/archivo'
    case 'administrador':
      return '/administracion'
    case 'jefe_enfermeria':
      return '/jefe-enfermeria'
    case 'enfermeria':
    case 'medico':
    case 'personal_citas':
    default:
      return '/enfermeria'
  }
}

/** Decodifica el payload de un JWT (sin validar firma; el backend la valida). */
function decodificarJwt(token) {
  const parte = token.split('.')[1]
  if (!parte) throw new Error('Token inválido')
  const base64 = parte.replace(/-/g, '+').replace(/_/g, '/')
  const json = decodeURIComponent(
    atob(base64)
      .split('')
      .map((caracter) => '%' + caracter.charCodeAt(0).toString(16).padStart(2, '0'))
      .join(''),
  )
  return JSON.parse(json)
}

/** Construye la identidad de la app a partir del access token. */
export function usuarioDesdeToken(token) {
  const claims = decodificarJwt(token)
  const roles = Array.isArray(claims?.realm_access?.roles) ? claims.realm_access.roles : []
  const rol = roles.find(esRolOperativo) || null
  return {
    idExterno: claims.preferred_username || claims.sub,
    nombre: claims.name || claims.preferred_username || '',
    rol,
  }
}

/** Epoch (ms) en que expira un access token, o null si no se puede determinar. */
export function expiracionDeToken(token) {
  if (!token) return null
  try {
    const claims = decodificarJwt(token)
    return typeof claims?.exp === 'number' ? claims.exp * 1000 : null
  } catch {
    return null
  }
}

function urlToken() {
  return `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`
}

/** POST al endpoint de token de Keycloak. Devuelve el cuerpo crudo o lanza con `status`. */
async function pedirToken(cuerpo) {
  const respuesta = await fetch(urlToken(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: cuerpo,
  })
  const datos = await respuesta.json().catch(() => ({}))

  if (!respuesta.ok || !datos.access_token) {
    const error = new Error(
      datos.error_description || datos.error || 'No se pudo iniciar sesión',
    )
    error.status = respuesta.status
    throw error
  }
  return datos
}

/** Normaliza la respuesta de Keycloak a la forma interna de la app. */
function normalizarSesion(datos) {
  const expiraEn =
    typeof datos.expires_in === 'number'
      ? Date.now() + datos.expires_in * 1000
      : expiracionDeToken(datos.access_token)
  return {
    token: datos.access_token,
    refreshToken: datos.refresh_token ?? null,
    expiraEn,
    usuario: usuarioDesdeToken(datos.access_token),
  }
}

/**
 * Autentica con usuario/contraseña y devuelve
 * `{ token, refreshToken, expiraEn, usuario }`.
 * Lanza un Error con `status` cuando las credenciales son inválidas.
 */
export async function autenticar({ username, password }) {
  const datos = await pedirToken(
    new URLSearchParams({
      grant_type: 'password',
      client_id: KEYCLOAK_CLIENT_ID,
      username,
      password,
      scope: 'openid',
    }),
  )
  return normalizarSesion(datos)
}

/**
 * Renueva el access token con `grant_type=refresh_token` (cliente público, sin
 * secret). Devuelve la misma forma que `autenticar`. Lanza con `status` si el
 * refresh token es inválido/expiró.
 */
export async function refrescarToken(refreshToken) {
  if (!refreshToken) {
    const error = new Error('No hay token de renovación')
    error.status = 401
    throw error
  }
  const datos = await pedirToken(
    new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: KEYCLOAK_CLIENT_ID,
      refresh_token: refreshToken,
    }),
  )
  return normalizarSesion(datos)
}
