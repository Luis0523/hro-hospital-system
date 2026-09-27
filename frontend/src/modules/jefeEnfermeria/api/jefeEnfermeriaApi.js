import client from '@/shared/api/client'
import {
  cerrarDiaMock,
  duplicarAsignacionMock,
  eliminarAsignacionMock,
  guardarAsignacionMock,
  listarEspaciosFisicosMock,
  listarSubespecialidadesMock,
  obtenerCoberturaMock,
  reasignarEnCalienteMock,
  vistaAsignacionMock,
} from './mockData.js'

const USE_MOCK = import.meta.env.MODE === 'test' || import.meta.env.VITE_USE_MOCK !== 'false'

const desenvolver = (respuesta) => respuesta?.data ?? respuesta

// ---------------------------------------------------------------------------
// Asignación diaria de espacios (sala ↔ subespecialidad por fecha)
// ---------------------------------------------------------------------------

/**
 * Vista operativa: cada espacio del nivel con la subespecialidad asignada ese día.
 * `AsignacionVistaItemDTO[]`.
 */
export async function listarVistaAsignacion({ fecha, nivel } = {}) {
  if (USE_MOCK) return vistaAsignacionMock(fecha, nivel)
  const params = { fecha }
  if (nivel) params.nivel = nivel
  return desenvolver(await client.get('/asignaciones-diarias/vista', { params }))
}

/** Crea/actualiza la asignación de una sala para la fecha (upsert). */
export async function guardarAsignacion({ espacioFisicoId, subespecialidadId, fecha }) {
  if (USE_MOCK) return guardarAsignacionMock({ espacioFisicoId, subespecialidadId, fecha })
  return desenvolver(
    await client.put('/asignaciones-diarias', { espacioFisicoId, subespecialidadId, fecha }),
  )
}

export async function eliminarAsignacion(id) {
  if (USE_MOCK) return eliminarAsignacionMock(id)
  return desenvolver(await client.delete(`/asignaciones-diarias/${id}`))
}

// ---------------------------------------------------------------------------
// Catálogos de apoyo
// ---------------------------------------------------------------------------

export async function listarEspaciosFisicos(nivel) {
  if (USE_MOCK) return listarEspaciosFisicosMock(nivel)
  if (nivel) return desenvolver(await client.get(`/espacios-fisicos/nivel/${nivel}`))
  return desenvolver(await client.get('/espacios-fisicos'))
}

export async function listarSubespecialidades() {
  if (USE_MOCK) return listarSubespecialidadesMock()
  return desenvolver(await client.get('/subespecialidades'))
}

// ---------------------------------------------------------------------------
// Operación del día: cobertura, cierre, duplicar y reasignación en caliente
// ---------------------------------------------------------------------------

/** Subespecialidades con programación ese día que aún no tienen espacio. */
export async function obtenerCobertura(fecha) {
  if (USE_MOCK) return obtenerCoberturaMock(fecha)
  return desenvolver(await client.get('/asignaciones-diarias/cobertura', { params: { fecha } }))
}

/** Cierra la asignación del día (bloquea la edición libre; exige cobertura). */
export async function cerrarDia(fecha) {
  if (USE_MOCK) return cerrarDiaMock(fecha)
  return desenvolver(await client.post('/asignaciones-diarias/cerrar', null, { params: { fecha } }))
}

/** Duplica la asignación de una fecha anterior hacia la fecha destino. */
export async function duplicarAsignacion(fechaOrigen, fechaDestino) {
  if (USE_MOCK) return duplicarAsignacionMock(fechaOrigen, fechaDestino)
  return desenvolver(
    await client.post('/asignaciones-diarias/duplicar', null, {
      params: { fechaOrigen, fechaDestino },
    }),
  )
}

/** Reasignación en caliente: mueve una asignación a otro espacio (aun con el día cerrado). */
export async function reasignarEnCaliente(id, nuevoEspacioFisicoId, motivo) {
  if (USE_MOCK) return reasignarEnCalienteMock(id, nuevoEspacioFisicoId, motivo)
  return desenvolver(
    await client.post(`/asignaciones-diarias/${id}/reasignar`, null, {
      params: { nuevoEspacioFisicoId, motivo },
    }),
  )
}
