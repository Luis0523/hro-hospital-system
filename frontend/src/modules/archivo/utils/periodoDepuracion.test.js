import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  crearPeriodo,
  diaSemanaLunesCero,
  diferenciaDias,
  esFechaISOValida,
  etiquetaPeriodo,
  fechasDelRango,
  sumarDias,
  textoVacioPeriodo,
  tituloPeriodo,
  validarRangoPersonalizado,
} from './periodoDepuracion'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('periodoDepuracion', () => {
  it('resuelve Hoy con el día operativo recibido', () => {
    const periodo = crearPeriodo('hoy', { hoy: '2026-11-02' })

    expect(periodo).toMatchObject({
      tipo: 'hoy',
      valido: true,
      desde: '2026-11-02',
      hasta: '2026-11-02',
      diasCalendario: 1,
    })
    expect(periodo.dias).toEqual(['2026-11-02'])
  })

  it('resuelve la semana de lunes a domingo', () => {
    const periodo = crearPeriodo('semana', { hoy: '2026-11-04' })

    expect(periodo.desde).toBe('2026-11-02')
    expect(periodo.hasta).toBe('2026-11-08')
    expect(periodo.dias).toHaveLength(7)
  })

  it('resuelve semanas que cruzan mes y año', () => {
    const mes = crearPeriodo('semana', { hoy: '2026-11-01' })
    const anio = crearPeriodo('semana', { hoy: '2027-01-01' })

    expect(mes.desde).toBe('2026-10-26')
    expect(mes.hasta).toBe('2026-11-01')
    expect(anio.desde).toBe('2026-12-28')
    expect(anio.hasta).toBe('2027-01-03')
    expect(anio.dias).toContain('2026-12-31')
    expect(anio.dias).toContain('2027-01-01')
  })

  it('acepta rangos personalizados mayores a 31 días sin truncarlos', () => {
    const dias32 = validarRangoPersonalizado('2026-01-01', '2026-02-01')
    const dias90 = validarRangoPersonalizado('2026-01-01', '2026-03-31')
    const anio = validarRangoPersonalizado('2026-01-01', '2026-12-31')

    expect(dias32).toMatchObject({ valido: true, diasCalendario: 32 })
    expect(dias90).toMatchObject({ valido: true, diasCalendario: 90 })
    expect(anio).toMatchObject({ valido: true, diasCalendario: 365 })
    expect(fechasDelRango('2026-01-01', '2026-02-01')).toHaveLength(32)
  })

  it('resuelve rangos que cruzan varios años', () => {
    const periodo = crearPeriodo('personalizado', {
      desde: '2025-12-30',
      hasta: '2027-01-02',
    })

    expect(periodo.valido).toBe(true)
    expect(periodo.dias).toContain('2025-12-31')
    expect(periodo.dias).toContain('2026-12-31')
    expect(periodo.dias).toContain('2027-01-01')
    expect(periodo.diasCalendario).toBe(369)
  })

  it('rechaza rango invertido, incompleto o con fechas imposibles', () => {
    expect(validarRangoPersonalizado('2026-11-03', '2026-11-02')).toMatchObject({
      valido: false,
      error: 'invertida',
    })
    expect(validarRangoPersonalizado('', '2026-11-02')).toMatchObject({
      valido: false,
      error: 'incompleto',
    })
    expect(validarRangoPersonalizado('2026-02-30', '2026-03-01')).toMatchObject({
      valido: false,
      error: 'invalida',
    })
    expect(validarRangoPersonalizado('2026-01-01', '2025-12-31')).toMatchObject({
      valido: false,
      error: 'invertida',
    })
  })

  it('valida fechas ISO con días reales por mes y años bisiestos', () => {
    expect(esFechaISOValida('2028-02-29')).toBe(true)
    expect(esFechaISOValida('2026-02-29')).toBe(false)
    expect(esFechaISOValida('2026-13-01')).toBe(false)
    expect(esFechaISOValida('2026-04-31')).toBe(false)
    expect(esFechaISOValida('02/11/2026')).toBe(false)
  })

  it('calcula días y sumas sin depender de la zona horaria del dispositivo', () => {
    vi.stubEnv('TZ', 'Pacific/Kiritimati')

    expect(sumarDias('2026-12-31', 1)).toBe('2027-01-01')
    expect(sumarDias('2027-01-01', -1)).toBe('2026-12-31')
    expect(diferenciaDias('2026-12-31', '2027-01-01')).toBe(1)
    expect(diaSemanaLunesCero('2026-11-02')).toBe(0)
    expect(fechasDelRango('2026-12-31', '2027-01-01')).toEqual(['2026-12-31', '2027-01-01'])
  })

  it('genera etiquetas comprensibles para cada período', () => {
    expect(etiquetaPeriodo(crearPeriodo('hoy', { hoy: '2026-11-02' }))).toBe(
      'Hoy, 2 de noviembre de 2026',
    )
    expect(etiquetaPeriodo(crearPeriodo('semana', { hoy: '2026-11-04' }))).toBe(
      'Semana del 2 al 8 de noviembre de 2026',
    )
    expect(
      etiquetaPeriodo(crearPeriodo('personalizado', { desde: '2026-12-31', hasta: '2027-01-01' })),
    ).toBe('Del 31 de diciembre de 2026 al 1 de enero de 2027')
  })

  it('describe títulos y estados vacíos sin la opción mensual', () => {
    expect(tituloPeriodo('hoy')).toBe('Depurados de hoy')
    expect(tituloPeriodo('semana')).toBe('Depurados de la semana')
    expect(tituloPeriodo('personalizado')).toBe('Depurados del rango')
    expect(textoVacioPeriodo('semana')).toMatch(/semana/i)
    expect(textoVacioPeriodo('personalizado')).toMatch(/rango/i)
  })
})
