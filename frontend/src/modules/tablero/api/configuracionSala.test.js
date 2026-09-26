import { describe, expect, it, vi } from 'vitest'
import { leerSalaDeUrl, parsearSalasConfig, resolverConfiguracionSala } from './configuracionSala'

function fetchOk(cuerpo) {
  return vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(cuerpo) })
}

const CONFIG = {
  salas: {
    1: [10, 11, 12],
    2: [20, 21],
    3: [],
  },
}

describe('configuracionSala · leerSalaDeUrl', () => {
  it('detecta ausencia y presencia de ?sala', () => {
    expect(leerSalaDeUrl('')).toEqual({ tieneSala: false, sala: null })
    expect(leerSalaDeUrl('?sala=1')).toEqual({ tieneSala: true, sala: '1' })
    expect(leerSalaDeUrl('?sala=')).toEqual({ tieneSala: true, sala: '' })
  })
})

describe('configuracionSala · parsearSalasConfig', () => {
  it('sanea IDs, deduplica e ignora inválidos', () => {
    const salas = parsearSalasConfig({ salas: { 1: [10, 10, 'abc', 11, -2, 0] } })

    expect(salas['1']).toEqual([10, 11])
  })

  it('devuelve null si la estructura es inválida', () => {
    expect(parsearSalasConfig(null)).toBeNull()
    expect(parsearSalasConfig({})).toBeNull()
    expect(parsearSalasConfig({ salas: [] })).toBeNull()
    expect(parsearSalasConfig({ salas: { 1: 'no-array' } })).toBeNull()
  })
})

describe('configuracionSala · resolverConfiguracionSala', () => {
  it('sin ?sala usa el fallback indicado', async () => {
    const fetchImpl = vi.fn()

    const resultado = await resolverConfiguracionSala({
      search: '',
      fetchImpl,
      permitidasFallback: [5, 6],
    })

    expect(resultado).toEqual({ modo: 'fallback', sala: null, permitidas: [5, 6] })
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('sin ?sala y sin fallback devuelve permitidas null (todas)', async () => {
    const resultado = await resolverConfiguracionSala({
      search: '',
      fetchImpl: vi.fn(),
      permitidasFallback: null,
    })

    expect(resultado.modo).toBe('fallback')
    expect(resultado.permitidas).toBeNull()
  })

  it('?sala=1 carga la sala 1', async () => {
    const resultado = await resolverConfiguracionSala({
      search: '?sala=1',
      fetchImpl: fetchOk(CONFIG),
    })

    expect(resultado).toEqual({ modo: 'sala', sala: '1', permitidas: [10, 11, 12] })
  })

  it('?sala=2 carga la sala 2 con la misma configuración', async () => {
    const resultado = await resolverConfiguracionSala({
      search: '?sala=2',
      fetchImpl: fetchOk(CONFIG),
    })

    expect(resultado).toEqual({ modo: 'sala', sala: '2', permitidas: [20, 21] })
  })

  it('?sala con valor vacío es inválida', async () => {
    await expect(
      resolverConfiguracionSala({ search: '?sala=', fetchImpl: fetchOk(CONFIG) }),
    ).rejects.toMatchObject({ code: 'SALA_NO_CONFIGURADA' })
  })

  it('?sala=abc es inválida', async () => {
    await expect(
      resolverConfiguracionSala({ search: '?sala=abc', fetchImpl: fetchOk(CONFIG) }),
    ).rejects.toMatchObject({ code: 'SALA_NO_CONFIGURADA' })
  })

  it('?sala=99 es inválida', async () => {
    await expect(
      resolverConfiguracionSala({ search: '?sala=99', fetchImpl: fetchOk(CONFIG) }),
    ).rejects.toMatchObject({ code: 'SALA_NO_CONFIGURADA' })
  })

  it('sala válida ausente en el JSON es error seguro', async () => {
    await expect(
      resolverConfiguracionSala({ search: '?sala=4', fetchImpl: fetchOk(CONFIG) }),
    ).rejects.toMatchObject({ code: 'SALA_NO_CONFIGURADA' })
  })

  it('un error HTTP es error seguro', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 500 })

    await expect(resolverConfiguracionSala({ search: '?sala=1', fetchImpl })).rejects.toMatchObject(
      { code: 'SALA_NO_CONFIGURADA' },
    )
  })

  it('un rechazo de red es error seguro', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error('network'))

    await expect(resolverConfiguracionSala({ search: '?sala=1', fetchImpl })).rejects.toMatchObject(
      { code: 'SALA_NO_CONFIGURADA' },
    )
  })

  it('un JSON inválido es error seguro', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.reject(new Error('bad json')),
    })

    await expect(resolverConfiguracionSala({ search: '?sala=1', fetchImpl })).rejects.toMatchObject(
      { code: 'SALA_NO_CONFIGURADA' },
    )
  })

  it('una estructura inválida es error seguro', async () => {
    await expect(
      resolverConfiguracionSala({ search: '?sala=1', fetchImpl: fetchOk({ salas: [] }) }),
    ).rejects.toMatchObject({ code: 'SALA_NO_CONFIGURADA' })
  })

  it('una sala existente [] es válida con cero permitidas', async () => {
    const resultado = await resolverConfiguracionSala({
      search: '?sala=3',
      fetchImpl: fetchOk(CONFIG),
    })

    expect(resultado).toEqual({ modo: 'sala', sala: '3', permitidas: [] })
    expect(resultado.permitidas).not.toBeNull()
  })

  it('no convierte una configuración inválida en "mostrar todas"', async () => {
    const resultados = await Promise.allSettled([
      resolverConfiguracionSala({ search: '?sala=abc', fetchImpl: fetchOk(CONFIG) }),
      resolverConfiguracionSala({ search: '?sala=4', fetchImpl: fetchOk(CONFIG) }),
    ])

    for (const resultado of resultados) {
      expect(resultado.status).toBe('rejected')
      expect(resultado.reason.code).toBe('SALA_NO_CONFIGURADA')
    }
  })
})
