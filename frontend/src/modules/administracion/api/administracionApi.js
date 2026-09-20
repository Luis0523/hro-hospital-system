import client from '@/shared/api/client'
import {
  actualizarEspecialidadMock,
  actualizarEspacioFisicoMock,
  actualizarMedicoMock,
  actualizarSubespecialidadMock,
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
  listarEspecialidadesMock,
  listarEspaciosFisicosMock,
  listarMedicosMock,
  listarProgramacionesPorMedicoMock,
  listarProgramacionesPorSubespecialidadMock,
  listarSubespecialidadesMock,
} from './mockData.js'

const USE_MOCK = import.meta.env.MODE === 'test' || import.meta.env.VITE_USE_MOCK !== 'false'

const desenvolver = (respuesta) => respuesta?.data ?? respuesta

// ---------------------------------------------------------------------------
// Especialidades — /especialidades
// ---------------------------------------------------------------------------

export async function listarEspecialidades() {
  if (USE_MOCK) return listarEspecialidadesMock()
  return desenvolver(await client.get('/especialidades'))
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

// ---------------------------------------------------------------------------
// Subespecialidades — /subespecialidades
// ---------------------------------------------------------------------------

export async function listarSubespecialidades(especialidadId) {
  if (USE_MOCK) return listarSubespecialidadesMock(especialidadId)
  if (especialidadId) {
    return desenvolver(await client.get(`/subespecialidades/especialidad/${especialidadId}`))
  }
  return desenvolver(await client.get('/subespecialidades'))
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

// ---------------------------------------------------------------------------
// Espacios físicos — /espacios-fisicos
// ---------------------------------------------------------------------------

export async function listarEspaciosFisicos(nivel) {
  if (USE_MOCK) return listarEspaciosFisicosMock(nivel)
  if (nivel) {
    return desenvolver(await client.get(`/espacios-fisicos/nivel/${nivel}`))
  }
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

// ---------------------------------------------------------------------------
// Médicos — /medicos
// ---------------------------------------------------------------------------

export async function listarMedicos() {
  if (USE_MOCK) return listarMedicosMock()
  return desenvolver(await client.get('/medicos'))
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

// ---------------------------------------------------------------------------
// Programación médico-subespecialidad — /medico-subespecialidades
// El contrato vigente no expone PUT/PATCH: la programación no se edita.
// ---------------------------------------------------------------------------

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

export async function desactivarProgramacion(id) {
  if (USE_MOCK) return desactivarProgramacionMock(id)
  return desenvolver(await client.delete(`/medico-subespecialidades/${id}`))
}
