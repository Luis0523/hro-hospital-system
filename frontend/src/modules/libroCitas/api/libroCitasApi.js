import client from '@/shared/api/client'

const RUTA_EXPEDIENTE = '/integracion/hro/paciente'

function crearError(mensaje, tipo, status = null) {
  const error = new Error(mensaje)
  error.tipo = tipo
  error.status = status
  return error
}

/**
 * Consulta el paciente en el sistema hospitalario por número de expediente.
 *
 * Usa el cliente HTTP compartido (baseURL ya incluye `/api/v1`). El backend
 * envuelve la respuesta en `ApiResponse`: se lee `respuesta.data` y se mapea
 * `nombreCompleto` -> `nombre`.
 *
 * - 200 -> `{ numeroExpediente, nombre }`
 * - 404 -> `null` (expediente no encontrado)
 * - 502 -> Error `{ tipo: 'INTEGRACION' }` (sistema hospitalario no disponible)
 * - otros -> Error `{ tipo: 'INESPERADO' }` con mensaje genérico
 */
export async function buscarPacientePorExpediente(numeroExpediente) {
  try {
    const respuesta = await client.get(`${RUTA_EXPEDIENTE}/${encodeURIComponent(numeroExpediente)}`)
    const datos = respuesta?.data

    if (!datos || typeof datos.nombreCompleto !== 'string') {
      throw crearError('Respuesta inesperada del sistema hospitalario.', 'INESPERADO')
    }

    return {
      numeroExpediente: datos.numeroExpediente,
      nombre: datos.nombreCompleto,
    }
  } catch (error) {
    if (error?.status === 404) return null

    if (error?.status === 502) {
      throw crearError(
        'No fue posible consultar el sistema hospitalario. Intente de nuevo.',
        'INTEGRACION',
        502,
      )
    }

    throw crearError(
      'No se pudo consultar el expediente. Intente de nuevo.',
      'INESPERADO',
      error?.status ?? null,
    )
  }
}

/**
 * Guarda el paquete capturado (contadores + items).
 *
 * FASE 5G: implementación MOCK. La persistencia real
 * (POST /libro-citas/expedientes) queda pendiente: el backend aún exige el
 * formato antiguo `NNNN-NN`, mientras el contrato real es solo numérico.
 * No muta el payload recibido.
 */
export async function guardarLibroCitas(payload = {}) {
  const total = Array.isArray(payload.items) ? payload.items.length : 0
  return { ok: true, total }
}
