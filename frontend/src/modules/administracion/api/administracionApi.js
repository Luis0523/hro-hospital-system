import client from '@/shared/api/client'
import {
  actualizarEspecialidadMock,
  actualizarEspacioFisicoMock,
  actualizarMedicoMock,
  actualizarProgramacionMock,
  actualizarSubespecialidadMock,
  actualizarDiaNoLaborableMock,
  crearDiaNoLaborableMock,
  crearEspecialidadMock,
  crearEspacioFisicoMock,
  crearMedicoMock,
  crearProgramacionMock,
  crearSubespecialidadMock,
  desactivarEspecialidadMock,
  desactivarEspacioFisicoMock,
  desactivarMedicoMock,
  desactivarProgramacionMock,
  desactivarSubespecialidadMock,
  eliminarDiaNoLaborableMock,
  listarDiasNoLaborablesFuturosMock,
  listarDiasNoLaborablesMock,
  listarDiasNoLaborablesPorRangoMock,
  listarEspecialidadesMock,
  listarEspaciosFisicosMock,
  listarMedicosMock,
  listarProgramacionesMock,
  listarProgramacionesPorMedicoMock,
  listarProgramacionesPorSubespecialidadMock,
  listarSubespecialidadesMock,
  obtenerResumenDashboardMock,
  reactivarEspecialidadMock,
  reactivarEspacioFisicoMock,
  reactivarMedicoMock,
  reactivarProgramacionMock,
  reactivarSubespecialidadMock,
  // Usuarios, roles y permisos
  actualizarRolUsuarioMock,
  activarUsuarioMock,
  asignarPermisoSubespecialidadMock,
  desactivarPermisoSubespecialidadMock,
  desactivarUsuarioMock,
  listarPermisosSubespecialidadMock,
  listarPermisosUsuarioMock,
  listarRolesMock,
  listarUsuariosMock,
  obtenerUsuarioMock,
  reactivarPermisoSubespecialidadMock,
  // Reportes
  obtenerReporteCitasPorEstadoMock,
  obtenerReporteDemandaMock,
  obtenerReporteUtilizacionMock,
  // Auditoría
  obtenerAuditoriaMock,
} from './mockData.js'

const USE_MOCK = import.meta.env.MODE === 'test' || import.meta.env.VITE_USE_MOCK !== 'false'

const desenvolver = (respuesta) => respuesta?.data ?? respuesta

// Parámetros opcionales de listado. Si `estado` se omite, el backend aplica
// el default `activos`; el mock replica ese mismo comportamiento.
const paramsEstado = (estado) => (estado ? { estado } : undefined)

// ---------------------------------------------------------------------------
// Especialidades — /especialidades
// ---------------------------------------------------------------------------

export async function listarEspecialidades(estado) {
  if (USE_MOCK) return listarEspecialidadesMock(estado)
  return desenvolver(await client.get('/especialidades', { params: paramsEstado(estado) }))
}

export async function crearEspecialidad({ nombre }) {
  if (USE_MOCK) return crearEspecialidadMock({ nombre })
  return desenvolver(await client.post('/especialidades', { nombre }))
}

export async function actualizarEspecialidad(id, { nombre }) {
  if (USE_MOCK) return actualizarEspecialidadMock(id, { nombre })
  return desenvolver(await client.put(`/especialidades/${id}`, { nombre }))
}

export async function desactivarEspecialidad(id) {
  if (USE_MOCK) return desactivarEspecialidadMock(id)
  return desenvolver(await client.delete(`/especialidades/${id}`))
}

export async function reactivarEspecialidad(id) {
  if (USE_MOCK) return reactivarEspecialidadMock(id)
  return desenvolver(await client.patch(`/especialidades/${id}/reactivar`))
}

// ---------------------------------------------------------------------------
// Subespecialidades — /subespecialidades
// ---------------------------------------------------------------------------

export async function listarSubespecialidades(especialidadId, estado) {
  if (USE_MOCK) return listarSubespecialidadesMock(especialidadId, estado)
  if (especialidadId) {
    return desenvolver(
      await client.get(`/subespecialidades/especialidad/${especialidadId}`, {
        params: paramsEstado(estado),
      }),
    )
  }
  return desenvolver(await client.get('/subespecialidades', { params: paramsEstado(estado) }))
}

export async function crearSubespecialidad({ especialidadId, nombre }) {
  if (USE_MOCK) return crearSubespecialidadMock({ especialidadId, nombre })
  return desenvolver(await client.post('/subespecialidades', { especialidadId, nombre }))
}

