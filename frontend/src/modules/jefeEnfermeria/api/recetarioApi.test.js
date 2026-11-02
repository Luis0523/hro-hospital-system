import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getMock } = vi.hoisted(() => ({ getMock: vi.fn() }))

vi.mock('@/shared/api/client', () => ({
  default: { get: getMock },
}))

import { buscarPacienteRecetario } from './recetarioApi'

const PACIENTE = {
  id: '00000000-0000-0000-0000-000000000000',
  dpi: '2456789010101',
  nombres: 'María Fernanda',
  apellidos: 'López Morales',
  fechaNacimiento: '1990-04-12',
  sexo: 'F',
  telefono: null,
  direccion: null,
  numeroExpediente: '30954',
}

beforeEach(() => {
  getMock.mockReset()
})

describe('buscarPacienteRecetario', () => {
  it('consulta por expediente y desenvuelve PacienteResponseDTO', async () => {
    getMock.mockResolvedValue({ success: true, data: PACIENTE })

    await expect(buscarPacienteRecetario(' 30954 ')).resolves.toEqual(PACIENTE)
    expect(getMock).toHaveBeenCalledWith('/pacientes/expediente/30954')
  })

  it('codifica el expediente en la URL', async () => {
    getMock.mockResolvedValue({ data: PACIENTE })

    await buscarPacienteRecetario('111 222')
    expect(getMock).toHaveBeenCalledWith('/pacientes/expediente/111%20222')
  })

  it('no consulta si el expediente está vacío', async () => {
    await expect(buscarPacienteRecetario('   ')).rejects.toThrow(
      'El número de expediente es obligatorio.',
    )
    expect(getMock).not.toHaveBeenCalled()
  })

  it('devuelve null cuando el paciente no existe', async () => {
    getMock.mockRejectedValue(Object.assign(new Error('no encontrado'), { status: 404 }))

    await expect(buscarPacienteRecetario('99999')).resolves.toBeNull()
  })

  it('propaga otros errores de la API', async () => {
    const error = Object.assign(new Error('Fallo de red'), { status: 500 })
    getMock.mockRejectedValue(error)

    await expect(buscarPacienteRecetario('30954')).rejects.toBe(error)
  })
})
