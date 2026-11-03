import { describe, expect, it } from 'vitest'
import { crearHistoricoDepuracionMock, expedientesDepuracionMock } from './depuracionFixtures'

describe('depuracionFixtures históricos', () => {
  it('genera registros ficticios anteriores a hoy, sin duplicar expedientes', () => {
    const { expedientes, depuraciones } = crearHistoricoDepuracionMock('2026-11-02')
    const numeros = [...expedientesDepuracionMock, ...expedientes].map(
      (expediente) => expediente.numeroExpediente,
    )

    expect(new Set(numeros).size).toBe(numeros.length)
    expect(depuraciones.every((registro) => registro.fecha < '2026-11-02')).toBe(true)
    expect(depuraciones.every((registro) => registro.depuradoEn.startsWith(registro.fecha))).toBe(
      true,
    )
    expect(depuraciones.every((registro) => registro.depuradoEn.endsWith('-06:00'))).toBe(true)
  })

  it('incluye ayer, semana anterior, límites de mes y de año', () => {
    const { depuraciones } = crearHistoricoDepuracionMock('2026-11-02')
    const fechas = depuraciones.map((registro) => registro.fecha)

    expect(fechas).toContain('2026-11-01')
    expect(fechas).toContain('2026-10-25')
    expect(fechas).toContain('2026-10-01')
    expect(fechas).toContain('2026-10-31')
    expect(fechas).toContain('2025-12-31')
    expect(fechas).toContain('2026-01-01')
  })

  it('incluye ceros iniciales, nombres y motivos largos', () => {
    const { expedientes, depuraciones } = crearHistoricoDepuracionMock('2026-11-02')

    expect(expedientes.some((expediente) => expediente.numeroExpediente.startsWith('0'))).toBe(true)
    expect(depuraciones.some((registro) => (registro.pacienteNombre ?? '').length > 60)).toBe(true)
    expect(depuraciones.some((registro) => (registro.motivo ?? '').length > 80)).toBe(true)
  })

  it('es determinista y permite validar un 29 de febrero', () => {
    const primero = crearHistoricoDepuracionMock('2026-11-02')
    const segundo = crearHistoricoDepuracionMock('2026-11-02')
    const bisiesto = crearHistoricoDepuracionMock('2024-03-01')

    expect(segundo).toEqual(primero)
    expect(bisiesto.depuraciones.map((registro) => registro.fecha)).toContain('2024-02-29')
  })
})
