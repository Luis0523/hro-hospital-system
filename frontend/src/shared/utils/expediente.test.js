import { describe, expect, it } from 'vitest'
import { formatearExpediente } from './expediente.js'

describe('formatearExpediente', () => {
  it('separa los 2 últimos dígitos con guion', () => {
    expect(formatearExpediente('927581')).toBe('9275-81')
    expect(formatearExpediente('1234567')).toBe('12345-67')
    expect(formatearExpediente('123')).toBe('1-23')
  })

  it('no altera valores cortos, vacíos ni no numéricos', () => {
    expect(formatearExpediente('12')).toBe('12')
    expect(formatearExpediente('')).toBe('')
    expect(formatearExpediente(null)).toBe('')
    expect(formatearExpediente('EXP-2024-035')).toBe('EXP-2024-035')
    expect(formatearExpediente(927581)).toBe('9275-81')
  })
})
