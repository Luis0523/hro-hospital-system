import client from '@/shared/api/client'
import {
  eliminarAsignacionMock,
  guardarAsignacionMock,
  listarEspaciosFisicosMock,
  listarSubespecialidadesMock,
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
