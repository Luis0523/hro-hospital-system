import { describe, expect, it } from 'vitest'
import { buscarPacientePorExpediente } from './libroCitasApi'
import { buscarPacienteMock, PACIENTES_MOCK } from './mockData'

describe('libroCitasApi · buscarPacientePorExpediente (mock)', () => {
  it('encuentra un paciente conocido', async () => {
    const paciente = await buscarPacientePorExpediente('1323-23')

    expect(paciente).toMatchObject({
      id: expect.any(String),
      numeroExpediente: '1323-23',
      nombre: expect.any(String),
    })
  })

  it('expone SOLO id, numeroExpediente y nombre', async () => {
    const paciente = await buscarPacientePorExpediente('1401-24')

    expect(Object.keys(paciente).sort()).toEqual(['id', 'nombre', 'numeroExpediente'])
  })

  it('devuelve null si el expediente no existe (sin inventar nombre)', async () => {
    expect(await buscarPacientePorExpediente('9999-99')).toBeNull()
    expect(await buscarPacientePorExpediente('0000-00')).toBeNull()
  })

  it('normaliza espacios alrededor', async () => {
    const paciente = await buscarPacientePorExpediente('  1323-23 ')

    expect(paciente).toMatchObject({ numeroExpediente: '1323-23' })
  })

  it('es determinista', async () => {
    const a = await buscarPacientePorExpediente('1323-23')
    const b = await buscarPacientePorExpediente('1323-23')

    expect(a).toEqual(b)
  })

  it('el catálogo mock no contiene datos sensibles', () => {
    for (const paciente of PACIENTES_MOCK) {
      expect(Object.keys(paciente).sort()).toEqual(['id', 'nombre', 'numeroExpediente'])
    }
  })

  it('buscarPacienteMock hace match exacto por número de expediente', () => {
    expect(buscarPacienteMock('1323-23')).not.toBeNull()
    expect(buscarPacienteMock('1323-24')).toBeNull()
  })
})
