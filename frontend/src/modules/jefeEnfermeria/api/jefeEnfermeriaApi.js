import client from '@/shared/api/client'
import {
  actualizarEstacionMock,
  actualizarHorarioMock,
  asignarEspecialidadesEstacionMock,
  asignarSubespecialidadesEstacionMock,
  cerrarDiaMock,
  crearEstacionMock,
  crearEspacioFisicoMock,
  crearHorarioMock,
  asegurarAreaEspecialidadMock,
  desactivarEstacionMock,
  desactivarEspacioFisicoMock,
  desactivarHorarioMock,
  listarEspecialidadesMock,
  duplicarAsignacionMock,
  eliminarAsignacionMock,
  guardarAsignacionMock,
  listarAccesosMock,
  listarClinicasFijasMock,
  guardarClinicasFijasMock,
  listarOrdenClinicasMock,
  guardarOrdenClinicasMock,
  listarEspaciosFisicosMock,
  obtenerEspacioFisicoMock,
  actualizarEspacioFisicoMock,
  listarEstacionesMock,
  listarHorariosMock,
  listarSubespecialidadesMock,
  obtenerCoberturaMock,
  reactivarHorarioMock,
  reasignarEnCalienteMock,
  reporteCitasPorEstadoMock,
  reporteDemandaPorEspecialidadMock,
  reporteUtilizacionCuposMock,
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

export async function crearEspacioFisico(datos) {
  if (USE_MOCK) return crearEspacioFisicoMock(datos)
  return desenvolver(await client.post('/espacios-fisicos', datos))
}

export async function actualizarEspacioFisico(id, datos) {
  if (USE_MOCK) return actualizarEspacioFisicoMock(id, datos)
  return desenvolver(await client.put(`/espacios-fisicos/${id}`, datos))
}

export async function desactivarEspacioFisico(id) {
  if (USE_MOCK) return desactivarEspacioFisicoMock(id)
  return desenvolver(await client.delete(`/espacios-fisicos/${id}`))
}

export async function obtenerEspacioFisico(id) {
  if (USE_MOCK) return obtenerEspacioFisicoMock(id)
  return desenvolver(await client.get(`/espacios-fisicos/${id}`))
}

export async function listarSubespecialidades() {
  if (USE_MOCK) return listarSubespecialidadesMock()
  return desenvolver(await client.get('/subespecialidades'))
}

/** Catálogo de especialidades (unidad con la que ahora se configuran los horarios). */
export async function listarEspecialidades() {
  if (USE_MOCK) return listarEspecialidadesMock()
  return desenvolver(await client.get('/especialidades'))
}

/** Área (subespecialidad) asociada a la especialidad para configurar horarios. Crea si no existe. */
export async function asegurarAreaEspecialidad(especialidadId) {
  if (USE_MOCK) return asegurarAreaEspecialidadMock(especialidadId)
  return desenvolver(await client.post(`/especialidades/${especialidadId}/area`))
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

export async function listarClinicasFijas(estacionId) {
  if (USE_MOCK) return listarClinicasFijasMock(estacionId)
  return desenvolver(await client.get(`/estaciones/${estacionId}/clinicas-fijas`))
}

export async function guardarClinicasFijas(estacionId, asignaciones) {
  if (USE_MOCK) return guardarClinicasFijasMock(estacionId, asignaciones)
  return desenvolver(await client.put(`/estaciones/${estacionId}/clinicas-fijas`, { asignaciones }))
}

/** Orden configurado de las clínicas físicas para una estación. */
export async function listarOrdenClinicas(estacionId, nivel) {
  if (USE_MOCK) return listarOrdenClinicasMock(estacionId, nivel)
  const params = nivel != null ? { nivel } : {}
  return desenvolver(await client.get(`/estaciones/${estacionId}/clinicas-orden`, { params }))
}

/** Guarda las clínicas en el orden deseado (la primera se muestra primero). */
export async function guardarOrdenClinicas(estacionId, espacioFisicoIds) {
  if (USE_MOCK) return guardarOrdenClinicasMock(estacionId, espacioFisicoIds)
  return desenvolver(
    await client.put(`/estaciones/${estacionId}/clinicas-orden`, { espacioFisicoIds }),
  )
}

export async function asignarSubespecialidadesEstacion(id, subespecialidadIds) {
  if (USE_MOCK) return asignarSubespecialidadesEstacionMock(id, subespecialidadIds)
  return desenvolver(
    await client.put(`/estaciones/${id}/subespecialidades`, { subespecialidadIds }),
  )
}

/** Asigna especialidades a la estación (el backend las resuelve a su área interna). */
export async function asignarEspecialidadesEstacion(id, especialidadIds) {
  if (USE_MOCK) return asignarEspecialidadesEstacionMock(id, especialidadIds)
  return desenvolver(await client.put(`/estaciones/${id}/especialidades`, { especialidadIds }))
}

/** Bitácora de rotación de una estación (todos o solo los accesos abiertos). */
export async function listarAccesosEstacion(estacionId, { abiertos = false } = {}) {
  if (USE_MOCK) return listarAccesosMock(estacionId, abiertos)
  return desenvolver(
    await client.get(`/estaciones/${estacionId}/accesos`, { params: { abiertos } }),
  )
}

// ---------------------------------------------------------------------------
// Reportes (agregados del backend)
// ---------------------------------------------------------------------------

export async function reporteCitasPorEstado({ fechaInicio, fechaFin } = {}) {
  if (USE_MOCK) return reporteCitasPorEstadoMock(fechaInicio, fechaFin)
  return desenvolver(
    await client.get('/reportes/citas-por-estado', { params: { fechaInicio, fechaFin } }),
  )
}

export async function reporteDemandaPorEspecialidad({ fechaInicio, fechaFin } = {}) {
  if (USE_MOCK) return reporteDemandaPorEspecialidadMock(fechaInicio, fechaFin)
  return desenvolver(
    await client.get('/reportes/demanda-por-especialidad', { params: { fechaInicio, fechaFin } }),
  )
}

export async function reporteUtilizacionCupos({
  fechaInicio,
  fechaFin,
  subespecialidadId,
  especialidadId,
} = {}) {
  if (USE_MOCK) {
    return reporteUtilizacionCuposMock(fechaInicio, fechaFin, subespecialidadId, especialidadId)
  }
  return desenvolver(
    await client.get('/reportes/utilizacion-cupos', {
      params: { fechaInicio, fechaFin, subespecialidadId, especialidadId },
    }),
  )
}
