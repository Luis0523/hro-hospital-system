import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getMock } = vi.hoisted(() => ({ getMock: vi.fn() }))

vi.mock('@/shared/api/client', () => ({
  default: { get: getMock },
}))

import { buscarPacientePorExpediente, guardarLibroCitas } from './libroCitasApi'

// Valor ficticio reservado para tests. NO es un expediente real.
const EXPEDIENTE_FICTICIO = '999999999999'

beforeEach(() => {
  getMock.mockReset()
})

describe('buscarPacientePorExpediente (integración HRO)', () => {
  it('mapea nombreCompleto -> nombre y usa la ruta sin duplicar /api/v1', async () => {
    getMock.mockResolvedValue({
      success: true,
      data: { numeroExpediente: EXPEDIENTE_FICTICIO, nombreCompleto: 'Paciente Prueba' },
    })

    const paciente = await buscarPacientePorExpediente(EXPEDIENTE_FICTICIO)

    expect(paciente).toEqual({
      numeroExpediente: EXPEDIENTE_FICTICIO,
      nombre: 'Paciente Prueba',
    })
    expect(getMock).toHaveBeenCalledWith(`/integracion/hro/paciente/${EXPEDIENTE_FICTICIO}`)
  })

  it('no expone id ni datos adicionales (solo numeroExpediente y nombre)', async () => {
    getMock.mockResolvedValue({
      data: {
        numeroExpediente: EXPEDIENTE_FICTICIO,
        nombreCompleto: 'Paciente Prueba',
        dpi: '0000',
      },
    })

    const paciente = await buscarPacientePorExpediente(EXPEDIENTE_FICTICIO)

    expect(Object.keys(paciente).sort()).toEqual(['nombre', 'numeroExpediente'])
    expect(paciente).not.toHaveProperty('dpi')
    expect(paciente).not.toHaveProperty('id')
  })

  it('codifica el número de expediente en la URL', async () => {
    getMock.mockResolvedValue({
      data: { numeroExpediente: '111 222', nombreCompleto: 'Paciente Prueba' },
    })

    await buscarPacientePorExpediente('111 222')

    expect(getMock).toHaveBeenCalledWith('/integracion/hro/paciente/111%20222')
  })

  it('devuelve null ante 404 normalizado del cliente (error.status)', async () => {
    getMock.mockRejectedValue(Object.assign(new Error('no encontrado'), { status: 404 }))

    await expect(buscarPacientePorExpediente(EXPEDIENTE_FICTICIO)).resolves.toBeNull()
  })

  it('devuelve null ante 404 en la forma cruda de axios (error.response.status)', async () => {
    getMock.mockRejectedValue({ response: { status: 404 } })

    await expect(buscarPacientePorExpediente(EXPEDIENTE_FICTICIO)).resolves.toBeNull()
  })

  it('lanza error de integración diferenciado ante 502 (error.status)', async () => {
    getMock.mockRejectedValue(Object.assign(new Error('bad gateway'), { status: 502 }))

    await expect(buscarPacientePorExpediente(EXPEDIENTE_FICTICIO)).rejects.toMatchObject({
      tipo: 'INTEGRACION',
      status: 502,
      message: 'No fue posible consultar el sistema hospitalario. Intente de nuevo.',
    })
  })

  it('lanza error de integración ante 502 en la forma cruda de axios', async () => {
    getMock.mockRejectedValue({ response: { status: 502 } })

    await expect(buscarPacientePorExpediente(EXPEDIENTE_FICTICIO)).rejects.toMatchObject({
      tipo: 'INTEGRACION',
      status: 502,
    })
  })

  it('lanza error genérico ante un error inesperado', async () => {
    getMock.mockRejectedValue(Object.assign(new Error('boom'), { status: 500 }))

    await expect(buscarPacientePorExpediente(EXPEDIENTE_FICTICIO)).rejects.toMatchObject({
      tipo: 'INESPERADO',
      message: 'No se pudo consultar el expediente. Intente de nuevo.',
    })
  })

  it('trata una respuesta sin nombreCompleto como inesperada', async () => {
    getMock.mockResolvedValue({ data: { numeroExpediente: EXPEDIENTE_FICTICIO } })

    await expect(buscarPacientePorExpediente(EXPEDIENTE_FICTICIO)).rejects.toMatchObject({
      tipo: 'INESPERADO',
    })
  })
})

describe('guardarLibroCitas (mock, sin POST real)', () => {
  it('devuelve éxito con el total de items', async () => {
    await expect(guardarLibroCitas({ contadores: {}, items: [{}, {}] })).resolves.toEqual({
      ok: true,
      total: 2,
    })
  })

  it('devuelve total 0 sin items', async () => {
    await expect(guardarLibroCitas({ contadores: {} })).resolves.toEqual({ ok: true, total: 0 })
  })

  it('no muta el payload recibido', async () => {
    const payload = {
      contadores: { ha: 1 },
      items: [{ numeroExpediente: EXPEDIENTE_FICTICIO }],
    }
    const copia = JSON.parse(JSON.stringify(payload))

    await guardarLibroCitas(payload)

    expect(payload).toEqual(copia)
  })
})
