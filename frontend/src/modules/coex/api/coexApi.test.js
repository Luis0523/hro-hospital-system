import { describe, expect, it, vi } from 'vitest'
import {
  agregarJornadas,
  cargarLoteEstacion,
  claveFila,
  entregarExpedienteCiclo,
  listarCiclosCoex,
  obtenerDetalleCicloCoex,
  obtenerSalidaCoex,
  obtenerSalidaPdfCoex,
  retornarExpedienteCiclo,
} from './coexApi'
import { CICLO_EN_TRANSITO_ENTREGA } from './fixturesCiclosCoex'

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

describe('coexApi - listarCiclosCoex', () => {
  it('sin filtros consulta la cola sin params y desenvuelve ApiResponse', async () => {
    const cliente = { get: vi.fn().mockResolvedValue({ data: [CICLO_EN_TRANSITO_ENTREGA] }) }

    const resultado = await listarCiclosCoex({ cliente, usarMock: false })

    expect(cliente.get).toHaveBeenCalledWith('/expediente-ciclos', { params: {} })
    expect(resultado).toEqual([CICLO_EN_TRANSITO_ENTREGA])
  })

  it('envía solo los params definidos (fecha)', async () => {
    const cliente = { get: vi.fn().mockResolvedValue({ data: [] }) }

    await listarCiclosCoex({ fecha: '2026-10-05', cliente, usarMock: false })

    expect(cliente.get).toHaveBeenCalledWith('/expediente-ciclos', {
      params: { fecha: '2026-10-05' },
    })
  })

  it('envía estado cuando se define', async () => {
    const cliente = { get: vi.fn().mockResolvedValue({ data: [] }) }

    await listarCiclosCoex({ estado: 'entregado', cliente, usarMock: false })

    expect(cliente.get).toHaveBeenCalledWith('/expediente-ciclos', {
      params: { estado: 'entregado' },
    })
  })

  it('envía subespecialidadId cuando se define (incluido 0)', async () => {
    const cliente = { get: vi.fn().mockResolvedValue({ data: [] }) }

    await listarCiclosCoex({ subespecialidadId: 7, cliente, usarMock: false })
    expect(cliente.get).toHaveBeenCalledWith('/expediente-ciclos', {
      params: { subespecialidadId: 7 },
    })

    await listarCiclosCoex({ subespecialidadId: 0, cliente, usarMock: false })
    expect(cliente.get).toHaveBeenLastCalledWith('/expediente-ciclos', {
      params: { subespecialidadId: 0 },
    })
  })

  it('tolera una respuesta paginada (data.content)', async () => {
    const cliente = { get: vi.fn().mockResolvedValue({ data: { content: [CICLO_EN_TRANSITO_ENTREGA] } }) }

    const resultado = await listarCiclosCoex({ cliente, usarMock: false })

    expect(resultado).toEqual([CICLO_EN_TRANSITO_ENTREGA])
  })

  it('propaga el error normalizado del cliente', async () => {
    const fallo = Object.assign(new Error('No autorizado'), { status: 401 })
    const cliente = { get: vi.fn().mockRejectedValue(fallo) }

    await expect(listarCiclosCoex({ cliente, usarMock: false })).rejects.toMatchObject({
      status: 401,
    })
  })
})

describe('coexApi - obtenerDetalleCicloCoex', () => {
  it('consulta el detalle por id y desenvuelve ApiResponse', async () => {
    const cliente = { get: vi.fn().mockResolvedValue({ data: CICLO_EN_TRANSITO_ENTREGA }) }

    const resultado = await obtenerDetalleCicloCoex('ciclo-001', { cliente, usarMock: false })

    expect(cliente.get).toHaveBeenCalledWith('/expediente-ciclos/ciclo-001')
    expect(resultado).toEqual(CICLO_EN_TRANSITO_ENTREGA)
  })

  it('propaga el 404', async () => {
    const fallo = Object.assign(new Error('No encontrado'), { status: 404 })
    const cliente = { get: vi.fn().mockRejectedValue(fallo) }

    await expect(
      obtenerDetalleCicloCoex('x', { cliente, usarMock: false }),
    ).rejects.toMatchObject({ status: 404 })
  })
})

describe('coexApi - obtenerSalidaCoex', () => {
  it('consulta la salida con fecha y normaliza el sobre', async () => {
    const salida = { fecha: '2026-10-05', total: 1, items: [{ expedienteId: 'e1' }] }
    const cliente = { get: vi.fn().mockResolvedValue({ data: salida }) }

    const resultado = await obtenerSalidaCoex({ fecha: '2026-10-05', cliente, usarMock: false })

    expect(cliente.get).toHaveBeenCalledWith('/archivo/salida', {
      params: { fecha: '2026-10-05' },
    })
    expect(resultado).toEqual(salida)
  })

  it('usa valores por defecto si el sobre viene incompleto', async () => {
    const cliente = { get: vi.fn().mockResolvedValue({ data: {} }) }

    const resultado = await obtenerSalidaCoex({ fecha: '2026-10-05', cliente, usarMock: false })

    expect(resultado).toEqual({ fecha: '2026-10-05', total: 0, items: [] })
  })

  it('propaga el error del cliente', async () => {
    const fallo = Object.assign(new Error('Fallo'), { status: 500 })
    const cliente = { get: vi.fn().mockRejectedValue(fallo) }

    await expect(obtenerSalidaCoex({ cliente, usarMock: false })).rejects.toMatchObject({
      status: 500,
    })
  })
})

describe('coexApi - obtenerSalidaPdfCoex', () => {
  it('solicita el PDF con responseType blob y devuelve el Blob', async () => {
    const blob = new Blob(['pdf'], { type: 'application/pdf' })
    const cliente = { get: vi.fn().mockResolvedValue(blob) }

    const resultado = await obtenerSalidaPdfCoex({ fecha: '2026-10-05', cliente, usarMock: false })

    expect(cliente.get).toHaveBeenCalledWith('/archivo/salida/pdf', {
      params: { fecha: '2026-10-05' },
      responseType: 'blob',
    })
    expect(resultado).toBe(blob)
  })

  it('propaga el error del cliente', async () => {
    const fallo = Object.assign(new Error('Fallo PDF'), { status: 500 })
    const cliente = { get: vi.fn().mockRejectedValue(fallo) }

    await expect(obtenerSalidaPdfCoex({ cliente, usarMock: false })).rejects.toMatchObject({
      status: 500,
    })
  })
})
