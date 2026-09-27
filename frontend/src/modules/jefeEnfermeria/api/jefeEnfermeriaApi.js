import client from '@/shared/api/client'
import {
  actualizarEstacionMock,
  actualizarHorarioMock,
  asignarSubespecialidadesEstacionMock,
  cerrarDiaMock,
  crearEstacionMock,
  crearHorarioMock,
  desactivarEstacionMock,
  desactivarHorarioMock,
  duplicarAsignacionMock,
  eliminarAsignacionMock,
  guardarAsignacionMock,
  listarAccesosMock,
  listarEspaciosFisicosMock,
  listarEstacionesMock,
  listarHorariosMock,
  listarSubespecialidadesMock,
  obtenerCoberturaMock,
  reactivarHorarioMock,
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

// ---------------------------------------------------------------------------
// Horario por subespecialidad (/subespecialidad-horarios)
// ---------------------------------------------------------------------------

export async function listarHorarios(subespecialidadId) {
  if (USE_MOCK) return listarHorariosMock(subespecialidadId)
  return desenvolver(await client.get(`/subespecialidades/${subespecialidadId}/horarios`))
}

export async function crearHorario(datos) {
  if (USE_MOCK) return crearHorarioMock(datos)
  return desenvolver(await client.post('/subespecialidad-horarios', datos))
}

export async function actualizarHorario(id, datos) {
  if (USE_MOCK) return actualizarHorarioMock(id, datos)
  return desenvolver(await client.put(`/subespecialidad-horarios/${id}`, datos))
}

export async function reactivarHorario(id) {
  if (USE_MOCK) return reactivarHorarioMock(id)
  return desenvolver(await client.patch(`/subespecialidad-horarios/${id}/reactivar`))
}

export async function desactivarHorario(id) {
  if (USE_MOCK) return desactivarHorarioMock(id)
  return desenvolver(await client.delete(`/subespecialidad-horarios/${id}`))
}

// ---------------------------------------------------------------------------
// Estaciones y bitácora de accesos (/estaciones)
// ---------------------------------------------------------------------------

export async function listarEstaciones() {
  if (USE_MOCK) return listarEstacionesMock()
  return desenvolver(await client.get('/estaciones'))
}

export async function crearEstacion(datos) {
  if (USE_MOCK) return crearEstacionMock(datos)
  return desenvolver(await client.post('/estaciones', datos))
}

export async function actualizarEstacion(id, datos) {
  if (USE_MOCK) return actualizarEstacionMock(id, datos)
  return desenvolver(await client.put(`/estaciones/${id}`, datos))
}

export async function desactivarEstacion(id) {
  if (USE_MOCK) return desactivarEstacionMock(id)
  return desenvolver(await client.delete(`/estaciones/${id}`))
}

export async function asignarSubespecialidadesEstacion(id, subespecialidadIds) {
  if (USE_MOCK) return asignarSubespecialidadesEstacionMock(id, subespecialidadIds)
  return desenvolver(
    await client.put(`/estaciones/${id}/subespecialidades`, { subespecialidadIds }),
  )
}

/** Bitácora de rotación de una estación (todos o solo los accesos abiertos). */
export async function listarAccesosEstacion(estacionId, { abiertos = false } = {}) {
  if (USE_MOCK) return listarAccesosMock(estacionId, abiertos)
  return desenvolver(
    await client.get(`/estaciones/${estacionId}/accesos`, { params: { abiertos } }),
  )
}
