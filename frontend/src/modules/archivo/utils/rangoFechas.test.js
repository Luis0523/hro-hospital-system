import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  aniosDelRango,
  aplicarMascaraFecha,
  fechaEnRango,
  filtrarRegistrosPorRango,
  formatearFechaTexto,
  formatearGeneracionGuatemala,
  parsearFechaTexto,
  rangoMesActualGuatemala,
  validarRangoFechas,
} from './rangoFechas'

afterEach(() => {
  vi.useRealTimers()
})

describe('rangoFechas', () => {
  it('aplica la máscara dd/mm/aaaa sin exigir barras', () => {
    expect(aplicarMascaraFecha('03112026')).toBe('03/11/2026')
    expect(aplicarMascaraFecha('0311')).toBe('03/11')
    expect(aplicarMascaraFecha('031')).toBe('03/1')
    expect(aplicarMascaraFecha('03/11/2026')).toBe('03/11/2026')
    expect(aplicarMascaraFecha('03/11/202')).toBe('03/11/202')
    expect(aplicarMascaraFecha('2026-11-03')).toBe('03/11/2026')
    expect(aplicarMascaraFecha('03abc112026xyz')).toBe('03/11/2026')
  })

  it('valida fechas reales, incluidos años bisiestos', () => {
    expect(parsearFechaTexto('29022024')).toBe('2024-02-29')
    expect(parsearFechaTexto('29/02/2024')).toBe('2024-02-29')
    expect(parsearFechaTexto('2024-02-29')).toBe('2024-02-29')
    expect(parsearFechaTexto('29022025')).toBeNull()
    expect(parsearFechaTexto('31022026')).toBeNull()
    expect(parsearFechaTexto('00012026')).toBeNull()
    expect(parsearFechaTexto('01132026')).toBeNull()
    expect(parsearFechaTexto('01012026')).toBe('2026-01-01')
    expect(parsearFechaTexto('31122026')).toBe('2026-12-31')
  })

  it('respeta el rango de años del contrato backend', () => {
    expect(parsearFechaTexto('31121999')).toBeNull()
    expect(parsearFechaTexto('01012101')).toBeNull()
    expect(parsearFechaTexto('01012000')).toBe('2000-01-01')
    expect(parsearFechaTexto('31122100')).toBe('2100-12-31')
  })

  it('rechaza fechas incompletas o rangos invertidos', () => {
    const incompleto = validarRangoFechas('0311', '31122026')
    expect(incompleto.valido).toBe(false)
    expect(incompleto.errores.desde).toBeTruthy()

    const invertido = validarRangoFechas('31122026', '01112026')
    expect(invertido.valido).toBe(false)
    expect(invertido.errores.hasta).toContain('anterior')

    expect(validarRangoFechas('01112026', '30112026')).toMatchObject({
      valido: true,
      desde: '2026-11-01',
      hasta: '2026-11-30',
    })
  })

  it('calcula el mes actual de Guatemala y sus límites reales', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-15T12:00:00Z'))
    expect(rangoMesActualGuatemala()).toEqual({
      desde: '2026-11-01',
      hasta: '2026-11-30',
    })

    vi.setSystemTime(new Date('2024-02-10T12:00:00Z'))
    expect(rangoMesActualGuatemala()).toEqual({
      desde: '2024-02-01',
      hasta: '2024-02-29',
    })
  })

  it('obtiene todos los años del rango, sin límites artificiales', () => {
    expect(aniosDelRango('2025-12-15', '2026-02-10')).toEqual([2025, 2026])
    expect(aniosDelRango('2026-11-01', '2026-11-30')).toEqual([2026])
    expect(aniosDelRango('2000-01-01', '2100-12-31')).toHaveLength(101)
    expect(aniosDelRango('2026-12-01', '2026-11-01')).toEqual([])
    expect(aniosDelRango('', '2026-11-30')).toEqual([])
  })

  it('filtra registros inclusivos y los ordena descendente', () => {
    const registros = [
      { fecha: '2026-10-31' },
      { fecha: '2026-11-01' },
      { fecha: '2026-11-15' },
      { fecha: '2026-11-30' },
      { fecha: '2026-12-01' },
    ]
    expect(
      filtrarRegistrosPorRango(registros, '2026-11-01', '2026-11-30').map(
        (registro) => registro.fecha,
      ),
    ).toEqual(['2026-11-30', '2026-11-15', '2026-11-01'])
  })

  it('indica si una fecha está en el rango y formatea la generación en Guatemala', () => {
    expect(fechaEnRango('2026-11-15', { desde: '2026-11-01', hasta: '2026-11-30' })).toBe(true)
    expect(fechaEnRango('2026-12-01', { desde: '2026-11-01', hasta: '2026-11-30' })).toBe(false)
    expect(formatearFechaTexto('2026-11-03')).toBe('03/11/2026')

    const generacion = formatearGeneracionGuatemala(new Date('2026-11-04T02:30:00Z'))
    expect(generacion).toContain('20:30')
    expect(generacion).toContain('03/11/2026')
  })
})
