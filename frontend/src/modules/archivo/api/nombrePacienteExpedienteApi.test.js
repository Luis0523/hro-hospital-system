import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('./archivoApi', () => ({
  buscarPacientePorId: vi.fn(),
}))

import { buscarPacientePorId } from './archivoApi'
import {
  NOMBRE_PACIENTE_DISPONIBLE,
  NOMBRE_PACIENTE_NO_DISPONIBLE,
  NOMBRE_PACIENTE_NO_VERIFICADO,
  limpiarCacheNombresPacientes,
  listarNombresPacientesEnCache,
  obtenerNombrePacienteDeExpediente,
} from './nombrePacienteExpedienteApi'

function activarVerificacionReal() {
  vi.stubEnv('VITE_VERIFICACION_EXPEDIENTES', 'true')
  vi.stubEnv('VITE_USE_MOCK', 'false')
}

function errorConEstado(status) {
  const error = new Error('fallo')
  if (status != null) error.status = status
  return error
}

beforeEach(() => {
  vi.clearAllMocks()
  limpiarCacheNombresPacientes()
})

afterEach(() => {
  vi.unstubAllEnvs()
  limpiarCacheNombresPacientes()
})

describe('nombrePacienteExpedienteApi', () => {
  it('en simulación no consulta ni inventa nombres', async () => {
    const resultado = await obtenerNombrePacienteDeExpediente('927581', 'uuid-paciente')

    expect(resultado.estado).toBe(NOMBRE_PACIENTE_NO_VERIFICADO)
    expect(resultado.nombre).toBeNull()
    expect(buscarPacientePorId).not.toHaveBeenCalled()
  })

  it('con verificación real obtiene el nombre completo del DTO', async () => {
    activarVerificacionReal()
    buscarPacientePorId.mockResolvedValue({
      id: 'uuid-paciente',
      nombres: 'María Fernanda',
      apellidos: 'López García',
      nombreCompleto: 'María Fernanda López García',
    })

    const resultado = await obtenerNombrePacienteDeExpediente('927581', 'uuid-paciente')

    expect(buscarPacientePorId).toHaveBeenCalledWith('uuid-paciente')
    expect(resultado).toEqual({
      estado: NOMBRE_PACIENTE_DISPONIBLE,
      nombre: 'María Fernanda López García',
    })
  })

  it('no consulta si falta el pacienteId', async () => {
    activarVerificacionReal()

    const resultado = await obtenerNombrePacienteDeExpediente('927581', null)

    expect(resultado.estado).toBe(NOMBRE_PACIENTE_NO_DISPONIBLE)
    expect(buscarPacientePorId).not.toHaveBeenCalled()
  })

  it('informa no disponible si el paciente no trae nombre', async () => {
    activarVerificacionReal()
    buscarPacientePorId.mockResolvedValue({ id: 'uuid-paciente', nombreCompleto: '   ' })

    const resultado = await obtenerNombrePacienteDeExpediente('927581', 'uuid-paciente')

    expect(resultado.estado).toBe(NOMBRE_PACIENTE_NO_DISPONIBLE)
    expect(resultado.nombre).toBeNull()
  })

  it('no lanza si la consulta complementaria falla', async () => {
    activarVerificacionReal()
    buscarPacientePorId.mockRejectedValue(errorConEstado(500))

    const resultado = await obtenerNombrePacienteDeExpediente('927581', 'uuid-paciente')

    expect(resultado).toEqual({
      estado: NOMBRE_PACIENTE_NO_DISPONIBLE,
      nombre: null,
      status: 500,
    })
  })

  it('trata un 404 como nombre no disponible', async () => {
    activarVerificacionReal()
    buscarPacientePorId.mockRejectedValue(errorConEstado(404))

    const resultado = await obtenerNombrePacienteDeExpediente('927581', 'uuid-paciente')

    expect(resultado.estado).toBe(NOMBRE_PACIENTE_NO_DISPONIBLE)
  })

  it('usa una caché de sesión y no repite la consulta', async () => {
    activarVerificacionReal()
    buscarPacientePorId.mockResolvedValue({ nombreCompleto: 'María Ejemplo' })

    await obtenerNombrePacienteDeExpediente('927581', 'uuid-1')
    await obtenerNombrePacienteDeExpediente('927581', 'uuid-1')
    await obtenerNombrePacienteDeExpediente('91-1330', 'uuid-2')

    expect(buscarPacientePorId).toHaveBeenCalledTimes(2)
    expect(listarNombresPacientesEnCache()).toHaveProperty('927581')
    expect(listarNombresPacientesEnCache()).toHaveProperty('911330')
  })

  it('no cachea un nombre no disponible y permite reintentar', async () => {
    activarVerificacionReal()
    buscarPacientePorId.mockResolvedValueOnce(null)
    buscarPacientePorId.mockResolvedValueOnce({ nombreCompleto: 'María Ejemplo' })

    const primero = await obtenerNombrePacienteDeExpediente('927581', 'uuid-1')
    const segundo = await obtenerNombrePacienteDeExpediente('927581', 'uuid-1')

    expect(primero.estado).toBe(NOMBRE_PACIENTE_NO_DISPONIBLE)
    expect(segundo.nombre).toBe('María Ejemplo')
    expect(buscarPacientePorId).toHaveBeenCalledTimes(2)
  })
})
