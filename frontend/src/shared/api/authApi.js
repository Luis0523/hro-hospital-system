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

/** Roles operativos reconocidos por el sistema. */
export const ROLES_CONOCIDOS = [
  'personal_citas',
  'enfermeria',
  'medico',
  'administrador',
  'archivo',
  'jefe_enfermeria',
]

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
  const rol = roles.find((candidato) => ROLES_CONOCIDOS.includes(candidato)) || roles[0] || null
  return {
    idExterno: claims.preferred_username || claims.sub,
    nombre: claims.name || claims.preferred_username || '',
    rol,
  }
}

/**
 * Autentica con usuario/contraseña y devuelve `{ token, usuario }`.
 * Lanza un Error con `status` cuando las credenciales son inválidas.
 */
export async function autenticar({ username, password }) {
  const url = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`
  const cuerpo = new URLSearchParams({
    grant_type: 'password',
    client_id: KEYCLOAK_CLIENT_ID,
    username,
    password,
    scope: 'openid',
  })

  const respuesta = await fetch(url, {
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

  return { token: datos.access_token, usuario: usuarioDesdeToken(datos.access_token) }
}
