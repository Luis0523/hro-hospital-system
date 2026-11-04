import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getMock } = vi.hoisted(() => ({ getMock: vi.fn() }))

vi.mock('@/shared/api/client', () => ({
  default: { get: getMock },
}))

import { buscarPacienteRecetario } from './recetarioApi'

beforeEach(() => {
  getMock.mockReset()
})

describe('buscarPacienteRecetario', () => {
  it('consulta el API del hospital por número de expediente y devuelve solo el nombre', async () => {
    getMock.mockResolvedValue({
      success: true,
      data: { numeroExpediente: '837871', nombreCompleto: 'María Fernanda López Morales' },
    })

    await expect(buscarPacienteRecetario(' 837871 ')).resolves.toEqual({
      numeroExpediente: '837871',
      nombreCompleto: 'María Fernanda López Morales',
      nombres: 'María Fernanda López Morales',
      apellidos: '',
    })
    expect(getMock).toHaveBeenCalledWith('/integracion/hro/paciente/837871')
  })

  it('codifica el expediente en la URL', async () => {
    getMock.mockResolvedValue({
      data: { numeroExpediente: '111 222', nombreCompleto: 'Paciente Prueba' },
    })

    await buscarPacienteRecetario('111 222')
    expect(getMock).toHaveBeenCalledWith('/integracion/hro/paciente/111%20222')
  })

  it('no consulta si el expediente está vacío', async () => {
    await expect(buscarPacienteRecetario('   ')).rejects.toThrow(
      'El número de expediente es obligatorio.',
    )
    expect(getMock).not.toHaveBeenCalled()
  })

  it('devuelve null cuando el expediente no existe', async () => {
    getMock.mockRejectedValue(Object.assign(new Error('no encontrado'), { status: 404 }))

    await expect(buscarPacienteRecetario('99999')).resolves.toBeNull()
  })

  it('reporta cuando el sistema hospitalario no está disponible', async () => {
    getMock.mockRejectedValue(Object.assign(new Error('caído'), { status: 502 }))

    await expect(buscarPacienteRecetario('837871')).rejects.toThrow(
      'No fue posible consultar el sistema hospitalario. Intente de nuevo.',
    )
  })
})
