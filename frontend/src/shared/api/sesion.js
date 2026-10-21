import { refrescarToken } from './authApi.js'

// Persistencia y renovación de la sesión Keycloak. Centraliza el acceso al
// almacenamiento local (token, refresh token y expiración) para que tanto el
// interceptor HTTP (`client.js`) como el contexto de auth (`AuthContext.jsx`)
// compartan una única renovación en vuelo.

export const CLAVES_SESION = {
  token: 'hro_token',
  refresh: 'hro_refresh_token',
  expira: 'hro_token_exp',
  usuario: 'hro_usuario',
  sesion: 'hro_sesion',
}

// Eventos para sincronizar el estado React con los cambios de token hechos
// fuera de React (p. ej. el interceptor, tras un refresh o una expiración).
export const EVENTO_TOKEN_RENOVADO = 'hro:token-renovado'
export const EVENTO_SESION_EXPIRADA = 'hro:sesion-expirada'

function leer(clave) {
  try {
    return localStorage.getItem(clave)
  } catch {
    return null
  }
}

function escribir(clave, valor) {
  try {
    localStorage.setItem(clave, valor)
  } catch {
    // sin storage: se ignora
  }
}

function borrar(clave) {
  try {
    localStorage.removeItem(clave)
  } catch {
    // sin storage: se ignora
  }
}

export function leerToken() {
  return leer(CLAVES_SESION.token)
}

export function leerRefreshToken() {
  return leer(CLAVES_SESION.refresh)
}

/** Epoch (ms) de expiración guardado, o null si no hay. */
export function leerExpiracion() {
  const bruto = leer(CLAVES_SESION.expira)
  const numero = bruto != null ? Number(bruto) : NaN
  return Number.isFinite(numero) ? numero : null
}

export function guardarSesion({ token, refreshToken, expiraEn } = {}) {
  if (token) escribir(CLAVES_SESION.token, token)
  if (refreshToken) escribir(CLAVES_SESION.refresh, refreshToken)
  if (expiraEn) escribir(CLAVES_SESION.expira, String(expiraEn))
}

export function limpiarSesion() {
  borrar(CLAVES_SESION.token)
  borrar(CLAVES_SESION.refresh)
  borrar(CLAVES_SESION.expira)
  borrar(CLAVES_SESION.usuario)
}

function emitir(nombre, detalle) {
  try {
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new CustomEvent(nombre, { detail: detalle }))
    }
  } catch {
    // entorno sin DOM: se ignora
  }
}

let refrescoEnCurso = null

/**
 * Renueva la sesión usando el refresh token guardado. Deduplica llamadas
 * concurrentes: si ya hay un refresh en vuelo, devuelve esa misma promesa.
 * Al terminar, persiste el nuevo par de tokens y emite `hro:token-renovado`.
 */
export function renovarSesion() {
  if (refrescoEnCurso) return refrescoEnCurso

  const refreshToken = leerRefreshToken()
  if (!refreshToken) {
    const error = new Error('Sesión sin token de renovación')
    error.status = 401
    return Promise.reject(error)
  }

  refrescoEnCurso = refrescarToken(refreshToken)
    .then(({ token, refreshToken: nuevoRefresh, expiraEn }) => {
      guardarSesion({ token, refreshToken: nuevoRefresh, expiraEn })
      emitir(EVENTO_TOKEN_RENOVADO, { token, expiraEn })
      return token
    })
    .finally(() => {
      refrescoEnCurso = null
    })

  return refrescoEnCurso
}

/**
 * Marca la sesión como expirada: limpia credenciales y lo anuncia a React.
 * Los guards de ruta se encargan de redirigir (login o sesión cerrada según el
 * modo); así una ruta pública no se ve expulsada por un 401 en segundo plano.
 */
export function expirarSesion() {
  limpiarSesion()
  escribir(CLAVES_SESION.sesion, 'cerrada')
  emitir(EVENTO_SESION_EXPIRADA)
}
