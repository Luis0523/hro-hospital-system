import client from '@/shared/api/client'

// API del circuito de carnets (Fase 1 Archivo/Enfermería). El backend es la
// fuente de verdad; este módulo solo consume su contrato.

const desenvolver = (respuesta) => respuesta?.data ?? respuesta

/** Catálogo de especialidades activas. */
export async function listarEspecialidades() {
  const lista = desenvolver(await client.get('/especialidades'))
  return (lista ?? []).map((especialidad) => ({
    id: especialidad.id,
    nombre: especialidad.nombre,
  }))
}

/** Carnets del día, filtrables por estación, especialidad y estado. */
export async function listarCarnets({ fecha, estacionId, especialidadId, estado } = {}) {
  return desenvolver(
    await client.get('/carnets', { params: { fecha, estacionId, especialidadId, estado } }),
  )
}

export async function obtenerCarnet(id) {
  return desenvolver(await client.get(`/carnets/${id}`))
}

/**
 * Registra un carnet. Lanza error con `status`:
 * 404 expediente inexistente · 409 duplicado del día · 502 integración hospital.
 */
export async function registrarCarnet({ numeroExpediente, especialidadId, estacionId }) {
  return desenvolver(
    await client.post('/carnets', { numeroExpediente, especialidadId, estacionId }),
  )
}

export async function marcarEncontrado(id) {
  return desenvolver(await client.post(`/carnets/${id}/encontrado`))
}

export async function marcarNoLocalizado(id, observacion) {
  return desenvolver(await client.post(`/carnets/${id}/no-localizado`, { observacion }))
}

export async function despacharCarnet(id) {
  return desenvolver(await client.post(`/carnets/${id}/despachar`))
}

export async function recibirCarnet(id) {
  return desenvolver(await client.post(`/carnets/${id}/recibir`))
}

export async function devolverCarnet(id) {
  return desenvolver(await client.post(`/carnets/${id}/devolver`))
}

export async function recibirDevolucionCarnet(id) {
  return desenvolver(await client.post(`/carnets/${id}/recibir-devolucion`))
}

/** Etiquetas legibles de cada estado del carnet. */
export const ETIQUETAS_ESTADO_CARNET = {
  registrado: 'Registrado',
  encontrado: 'Encontrado',
  no_localizado: 'No localizado',
  despachado: 'Despachado',
  recibido_estacion: 'Recibido en estación',
  devuelto_estacion: 'Devuelto a archivo',
  recibido_archivo: 'Recibido en archivo',
}
