import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  aInstante,
  diasEntreFechasIso,
  esFechaIsoValida,
  esInstanteValido,
  fechaGuatemalaDe,
  finDelDiaGuatemala,
  formatearFechaLargaGuatemala,
  formatearFechaGuatemala,
  formatearFechaHoraGuatemala,
  horaConSegundosGuatemalaDe,
  horaGuatemalaDe,
  instanteDesdeFechaHoraGuatemala,
  mismoDiaOperativo,
  ocurrioEnFecha,
  sumarDiasIso,
} from './fechaGuatemala'

const INSTANTE = '2026-11-02T15:30:00.000Z' // 09:30 en Guatemala (UTC-6)

afterEach(() => {
  vi.useRealTimers()
})

describe('fechaGuatemala', () => {
  it('convierte UTC a la fecha y hora de Guatemala', () => {
    expect(fechaGuatemalaDe(INSTANTE)).toBe('2026-11-02')
    expect(horaGuatemalaDe(INSTANTE)).toBe('09:30')
  })

  it('respeta el cambio de dÃ­a en horario de Guatemala', () => {
    // 05:59:59.999Z todavÃ­a es 23:59 del dÃ­a anterior en Guatemala.
    expect(fechaGuatemalaDe('2026-11-02T05:59:59.999Z')).toBe('2026-11-01')
    expect(horaGuatemalaDe('2026-11-02T05:59:59.999Z')).toBe('23:59')

    // 06:00:00.000Z ya es medianoche del dÃ­a siguiente.
    expect(fechaGuatemalaDe('2026-11-02T06:00:00.000Z')).toBe('2026-11-02')
    expect(horaGuatemalaDe('2026-11-02T06:00:00.000Z')).toBe('00:00')
  })

  it('usa formato de 24 horas', () => {
    expect(horaGuatemalaDe('2026-11-02T18:05:00.000Z')).toBe('12:05')
    expect(horaGuatemalaDe('2026-11-03T02:15:00.000Z')).toBe('20:15')
    expect(fechaGuatemalaDe('2026-11-03T02:15:00.000Z')).toBe('2026-11-02')
  })

  it('formatea para presentaciÃ³n en dd/MM/yyyy y HH:mm', () => {
    expect(formatearFechaHoraGuatemala(INSTANTE)).toBe('02/11/2026 09:30')
    expect(formatearFechaGuatemala('2026-11-02T05:30:00.000Z')).toBe('01/11/2026')
  })

  it('devuelve null o cadena vacÃ­a ante instantes invÃ¡lidos', () => {
    expect(fechaGuatemalaDe('no-es-una-fecha')).toBeNull()
    expect(fechaGuatemalaDe(null)).toBeNull()
    expect(horaGuatemalaDe(null)).toBeNull()
    expect(formatearFechaGuatemala('x')).toBe('')
    expect(formatearFechaHoraGuatemala(null)).toBe('')
  })

  it('valida instantes de entrada', () => {
    expect(esInstanteValido(INSTANTE)).toBe(true)
    expect(esInstanteValido(new Date(INSTANTE))).toBe(true)
    expect(esInstanteValido(0)).toBe(true)
    expect(esInstanteValido(new Date('invalid'))).toBe(false)
    expect(esInstanteValido(Number.NaN)).toBe(false)
    expect(esInstanteValido(null)).toBe(false)
    expect(esInstanteValido({})).toBe(false)
    expect(esInstanteValido(true)).toBe(false)
  })

  it('aInstante no muta el Date recibido ni comparte referencia', () => {
    const original = new Date(INSTANTE)
    const copia = aInstante(original)

    expect(copia).not.toBe(original)
    expect(copia.toISOString()).toBe(INSTANTE)
    expect(original.toISOString()).toBe(INSTANTE)
  })

  it('compara dÃ­as operativos completos', () => {
    expect(mismoDiaOperativo('2026-11-02T05:30:00.000Z', '2026-11-02T05:59:00.000Z')).toBe(true)
    expect(mismoDiaOperativo('2026-11-02T05:59:00.000Z', '2026-11-02T06:00:00.000Z')).toBe(false)
    expect(mismoDiaOperativo('2026-11-02T15:30:00.000Z', '2026-11-02T23:00:00.000Z')).toBe(true)
    expect(mismoDiaOperativo(null, INSTANTE)).toBe(false)
    expect(mismoDiaOperativo(INSTANTE, 'x')).toBe(false)
  })

  it('determina si un movimiento ocurriÃ³ en una fecha guatemalteca', () => {
    expect(ocurrioEnFecha('2026-11-02T05:30:00.000Z', '2026-11-01')).toBe(true)
    expect(ocurrioEnFecha('2026-11-02T05:30:00.000Z', '2026-11-02')).toBe(false)
    expect(ocurrioEnFecha(INSTANTE, '2026-11-02')).toBe(true)
    expect(ocurrioEnFecha(INSTANTE, ' 2026-11-02 ')).toBe(true)
    expect(ocurrioEnFecha(null, '2026-11-02')).toBe(false)
    expect(ocurrioEnFecha(INSTANTE, '31-12-2026')).toBe(false)
    expect(ocurrioEnFecha(INSTANTE, '2026-02-31')).toBe(false)
  })

  it('valida fechas ISO reales del calendario', () => {
    expect(esFechaIsoValida('2026-11-02')).toBe(true)
    expect(esFechaIsoValida('2026-02-31')).toBe(false)
    expect(esFechaIsoValida('2026-13-01')).toBe(false)
    expect(esFechaIsoValida('02/11/2026')).toBe(false)
    expect(esFechaIsoValida('2026-2-1')).toBe(false)
    expect(esFechaIsoValida('')).toBe(false)
    expect(esFechaIsoValida(null)).toBe(false)
  })

  it('construye instantes desde fecha y hora de Guatemala', () => {
    expect(instanteDesdeFechaHoraGuatemala('2026-11-02', '09:30').toISOString()).toBe(INSTANTE)
    expect(instanteDesdeFechaHoraGuatemala('2026-11-01', '23:30').toISOString()).toBe(
      '2026-11-02T05:30:00.000Z',
    )
    expect(instanteDesdeFechaHoraGuatemala('2026-11-02').toISOString()).toBe(
      '2026-11-02T06:00:00.000Z',
    )
    expect(instanteDesdeFechaHoraGuatemala('2027-01-01', '00:00').toISOString()).toBe(
      '2027-01-01T06:00:00.000Z',
    )
  })

  it('rechaza fecha u hora invÃ¡lidas al construir instantes', () => {
    expect(instanteDesdeFechaHoraGuatemala('2026-02-31', '09:30')).toBeNull()
    expect(instanteDesdeFechaHoraGuatemala('2026-11-02', '24:00')).toBeNull()
    expect(instanteDesdeFechaHoraGuatemala('2026-11-02', '9:30')).toBeNull()
    expect(instanteDesdeFechaHoraGuatemala(null, '09:30')).toBeNull()
  })

  it('hace ida y vuelta fecha/hora sin perder el instante', () => {
    const instante = instanteDesdeFechaHoraGuatemala('2026-12-31', '23:59')
    expect(fechaGuatemalaDe(instante)).toBe('2026-12-31')
    expect(horaGuatemalaDe(instante)).toBe('23:59')
  })

  it('calcula el Ãºltimo milisegundo del dÃ­a guatemalteco', () => {
    expect(finDelDiaGuatemala('2026-11-02').toISOString()).toBe('2026-11-03T05:59:59.999Z')
    expect(finDelDiaGuatemala('2026-12-31').toISOString()).toBe('2027-01-01T05:59:59.999Z')
    expect(finDelDiaGuatemala('2026-02-31')).toBeNull()
  })

  it('suma dÃ­as respetando el calendario', () => {
    expect(sumarDiasIso('2026-12-31', 1)).toBe('2027-01-01')
    expect(sumarDiasIso('2027-01-01', -1)).toBe('2026-12-31')
    expect(sumarDiasIso('2026-03-01', -1)).toBe('2026-02-28')
    expect(sumarDiasIso('2026-11-02', 0)).toBe('2026-11-02')
    expect(sumarDiasIso('2026-11-02', 1.5)).toBeNull()
    expect(sumarDiasIso('x', 1)).toBeNull()
  })

  it('calcula la diferencia en dÃ­as de calendario', () => {
    expect(diasEntreFechasIso('2026-10-30', '2026-11-02')).toBe(3)
    expect(diasEntreFechasIso('2026-11-02', '2026-10-30')).toBe(-3)
    expect(diasEntreFechasIso('2026-11-02', '2026-11-02')).toBe(0)
    expect(diasEntreFechasIso('2026-11-02', '2026-02-31')).toBeNull()
  })

  it('usa el instante actual cuando no se recibe argumento', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-02T05:30:00.000Z'))

    expect(fechaGuatemalaDe()).toBe('2026-11-01')
    expect(horaGuatemalaDe()).toBe('23:30')
    expect(mismoDiaOperativo('2026-11-01T20:00:00.000Z')).toBe(true)
  })
})

describe('reloj y fecha larga', () => {
  it('devuelve la hora con segundos en 24 h', () => {
    expect(horaConSegundosGuatemalaDe('2026-11-02T15:30:45.000Z')).toBe('09:30:45')
    expect(horaConSegundosGuatemalaDe('2026-11-02T06:00:00.000Z')).toBe('00:00:00')
    expect(horaConSegundosGuatemalaDe('x')).toBeNull()
  })

  it('formatea la fecha larga con día de la semana', () => {
    const texto = formatearFechaLargaGuatemala('2026-11-01T15:00:00.000Z')
    expect(texto).toContain('Domingo')
    expect(texto).toContain('1 de noviembre de 2026')
    expect(formatearFechaLargaGuatemala('x')).toBe('')
  })
})
