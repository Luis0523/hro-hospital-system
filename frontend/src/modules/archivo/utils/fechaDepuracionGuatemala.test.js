import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  fechaIsoEnGuatemala,
  formatearFechaCortaGuatemala,
  formatearHoraGuatemala,
  hoyIsoGuatemala,
} from './fechaDepuracionGuatemala.js'

describe('fechaDepuracionGuatemala', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('calcula la fecha operativa en Guatemala desde un instante con offset', () => {
    expect(fechaIsoEnGuatemala(new Date('2026-11-02T15:30:00-06:00'))).toBe('2026-11-02')
    expect(fechaIsoEnGuatemala(new Date('2026-11-02T23:30:00-06:00'))).toBe('2026-11-02')
  })

  it('usa la fecha de Guatemala aunque en UTC ya sea otro día', () => {
    // 23:30 del 2 de noviembre en Guatemala = 05:30 UTC del 3 de noviembre.
    expect(fechaIsoEnGuatemala(new Date('2026-11-03T05:30:00Z'))).toBe('2026-11-02')
    expect(fechaIsoEnGuatemala(new Date('2026-11-03T05:59:59Z'))).toBe('2026-11-02')
  })

  it('cambia de día exactamente a la medianoche guatemalteca', () => {
    expect(fechaIsoEnGuatemala(new Date('2026-11-03T05:59:59Z'))).toBe('2026-11-02')
    expect(fechaIsoEnGuatemala(new Date('2026-11-03T06:00:00Z'))).toBe('2026-11-03')
  })

  it('maneja el cambio de mes y de año en la zona del hospital', () => {
    expect(fechaIsoEnGuatemala(new Date('2027-01-01T05:59:59Z'))).toBe('2026-12-31')
    expect(fechaIsoEnGuatemala(new Date('2027-01-01T06:00:00Z'))).toBe('2027-01-01')
  })

  it('obtiene el día operativo actual con reloj controlado', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-03T03:00:00Z'))
    expect(hoyIsoGuatemala()).toBe('2026-11-02')

    vi.setSystemTime(new Date('2026-11-03T06:00:00Z'))
    expect(hoyIsoGuatemala()).toBe('2026-11-03')
  })

  it('devuelve null ante valores ausentes o inválidos', () => {
    expect(fechaIsoEnGuatemala(null)).toBeNull()
    expect(fechaIsoEnGuatemala('no-es-una-fecha')).toBeNull()
    expect(fechaIsoEnGuatemala(new Date('invalida'))).toBeNull()
  })

  it('formatea la hora en Guatemala desde un ISO con Z', () => {
    expect(formatearHoraGuatemala('2026-11-02T21:30:00Z')).toBe('15:30')
    expect(formatearHoraGuatemala('2026-11-03T06:00:00Z')).toBe('00:00')
  })

  it('formatea la hora desde un ISO con offset sin conversiones dobles', () => {
    expect(formatearHoraGuatemala('2026-11-02T15:30:00-06:00')).toBe('15:30')
    expect(formatearHoraGuatemala('2026-11-02T16:30:00-05:00')).toBe('15:30')
  })

  it('devuelve cadena vacía cuando la hora falta o es inválida', () => {
    expect(formatearHoraGuatemala(null)).toBe('')
    expect(formatearHoraGuatemala(undefined)).toBe('')
    expect(formatearHoraGuatemala('')).toBe('')
    expect(formatearHoraGuatemala('no-es-una-fecha')).toBe('')
  })

  it('formatea la fecha corta en Guatemala sin desfasar fechas ISO sin hora', () => {
    expect(formatearFechaCortaGuatemala('2026-11-02')).toBe('02/11/2026')
    expect(formatearFechaCortaGuatemala('2026-11-03T05:30:00Z')).toBe('02/11/2026')
    expect(formatearFechaCortaGuatemala('2026-11-02T15:30:00-06:00')).toBe('02/11/2026')
  })

  it('devuelve cadena vacía cuando la fecha falta o es inválida', () => {
    expect(formatearFechaCortaGuatemala(null)).toBe('')
    expect(formatearFechaCortaGuatemala(undefined)).toBe('')
    expect(formatearFechaCortaGuatemala('')).toBe('')
    expect(formatearFechaCortaGuatemala('no-es-una-fecha')).toBe('')
  })
})
