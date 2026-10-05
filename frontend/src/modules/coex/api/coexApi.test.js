import { describe, expect, it, vi } from 'vitest'
import {
  agregarJornadas,
  cargarLoteEstacion,
  claveFila,
  entregarExpedienteCiclo,
  retornarExpedienteCiclo,
} from './coexApi'

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

describe('coexApi - entregarExpedienteCiclo', () => {
  it('hace POST a /expediente-ciclos/{id}/entregar sin cuerpo cuando no hay observación', async () => {
    const cliente = { post: vi.fn().mockResolvedValue({ data: { id: 'c1' } }) }

    await entregarExpedienteCiclo('c1', { cliente, usarMock: false })

    expect(cliente.post).toHaveBeenCalledWith('/expediente-ciclos/c1/entregar', {})
  })

  it('envía la observación cuando se proporciona', async () => {
    const cliente = { post: vi.fn().mockResolvedValue({ data: { id: 'c1' } }) }

    await entregarExpedienteCiclo('c1', {
      observacion: 'Recibido por enfermería',
      cliente,
      usarMock: false,
    })

    expect(cliente.post).toHaveBeenCalledWith('/expediente-ciclos/c1/entregar', {
      observacion: 'Recibido por enfermería',
    })
  })

  it('devuelve el DTO desenvuelto de ApiResponse', async () => {
    const esperado = { id: 'c1', estadoActual: 'entregado' }
    const cliente = { post: vi.fn().mockResolvedValue({ data: esperado }) }

    const resultado = await entregarExpedienteCiclo('c1', { cliente, usarMock: false })

    expect(resultado).toEqual(esperado)
  })

  it('propaga el error normalizado del cliente (400)', async () => {
    const fallo = Object.assign(new Error('Transición inválida'), { status: 400 })
    const cliente = { post: vi.fn().mockRejectedValue(fallo) }

    await expect(
      entregarExpedienteCiclo('c1', { cliente, usarMock: false }),
    ).rejects.toMatchObject({ status: 400 })
  })

  it('en modo mock devuelve el ciclo como entregado', async () => {
    const resultado = await entregarExpedienteCiclo('c1')

    expect(resultado).toMatchObject({ id: 'c1', estadoActual: 'entregado' })
  })
})

describe('coexApi - retornarExpedienteCiclo', () => {
  it('hace POST a /expediente-ciclos/{id}/retornar sin cuerpo cuando no hay observación', async () => {
    const cliente = { post: vi.fn().mockResolvedValue({ data: { id: 'c1' } }) }

    await retornarExpedienteCiclo('c1', { cliente, usarMock: false })

    expect(cliente.post).toHaveBeenCalledWith('/expediente-ciclos/c1/retornar', {})
  })

  it('envía la observación cuando se proporciona', async () => {
    const cliente = { post: vi.fn().mockResolvedValue({ data: { id: 'c1' } }) }

    await retornarExpedienteCiclo('c1', {
      observacion: 'Atención finalizada',
      cliente,
      usarMock: false,
    })

    expect(cliente.post).toHaveBeenCalledWith('/expediente-ciclos/c1/retornar', {
      observacion: 'Atención finalizada',
    })
  })

  it('devuelve el DTO desenvuelto de ApiResponse', async () => {
    const esperado = { id: 'c1', estadoActual: 'en_transito_retorno' }
    const cliente = { post: vi.fn().mockResolvedValue({ data: esperado }) }

    const resultado = await retornarExpedienteCiclo('c1', { cliente, usarMock: false })

    expect(resultado).toEqual(esperado)
  })

  it('propaga el error normalizado del cliente (400)', async () => {
    const fallo = Object.assign(new Error('Transición inválida'), { status: 400 })
    const cliente = { post: vi.fn().mockRejectedValue(fallo) }

    await expect(
      retornarExpedienteCiclo('c1', { cliente, usarMock: false }),
    ).rejects.toMatchObject({ status: 400 })
  })

  it('propaga el error normalizado del cliente (404)', async () => {
    const fallo = Object.assign(new Error('No encontrado'), { status: 404 })
    const cliente = { post: vi.fn().mockRejectedValue(fallo) }

    await expect(
      retornarExpedienteCiclo('c1', { cliente, usarMock: false }),
    ).rejects.toMatchObject({ status: 404 })
  })

  it('propaga el error normalizado del cliente (409)', async () => {
    const fallo = Object.assign(new Error('Conflicto'), { status: 409 })
    const cliente = { post: vi.fn().mockRejectedValue(fallo) }

    await expect(
      retornarExpedienteCiclo('c1', { cliente, usarMock: false }),
    ).rejects.toMatchObject({ status: 409 })
  })

  it('en modo mock devuelve el ciclo como en_transito_retorno', async () => {
    const resultado = await retornarExpedienteCiclo('c1')

    expect(resultado).toMatchObject({ id: 'c1', estadoActual: 'en_transito_retorno' })
  })
})
