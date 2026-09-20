import client from '@/shared/api/client'
import {
  actualizarEspecialidadMock,
  actualizarEspacioFisicoMock,
  actualizarSubespecialidadMock,
  crearEspecialidadMock,
  crearEspacioFisicoMock,
  crearSubespecialidadMock,
  desactivarEspecialidadMock,
  desactivarEspacioFisicoMock,
  desactivarSubespecialidadMock,
  listarEspecialidadesMock,
  listarEspaciosFisicosMock,
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
