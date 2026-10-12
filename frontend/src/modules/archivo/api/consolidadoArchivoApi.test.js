import { beforeEach, describe, expect, it } from 'vitest'
import { expedientesMock } from './mockData'
import { reiniciarDepuracionesMock } from './depuracionMock'
import { marcarDepurado } from './depuracionArchivoApi'
import { obtenerConsolidadoDiario, obtenerConsolidadoMensual } from './consolidadoArchivoApi'

const EXISTENTE = expedientesMock.find((expediente) => expediente.numeroExpediente).numeroExpediente

describe('consolidadoArchivoApi (mock)', () => {
  beforeEach(() => {
    reiniciarDepuracionesMock()
  })

  it('devuelve el consolidado diario con la forma del contrato', async () => {
    const consolidado = await obtenerConsolidadoDiario()

    expect(consolidado).toMatchObject({
      total: expect.any(Number),
      totalDepurados: 0,
    })
    expect(consolidado.fecha).toBeTruthy()
    expect(Array.isArray(consolidado.porEspecialidad)).toBe(true)
    expect(consolidado.porEspecialidad.length).toBeGreaterThan(0)
    expect(consolidado.total).toBeGreaterThan(0)
  })

  it('ordena las especialidades de mayor a menor', async () => {
    const { porEspecialidad } = await obtenerConsolidadoDiario()

    const totales = porEspecialidad.map((item) => item.total)
    expect([...totales].sort((a, b) => b - a)).toEqual(totales)
  })

  it('refleja los depurados del día en totalDepurados', async () => {
    await marcarDepurado({ numeroExpediente: EXISTENTE })

    const consolidado = await obtenerConsolidadoDiario()
    expect(consolidado.totalDepurados).toBe(1)
  })

  it('devuelve el consolidado mensual con su forma', async () => {
    const mensual = await obtenerConsolidadoMensual({ anio: 2026, mes: 10 })

    expect(mensual.rango).toEqual({ desde: '2026-10-01', hasta: '2026-10-31' })
    expect(Array.isArray(mensual.informe)).toBe(true)
    expect(mensual.informe.length).toBeGreaterThan(0)
    expect(mensual.informe[0]).toMatchObject({
      dia: expect.any(String),
      hdc: expect.any(Number),
      hd: expect.any(Number),
    })
    expect(mensual.detalle[0]).toHaveProperty('porEspecialidad')
    expect(mensual.detalle[0].total).toBe(
      mensual.detalle[0].porEspecialidad.reduce((total, item) => total + item.total, 0),
    )
    expect(mensual.totales.totalCarnets).toBeGreaterThan(0)
  })
})
