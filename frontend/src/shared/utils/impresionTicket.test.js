import { describe, expect, it } from 'vitest'
import {
  esEspecialidadGinecologia,
  esNumeroClinica,
  payloadTicketGinecologia,
} from './impresionTicket'

describe('ticket temporal de Ginecología', () => {
  it('envía el número de clínica como número grande y lo repite en clinica', () => {
    expect(
      payloadTicketGinecologia({
        clinica: '02',
        especialidad: 'Ginecología',
        fechaHora: '04/11/2026 08:30',
      }),
    ).toEqual({
      turno: 2,
      especialidad: 'Ginecología',
      clinica: '02',
      fechaHora: '04/11/2026 08:30',
    })
  })

  it('rechaza clínicas que no son números enteros', () => {
    expect(() =>
      payloadTicketGinecologia({ clinica: 'Ginecología', especialidad: 'Ginecología' }),
    ).toThrow(/número de clínica/i)
  })

  it('detecta la especialidad y valida el número de clínica', () => {
    expect(esEspecialidadGinecologia('Ginecología y Obstetricia')).toBe(true)
    expect(esEspecialidadGinecologia('Medicina Interna')).toBe(false)
    expect(esNumeroClinica('3')).toBe(true)
    expect(esNumeroClinica('A-3')).toBe(false)
  })
})
