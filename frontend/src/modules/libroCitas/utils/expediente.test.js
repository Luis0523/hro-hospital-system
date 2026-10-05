import { describe, expect, it } from 'vitest'
import { esExpedienteValido, normalizarExpediente, PATRON_EXPEDIENTE } from './expediente'

describe('expediente · PATRON_EXPEDIENTE', () => {
  it('acepta el formato NNNN-NN', () => {
    expect(PATRON_EXPEDIENTE.test('1323-23')).toBe(true)
    expect(PATRON_EXPEDIENTE.test('1401-24')).toBe(true)
  })
})

describe('normalizarExpediente', () => {
  it('hace trim', () => {
    expect(normalizarExpediente('  1323-23 ')).toBe('1323-23')
  })

  it('tolera null/undefined', () => {
    expect(normalizarExpediente(null)).toBe('')
    expect(normalizarExpediente(undefined)).toBe('')
  })
})

describe('esExpedienteValido', () => {
  it('acepta ejemplos válidos', () => {
    expect(esExpedienteValido('1323-23')).toBe(true)
    expect(esExpedienteValido('1401-24')).toBe(true)
  })

  it('acepta con espacios alrededor (trim)', () => {
    expect(esExpedienteValido(' 1323-23 ')).toBe(true)
  })

  it('rechaza formatos incorrectos', () => {
    expect(esExpedienteValido('1323-2')).toBe(false) // falta un dígito
    expect(esExpedienteValido('132-23')).toBe(false) // 3 dígitos
    expect(esExpedienteValido('13233-23')).toBe(false) // 5 dígitos
    expect(esExpedienteValido('1323/23')).toBe(false) // separador incorrecto
    expect(esExpedienteValido('1323-2023')).toBe(false) // año de 4 dígitos
    expect(esExpedienteValido('1323-AA')).toBe(false) // sufijo no numérico
    expect(esExpedienteValido('132323')).toBe(false) // sin guion
    expect(esExpedienteValido('abcd-ef')).toBe(false) // no numérico
    expect(esExpedienteValido('')).toBe(false)
    expect(esExpedienteValido('   ')).toBe(false)
  })
})
