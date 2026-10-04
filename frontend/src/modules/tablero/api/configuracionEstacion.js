import client from '@/shared/api/client'

export const MENSAJE_ESTACION_INVALIDA =
  'Esta pantalla no tiene una estación configurada correctamente. Verifique el parámetro ?estacion del tablero.'

export function crearErrorEstacion() {
  const error = new Error(MENSAJE_ESTACION_INVALIDA)
  error.code = 'ESTACION_NO_CONFIGURADA'
  return error
}

/** Lee el parámetro `?estacion=` de la URL (código o id). Devuelve null si no viene. */
export function leerEstacionDeUrl(search = globalThis.location?.search ?? '') {
  const params = new URLSearchParams(search)
  if (!params.has('estacion')) return null
  const valor = params.get('estacion')
  const limpio = valor?.trim()
  return limpio ? limpio : null
}

/**
 * Resuelve la estación de la pantalla a partir de `?estacion=CODE` consultando `GET /estaciones`.
 * Devuelve `null` cuando no hay parámetro (modo fallback) y lanza error si la estación no existe.
 */
export async function resolverConfiguracionEstacion({
  search = globalThis.location?.search ?? '',
  cliente = client,
} = {}) {
  const valor = leerEstacionDeUrl(search)
  if (!valor) return null

  let cuerpo
  try {
    cuerpo = await cliente.get('/estaciones')
  } catch {
    throw crearErrorEstacion()
  }

  const estaciones = Array.isArray(cuerpo) ? cuerpo : (cuerpo?.data ?? [])
  const estacion = estaciones.find(
    (e) => String(e?.codigo) === String(valor) || String(e?.id) === String(valor),
  )
  if (!estacion) throw crearErrorEstacion()

  return {
    estacionId: estacion.id,
    codigo: estacion.codigo,
    nombre: estacion.nombre,
    subespecialidadIds: (estacion.subespecialidades ?? []).map((sub) => sub.id),
  }
}
