import { describe, expect, it, vi } from 'vitest'
import { CICLO_EN_TRANSITO_ENTREGA } from '../api/fixturesCiclosCoex'
import { cargarLoteEstacion } from '../api/coexApi'
import {
  cargarLoteCoex,
  cargarLoteDesdeCiclos,
  cargarLoteDesdeJornada,
} from './loteCoexSource'

describe('loteCoexSource - cargarLoteDesdeJornada', () => {
  it('conserva el comportamiento: subs activas -> N jornadas -> agregación', async () => {
    const listarSubs = vi.fn().mockResolvedValue([{ id: 1 }, { id: 2 }])
    const listarJornada = vi.fn(({ subespecialidadId }) =>
      Promise.resolve([{ cicloId: `c${subespecialidadId}`, citaId: subespecialidadId }]),
    )

    const lote = await cargarLoteDesdeJornada({
      estacionId: 3,
      fecha: '2026-10-06',
      listarSubs,
      listarJornada,
    })

    expect(listarSubs).toHaveBeenCalledWith(3, '2026-10-06')
    expect(listarJornada).toHaveBeenCalledTimes(2)
    expect(lote.subespecialidades).toHaveLength(2)
    expect(lote.filas).toHaveLength(2)
    expect(lote.filas.map((f) => f.cicloId)).toEqual(['c1', 'c2'])
  })

  it('sin estación devuelve lote vacío sin consultar la API', async () => {
    const listarSubs = vi.fn()
    const lote = await cargarLoteDesdeJornada({ estacionId: null, listarSubs })

    expect(lote).toEqual({ subespecialidades: [], filas: [] })
    expect(listarSubs).not.toHaveBeenCalled()
  })
})

describe('loteCoexSource - cargarLoteDesdeCiclos', () => {
  it('consulta ciclos una sola vez y normaliza la lista', async () => {
    const listarSubs = vi.fn().mockResolvedValue([{ id: 7 }, { id: 8 }])
    const listarCiclos = vi.fn().mockResolvedValue([CICLO_EN_TRANSITO_ENTREGA])

    const lote = await cargarLoteDesdeCiclos({
      estacionId: 4,
      fecha: '2026-10-05',
      listarSubs,
      listarCiclos,
    })

    expect(listarCiclos).toHaveBeenCalledTimes(1)
    expect(listarCiclos).toHaveBeenCalledWith({ fecha: '2026-10-05' })
    expect(lote.subespecialidades).toHaveLength(2)
    expect(lote.filas).toHaveLength(1)
    expect(lote.filas[0].cicloId).toBe(CICLO_EN_TRANSITO_ENTREGA.id)
    expect(lote.filas[0].pacienteNombre).toBe('María Fernanda López García')
  })

  it('NO usa subespecialidades vacías como gate para consultar ciclos', async () => {
    const listarSubs = vi.fn().mockResolvedValue([])
    const listarCiclos = vi.fn().mockResolvedValue([CICLO_EN_TRANSITO_ENTREGA])

    const lote = await cargarLoteDesdeCiclos({
      estacionId: 4,
      fecha: '2026-10-05',
      listarSubs,
      listarCiclos,
    })

    expect(listarCiclos).toHaveBeenCalledTimes(1)
    expect(lote.subespecialidades).toEqual([])
    expect(lote.filas).toHaveLength(1)
    expect(lote.filas[0].cicloId).toBe(CICLO_EN_TRANSITO_ENTREGA.id)
  })

  it('sin estación devuelve lote vacío sin consultar la API', async () => {
    const listarSubs = vi.fn()
    const listarCiclos = vi.fn()
    const lote = await cargarLoteDesdeCiclos({ estacionId: null, listarSubs, listarCiclos })

    expect(lote).toEqual({ subespecialidades: [], filas: [] })
    expect(listarSubs).not.toHaveBeenCalled()
    expect(listarCiclos).not.toHaveBeenCalled()
  })
})

describe('loteCoexSource - cargarLoteCoex', () => {
  it('por defecto usa la fuente de jornada', async () => {
    const listarSubs = vi.fn().mockResolvedValue([{ id: 1 }])
    const listarJornada = vi.fn().mockResolvedValue([{ cicloId: 'c1', citaId: 1 }])

    const lote = await cargarLoteCoex({
      estacionId: 3,
      fecha: '2026-10-06',
      listarSubs,
      listarJornada,
    })

    expect(listarJornada).toHaveBeenCalledTimes(1)
    expect(lote.filas).toHaveLength(1)
  })

  it('permite inyectar la fuente de ciclos', async () => {
    const listarSubs = vi.fn().mockResolvedValue([])
    const listarCiclos = vi.fn().mockResolvedValue([CICLO_EN_TRANSITO_ENTREGA])

    const lote = await cargarLoteCoex({
      estacionId: 4,
      fecha: '2026-10-05',
      fuente: cargarLoteDesdeCiclos,
      listarSubs,
      listarCiclos,
    })

    expect(listarCiclos).toHaveBeenCalledTimes(1)
    expect(lote.filas[0].cicloId).toBe(CICLO_EN_TRANSITO_ENTREGA.id)
  })
})

describe('loteCoexSource - cargarLoteEstacion (delegado)', () => {
  it('sigue usando jornada por defecto (delegado fino de cargarLoteCoex)', async () => {
    const listarSubs = vi.fn().mockResolvedValue([{ id: 1 }])
    const listarJornada = vi.fn().mockResolvedValue([{ cicloId: 'c1', citaId: 1 }])

    const lote = await cargarLoteEstacion({
      estacionId: 3,
      fecha: '2026-10-06',
      listarSubs,
      listarJornada,
    })

    expect(listarSubs).toHaveBeenCalledWith(3, '2026-10-06')
    expect(listarJornada).toHaveBeenCalledWith({ fecha: '2026-10-06', subespecialidadId: 1 })
    expect(lote.filas).toHaveLength(1)
  })
})
