import { describe, expect, it } from 'vitest'
import { buscarPacientePorExpediente, guardarLibroCitas } from './libroCitasApi'
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

describe('libroCitasApi · guardarLibroCitas (mock)', () => {
  const payload = {
    contadores: { ha: 1, eh: 0, hdt: 0, hdc: 0, sobres: 2, hr: 0, hd: 0, tia: 0 },
    items: [{ numeroExpediente: '1323-23', especialidadId: 1 }],
  }

  it('devuelve éxito con el total de items', async () => {
    await expect(guardarLibroCitas(payload)).resolves.toEqual({ ok: true, total: 1 })
  })

  it('devuelve total 0 sin items', async () => {
    await expect(guardarLibroCitas({ contadores: {} })).resolves.toEqual({ ok: true, total: 0 })
    await expect(guardarLibroCitas()).resolves.toEqual({ ok: true, total: 0 })
  })

  it('no muta el payload recibido', async () => {
    const copia = JSON.parse(JSON.stringify(payload))

    await guardarLibroCitas(payload)

    expect(payload).toEqual(copia)
  })
})
