import { describe, expect, it } from 'vitest'
import { esExpedienteValido, normalizarExpediente, PATRON_EXPEDIENTE } from './expediente'

describe('expediente · PATRON_EXPEDIENTE', () => {
  it('acepta solo dígitos', () => {
    expect(PATRON_EXPEDIENTE.test('837871')).toBe(true)
    expect(PATRON_EXPEDIENTE.test('123456')).toBe(true)
    expect(PATRON_EXPEDIENTE.test('1323-23')).toBe(false)
    expect(PATRON_EXPEDIENTE.test('ABC123')).toBe(false)
  })
})

describe('normalizarExpediente', () => {
  it('hace trim sin agregar guiones ni ceros', () => {
    expect(normalizarExpediente(' 837871 ')).toBe('837871')
    expect(normalizarExpediente('1')).toBe('1')
  })

  it('tolera null/undefined', () => {
    expect(normalizarExpediente(null)).toBe('')
    expect(normalizarExpediente(undefined)).toBe('')
  })
})

describe('esExpedienteValido', () => {
  it('acepta números sin longitud fija', () => {
    expect(esExpedienteValido('837871')).toBe(true)
    expect(esExpedienteValido('1')).toBe(true)
    expect(esExpedienteValido('123456789')).toBe(true)
    expect(esExpedienteValido(' 837871 ')).toBe(true)
  })

  it('rechaza guiones, letras, espacios internos y vacío', () => {
    expect(esExpedienteValido('1323-23')).toBe(false)
    expect(esExpedienteValido('ABC123')).toBe(false)
    expect(esExpedienteValido('123 456')).toBe(false)
    expect(esExpedienteValido('')).toBe(false)
    expect(esExpedienteValido('   ')).toBe(false)
  })
})