export async function actualizarSubespecialidad(id, { especialidadId, nombre }) {
  if (USE_MOCK) return actualizarSubespecialidadMock(id, { especialidadId, nombre })
  return desenvolver(await client.put(`/subespecialidades/${id}`, { especialidadId, nombre }))
}

export async function desactivarSubespecialidad(id) {
  if (USE_MOCK) return desactivarSubespecialidadMock(id)
  return desenvolver(await client.delete(`/subespecialidades/${id}`))
}

export async function reactivarSubespecialidad(id) {
  if (USE_MOCK) return reactivarSubespecialidadMock(id)
  return desenvolver(await client.patch(`/subespecialidades/${id}/reactivar`))
}

// ---------------------------------------------------------------------------
// Espacios físicos — /espacios-fisicos
// ---------------------------------------------------------------------------

export async function listarEspaciosFisicos(nivel, estado) {
  if (USE_MOCK) return listarEspaciosFisicosMock(nivel, estado)
  if (nivel) {
    return desenvolver(
      await client.get(`/espacios-fisicos/nivel/${nivel}`, { params: paramsEstado(estado) }),
    )
  }
  return desenvolver(await client.get('/espacios-fisicos', { params: paramsEstado(estado) }))
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

export async function reactivarEspacioFisico(id) {
  if (USE_MOCK) return reactivarEspacioFisicoMock(id)
  return desenvolver(await client.patch(`/espacios-fisicos/${id}/reactivar`))
}

// ---------------------------------------------------------------------------
// Médicos — /medicos
// ---------------------------------------------------------------------------

export async function listarMedicos(estado) {
  if (USE_MOCK) return listarMedicosMock(estado)
  return desenvolver(await client.get('/medicos', { params: paramsEstado(estado) }))
}

export async function crearMedico({ nombres, numeroColegiado }) {
  if (USE_MOCK) return crearMedicoMock({ nombres, numeroColegiado })
  return desenvolver(await client.post('/medicos', { nombres, numeroColegiado }))
}

export async function actualizarMedico(
  id,
  { nombres, numeroColegiado, usuarioReferenciaId, activo },
) {
  if (USE_MOCK) {
    return actualizarMedicoMock(id, { nombres, numeroColegiado, usuarioReferenciaId, activo })
  }
  return desenvolver(
    await client.put(`/medicos/${id}`, { nombres, numeroColegiado, usuarioReferenciaId, activo }),
  )
}

export async function desactivarMedico(id) {
  if (USE_MOCK) return desactivarMedicoMock(id)
  return desenvolver(await client.delete(`/medicos/${id}`))
}

export async function reactivarMedico(id) {
  if (USE_MOCK) return reactivarMedicoMock(id)
  return desenvolver(await client.patch(`/medicos/${id}/reactivar`))
}

// ---------------------------------------------------------------------------
// Programación médico-subespecialidad — /medico-subespecialidades
// ---------------------------------------------------------------------------

export async function listarProgramaciones({
  medicoId,
  subespecialidadId,
  diaSemana,
  estado,
} = {}) {
  if (USE_MOCK) return listarProgramacionesMock({ medicoId, subespecialidadId, diaSemana, estado })
  const params = {}
  if (medicoId) params.medicoId = medicoId
  if (subespecialidadId) params.subespecialidadId = subespecialidadId
  if (diaSemana) params.diaSemana = diaSemana
  if (estado) params.estado = estado
  return desenvolver(await client.get('/medico-subespecialidades', { params }))
}

export async function listarProgramacionesPorMedico(medicoId) {
  if (USE_MOCK) return listarProgramacionesPorMedicoMock(medicoId)
  return desenvolver(await client.get(`/medico-subespecialidades/medico/${medicoId}`))
}

export async function listarProgramacionesPorSubespecialidad(subespecialidadId) {
  if (USE_MOCK) return listarProgramacionesPorSubespecialidadMock(subespecialidadId)
  return desenvolver(
    await client.get(`/medico-subespecialidades/subespecialidad/${subespecialidadId}`),
  )
}

export async function crearProgramacion(datos) {
  if (USE_MOCK) return crearProgramacionMock(datos)
  return desenvolver(await client.post('/medico-subespecialidades', datos))
}

export async function actualizarProgramacion(
  id,
  { horaInicio, horaFin, capacidadMaxima, duracionConsultaMinutos },
) {
  const datos = { horaInicio, horaFin, capacidadMaxima, duracionConsultaMinutos }
  if (USE_MOCK) return actualizarProgramacionMock(id, datos)
  return desenvolver(await client.put(`/medico-subespecialidades/${id}`, datos))
}

export async function desactivarProgramacion(id) {
  if (USE_MOCK) return desactivarProgramacionMock(id)
  return desenvolver(await client.delete(`/medico-subespecialidades/${id}`))
}

export async function reactivarProgramacion(id) {
  if (USE_MOCK) return reactivarProgramacionMock(id)
  return desenvolver(await client.patch(`/medico-subespecialidades/${id}/reactivar`))
}

// ---------------------------------------------------------------------------
// Calendario institucional — /dias-no-laborables
// Contrato vigente: POST, GET (todos), GET /futuros, GET /rango y DELETE /{id}.
// No existen PUT/PATCH, baja lógica, reactivación ni force.
//
// PENDIENTE DE CONFIRMACIÓN (backend): el request admite creadoPorId, pero el
// frontend no lo envía porque no dispone de identidad local numérica confiable.
// El backend resuelve creadoPor con su mecanismo interno (primer UsuarioReferencia
// o system-admin), lo que puede no identificar al administrador real.
// ---------------------------------------------------------------------------

export async function listarDiasNoLaborables() {
  if (USE_MOCK) return listarDiasNoLaborablesMock()
  return desenvolver(await client.get('/dias-no-laborables'))
}

export async function listarDiasNoLaborablesFuturos() {
  if (USE_MOCK) return listarDiasNoLaborablesFuturosMock()
  return desenvolver(await client.get('/dias-no-laborables/futuros'))
}

export async function listarDiasNoLaborablesPorRango(inicio, fin) {
  if (USE_MOCK) return listarDiasNoLaborablesPorRangoMock(inicio, fin)
  return desenvolver(await client.get('/dias-no-laborables/rango', { params: { inicio, fin } }))
}

export async function crearDiaNoLaborable({ fecha, motivo, forzar = false }) {
  if (USE_MOCK) return crearDiaNoLaborableMock({ fecha, motivo, forzar })
  return desenvolver(await client.post('/dias-no-laborables', { fecha, motivo, forzar }))
}

export async function actualizarDiaNoLaborable(id, { motivo }) {
  if (USE_MOCK) return actualizarDiaNoLaborableMock(id, { motivo })
  return desenvolver(await client.put(`/dias-no-laborables/${id}`, { motivo }))
}

export async function eliminarDiaNoLaborable(id) {
  if (USE_MOCK) return eliminarDiaNoLaborableMock(id)
  return desenvolver(await client.delete(`/dias-no-laborables/${id}`))
}

// ---------------------------------------------------------------------------
// Dashboard administrativo — /dashboard/resumen
// El backend calcula los indicadores; el frontend solo los muestra.
// `fecha` es opcional (ISO YYYY-MM-DD); si se omite, el backend usa su "hoy".
// ---------------------------------------------------------------------------

export async function obtenerResumenDashboard(fecha) {
  if (USE_MOCK) return obtenerResumenDashboardMock(fecha)
  return desenvolver(
    await client.get('/dashboard/resumen', { params: fecha ? { fecha } : undefined }),
  )
}

// ---------------------------------------------------------------------------
// Usuarios, roles y permisos — /usuarios, /roles, /permisos-subespecialidad
// El alta de usuarios proviene del proveedor de identidad (JIT): no hay POST.
// ---------------------------------------------------------------------------

export async function listarUsuarios({ estado, rol } = {}) {
  if (USE_MOCK) return listarUsuariosMock({ estado, rol })
  const params = {}
  if (estado) params.estado = estado
  if (rol) params.rol = rol
  return desenvolver(await client.get('/usuarios', { params }))
}

export async function obtenerUsuario(id) {
  if (USE_MOCK) return obtenerUsuarioMock(id)
  return desenvolver(await client.get(`/usuarios/${id}`))
}

export async function activarUsuario(id) {
  if (USE_MOCK) return activarUsuarioMock(id)
  return desenvolver(await client.patch(`/usuarios/${id}/activar`))
}

export async function desactivarUsuario(id) {
  if (USE_MOCK) return desactivarUsuarioMock(id)
  return desenvolver(await client.patch(`/usuarios/${id}/desactivar`))
}

export async function actualizarRolUsuario(id, { rolPrincipal }) {
  if (USE_MOCK) return actualizarRolUsuarioMock(id, { rolPrincipal })
  return desenvolver(await client.put(`/usuarios/${id}/rol`, { rolPrincipal }))
}

export async function listarRoles() {
  if (USE_MOCK) return listarRolesMock()
  return desenvolver(await client.get('/roles'))
}

export async function listarPermisosUsuario(id, estado) {
  if (USE_MOCK) return listarPermisosUsuarioMock(id, estado)
  return desenvolver(
    await client.get(`/usuarios/${id}/permisos`, { params: estado ? { estado } : undefined }),
  )
}

export async function listarPermisosSubespecialidad({ subespecialidadId, estado } = {}) {
  if (USE_MOCK) return listarPermisosSubespecialidadMock({ subespecialidadId, estado })
  const params = {}
  if (subespecialidadId) params.subespecialidadId = subespecialidadId
  if (estado) params.estado = estado
  return desenvolver(await client.get('/permisos-subespecialidad', { params }))
}

export async function asignarPermisoSubespecialidad({ usuarioId, subespecialidadId, tipoPermiso }) {
  const datos = { usuarioId, subespecialidadId, tipoPermiso }
  if (USE_MOCK) return asignarPermisoSubespecialidadMock(datos)
  return desenvolver(await client.post('/permisos-subespecialidad', datos))
}

export async function desactivarPermisoSubespecialidad(id) {
  if (USE_MOCK) return desactivarPermisoSubespecialidadMock(id)
  return desenvolver(await client.patch(`/permisos-subespecialidad/${id}/desactivar`))
}

export async function reactivarPermisoSubespecialidad(id) {
  if (USE_MOCK) return reactivarPermisoSubespecialidadMock(id)
  return desenvolver(await client.patch(`/permisos-subespecialidad/${id}/reactivar`))
}

// ---------------------------------------------------------------------------
// Reportes administrativos — /reportes
// Las agregaciones las calcula el backend; el frontend solo las muestra.
// Se envían fechas locales explícitas (ISO YYYY-MM-DD).
// ---------------------------------------------------------------------------

function paramsRango(fechaInicio, fechaFin) {
  const params = {}
  if (fechaInicio) params.fechaInicio = fechaInicio
  if (fechaFin) params.fechaFin = fechaFin
  return params
}

export async function obtenerReporteCitasPorEstado({ fechaInicio, fechaFin } = {}) {
  if (USE_MOCK) return obtenerReporteCitasPorEstadoMock({ fechaInicio, fechaFin })
  return desenvolver(
    await client.get('/reportes/citas-por-estado', { params: paramsRango(fechaInicio, fechaFin) }),
  )
}

export async function obtenerReporteDemandaPorEspecialidad({ fechaInicio, fechaFin } = {}) {
  if (USE_MOCK) return obtenerReporteDemandaMock({ fechaInicio, fechaFin })
  return desenvolver(
    await client.get('/reportes/demanda-por-especialidad', {
      params: paramsRango(fechaInicio, fechaFin),
    }),
  )
}

export async function obtenerReporteUtilizacionCupos({
  fechaInicio,
  fechaFin,
  subespecialidadId,
} = {}) {
  if (USE_MOCK) return obtenerReporteUtilizacionMock({ fechaInicio, fechaFin, subespecialidadId })
  const params = paramsRango(fechaInicio, fechaFin)
  if (subespecialidadId) params.subespecialidadId = subespecialidadId
  return desenvolver(await client.get('/reportes/utilizacion-cupos', { params }))
}

// ---------------------------------------------------------------------------
// Auditoría administrativa — /auditoria
// Endpoint restringido al rol `administrador` (@PreAuthorize). Otros roles → 403
// con codigo `ACCESO_DENEGADO`. Solo lectura; el backend calcula la paginación
// (page base 0, size por defecto 20, orden fecha DESC).
// ---------------------------------------------------------------------------

export async function obtenerAuditoria({
  tabla,
  usuarioId,
  accion,
  fechaInicio,
  fechaFin,
  page,
  size,
} = {}) {
  if (USE_MOCK) {
    return obtenerAuditoriaMock({ tabla, usuarioId, accion, fechaInicio, fechaFin, page, size })
  }

  const params = {}
  if (tabla) params.tabla = tabla
  if (usuarioId) params.usuarioId = usuarioId
  if (accion) params.accion = accion
  if (fechaInicio) params.fechaInicio = fechaInicio
  if (fechaFin) params.fechaFin = fechaFin
  if (page !== undefined && page !== null) params.page = page
  if (size !== undefined && size !== null) params.size = size

  return desenvolver(await client.get('/auditoria', { params }))
}
