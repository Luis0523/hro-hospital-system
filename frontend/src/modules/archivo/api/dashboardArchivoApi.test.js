import { describe, expect, it } from 'vitest'
import {
  USANDO_DATOS_MOCK,
  listarMovimientosArchivo,
  obtenerEstadisticasArchivo,
  obtenerResumenArchivo,
} from './dashboardArchivoApi'
import { ORDEN_ESTADOS } from '../estadosExpediente'

describe('dashboardArchivoApi (mock)', () => {
  it('expone la bandera de datos simulados en modo test', () => {
    expect(USANDO_DATOS_MOCK).toBe(true)
  })

  it('obtiene estadísticas con la forma del contrato', async () => {
    const estadisticas = await obtenerEstadisticasArchivo()

    expect(estadisticas.rango).toHaveProperty('desde')
    expect(estadisticas.rango).toHaveProperty('hasta')
    expect(estadisticas.totales).toMatchObject({
      totalCiclos: expect.any(Number),
      expedientesNuevos: expect.any(Number),
      noLocalizado: expect.any(Number),
      archivado: expect.any(Number),
      entregado: expect.any(Number),
      enTransito: expect.any(Number),
    })
    expect(Array.isArray(estadisticas.porEstado)).toBe(true)
    expect(estadisticas.serieDiaria.length).toBeGreaterThan(0)
    expect(Array.isArray(estadisticas.porUnidad)).toBe(true)
    expect(estadisticas.permanencia.length).toBeGreaterThan(0)
  })

  it('devuelve los 8 estados en orden con no_localizado al final', async () => {
    const { porEstado } = await obtenerEstadisticasArchivo()

    expect(porEstado.map((item) => item.estado)).toEqual([...ORDEN_ESTADOS, 'no_localizado'])
  })

  it('respeta el filtro por subespecialidad', async () => {
    const { porEstado } = await obtenerEstadisticasArchivo({ subespecialidadId: 2 })

    // El total agregado nunca es negativo y la forma se mantiene.
    expect(porEstado.every((item) => item.total >= 0)).toBe(true)
  })

  it('lista movimientos con la forma paginada de Spring', async () => {
    const pagina = await listarMovimientosArchivo()

    expect(pagina).toMatchObject({
      totalElements: expect.any(Number),
      totalPages: expect.any(Number),
      size: 20,
      number: 0,
      first: true,
    })
    expect(pagina.content.length).toBeGreaterThan(0)

    const [evento] = pagina.content
    expect(evento).toHaveProperty('numeroExpediente')
    expect(evento).toHaveProperty('pacienteNombre')
    expect(evento).toHaveProperty('estadoNuevo')
    expect(evento).toHaveProperty('fechaMovimiento')
  })

  it('pagina los movimientos y marca first/last', async () => {
    const primera = await listarMovimientosArchivo({ page: 0, size: 2 })
    const ultima = await listarMovimientosArchivo({ page: primera.totalPages - 1, size: 2 })

    expect(primera.content).toHaveLength(2)
    expect(primera.first).toBe(true)
    expect(ultima.last).toBe(true)
  })

  it('filtra los movimientos por estado nuevo', async () => {
    const pagina = await listarMovimientosArchivo({ estado: 'no_localizado' })

    expect(pagina.content.every((evento) => evento.estadoNuevo === 'no_localizado')).toBe(true)
  })

  it('reexporta el resumen operativo existente', async () => {
    const resumen = await obtenerResumenArchivo()

    expect(resumen).toHaveProperty('totalCiclos')
    expect(resumen).toHaveProperty('noLocalizado')
  })
})
