import { describe, expect, it } from 'vitest'
import { esExpedienteValido, normalizarExpediente, PATRON_EXPEDIENTE } from './expediente'

// Valores ficticios reservados para tests. NO son expedientes reales.
const EXPEDIENTE_FICTICIO = '987654321'

describe('expediente · PATRON_EXPEDIENTE', () => {
  it('acepta solo dígitos', () => {
    expect(PATRON_EXPEDIENTE.test(EXPEDIENTE_FICTICIO)).toBe(true)
    expect(PATRON_EXPEDIENTE.test('123456')).toBe(true)
    expect(PATRON_EXPEDIENTE.test('12-34')).toBe(false)
    expect(PATRON_EXPEDIENTE.test('ABC123')).toBe(false)
  })
})

describe('normalizarExpediente', () => {
  it('hace trim sin agregar guiones ni ceros', () => {
    expect(normalizarExpediente(` ${EXPEDIENTE_FICTICIO} `)).toBe(EXPEDIENTE_FICTICIO)
    expect(normalizarExpediente('1')).toBe('1')
  })

  it('tolera null/undefined', () => {
    expect(normalizarExpediente(null)).toBe('')
    expect(normalizarExpediente(undefined)).toBe('')
  })
})

describe('esExpedienteValido', () => {
  it('acepta números sin longitud fija', () => {
    expect(esExpedienteValido(EXPEDIENTE_FICTICIO)).toBe(true)
    expect(esExpedienteValido('1')).toBe(true)
    expect(esExpedienteValido('123456789')).toBe(true)
    expect(esExpedienteValido(` ${EXPEDIENTE_FICTICIO} `)).toBe(true)
  })

  it('rechaza guiones, letras, espacios internos y vacío', () => {
    expect(esExpedienteValido('12-34')).toBe(false)
    expect(esExpedienteValido('ABC123')).toBe(false)
    expect(esExpedienteValido('123 456')).toBe(false)
    expect(esExpedienteValido('')).toBe(false)
    expect(esExpedienteValido('   ')).toBe(false)
  })
})
