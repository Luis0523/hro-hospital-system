import { describe, expect, it, vi } from 'vitest'
import { agregarJornadas, cargarLoteEstacion, claveFila } from './coexApi'

describe('coexApi - identidad y agregación', () => {
  it('claveFila prioriza cicloId, luego citaId y finalmente expedienteId', () => {
    expect(claveFila({ cicloId: 'c1', citaId: 1 })).toBe('ciclo:c1')
    expect(claveFila({ cicloId: null, citaId: 2 })).toBe('cita:2')
    expect(claveFila({ cicloId: null, citaId: null, expedienteId: 'e1' })).toBe('expediente:e1')
    expect(claveFila({})).toBeNull()
    expect(claveFila(null)).toBeNull()
  })

  it('agrega varias subespecialidades sin duplicar filas', () => {
    const listaA = [
      { cicloId: 'c1', citaId: 1, subespecialidadId: 1, estadoActual: 'en_transito_entrega' },
      { cicloId: 'c2', citaId: 2, subespecialidadId: 1, estadoActual: 'entregado' },
    ]
    const listaB = [
      { cicloId: null, citaId: 3, subespecialidadId: 2, estadoActual: 'sin_ciclo' },
      { cicloId: 'c1', citaId: 1, subespecialidadId: 1, estadoActual: 'en_transito_entrega' },
    ]

    const filas = agregarJornadas([listaA, listaB])

    expect(filas).toHaveLength(3)
    expect(filas.map((fila) => fila.citaId)).toEqual([1, 2, 3])
  })
})

describe('coexApi - cargarLoteEstacion', () => {
  it('consulta la jornada una vez por subespecialidad y agrega los resultados', async () => {
    const listarSubs = vi.fn().mockResolvedValue([{ id: 1 }, { id: 2 }])
    const listarJornada = vi.fn(({ subespecialidadId }) =>
      Promise.resolve(
        subespecialidadId === 1
          ? [{ cicloId: 'c1', citaId: 1, subespecialidadId: 1 }]
          : [{ cicloId: 'c2', citaId: 2, subespecialidadId: 2 }],
      ),
    )

    const lote = await cargarLoteEstacion({
      estacionId: 3,
      fecha: '2026-10-06',
      listarSubs,
      listarJornada,
    })

    expect(listarSubs).toHaveBeenCalledWith(3, '2026-10-06')
    expect(listarJornada).toHaveBeenCalledTimes(2)
    expect(listarJornada).toHaveBeenCalledWith({ fecha: '2026-10-06', subespecialidadId: 1 })
    expect(lote.filas).toHaveLength(2)
  })

  it('sin estación devuelve un lote vacío sin consultar la API', async () => {
    const listarSubs = vi.fn()

    const lote = await cargarLoteEstacion({ estacionId: null, listarSubs })

    expect(lote).toEqual({ subespecialidades: [], filas: [] })
    expect(listarSubs).not.toHaveBeenCalled()
  })
})
