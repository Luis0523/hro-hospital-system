import { ASIGNACIONES_PERMITIDAS } from './tableroApi'

export const SALAS_VALIDAS = ['1', '2', '3', '4']

export const RUTA_CONFIG = '/tablero-config.json'

export const MENSAJE_SALA_INVALIDA =
  'Esta pantalla no tiene una sala configurada correctamente. Verifique la configuración del tablero.'

export function crearErrorConfiguracion() {
  const error = new Error(MENSAJE_SALA_INVALIDA)
  error.code = 'SALA_NO_CONFIGURADA'
  return error
}

/**
 * Lee el parámetro `?sala=` de la URL.
 * Devuelve siempre `{ tieneSala, sala }`; `tieneSala` distingue
 * "sin parámetro" (fallback) de "parámetro presente" (posiblemente inválido).
 */
export function leerSalaDeUrl(search = globalThis.location?.search ?? '') {
  const params = new URLSearchParams(search)
  if (!params.has('sala')) return { tieneSala: false, sala: null }
  return { tieneSala: true, sala: params.get('sala') }
}

/**
 * Valida la estructura del JSON de configuración y sanea los IDs de cada sala
 * (enteros > 0, sin duplicados). Devuelve `null` si la estructura es inválida.
 */
export function parsearSalasConfig(cuerpo) {
  const salas = cuerpo?.salas
  if (!salas || typeof salas !== 'object' || Array.isArray(salas)) return null

  const resultado = {}
  for (const [clave, valor] of Object.entries(salas)) {
    if (!Array.isArray(valor)) return null
    const ids = valor
      .map((elemento) => Number(elemento))
      .filter((numero) => Number.isInteger(numero) && numero > 0)
    resultado[clave] = Array.from(new Set(ids))
  }

  return resultado
}

/**
 * Resuelve el filtro de asignaciones de la pantalla.
 *
 * - Sin `?sala`            -> fallback build-time (`VITE_TABLERO_ASIGNACIONES`).
 * - `?sala=1..4` válido     -> lista de esa sala (puede ser []).
 * - `?sala` inválido/ausente en el JSON/HTTP/JSON inválido -> error seguro.
 *
 * Un `permitidas: []` significa "sala válida sin asignaciones"; un
 * `permitidas: null` significa "sin filtro / mostrar todas".
 */
export async function resolverConfiguracionSala({
  search = globalThis.location?.search ?? '',
  fetchImpl = globalThis.fetch,
  rutaConfig = RUTA_CONFIG,
  permitidasFallback = ASIGNACIONES_PERMITIDAS,
} = {}) {
  const { tieneSala, sala } = leerSalaDeUrl(search)

  if (!tieneSala) {
    return { modo: 'fallback', sala: null, permitidas: permitidasFallback ?? null }
  }

  const salaSolicitada = String(sala)
  if (!SALAS_VALIDAS.includes(salaSolicitada)) {
    throw crearErrorConfiguracion()
  }

  if (typeof fetchImpl !== 'function') {
    throw crearErrorConfiguracion()
  }

  let cuerpo
  try {
    const respuesta = await fetchImpl(rutaConfig, { cache: 'no-store' })
    if (!respuesta || !respuesta.ok) throw crearErrorConfiguracion()
    cuerpo = await respuesta.json()
  } catch {
    throw crearErrorConfiguracion()
  }

  const salas = parsearSalasConfig(cuerpo)
  if (!salas || !Object.prototype.hasOwnProperty.call(salas, salaSolicitada)) {
    throw crearErrorConfiguracion()
  }

  return { modo: 'sala', sala: salaSolicitada, permitidas: salas[salaSolicitada] }
}
