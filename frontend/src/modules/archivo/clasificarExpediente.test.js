import { describe, expect, it } from 'vitest'
import { clasificarExpediente } from './clasificarExpediente'

describe('clasificarExpediente', () => {
  it('clasifica valores puramente numéricos por el corte 111016', () => {
    expect(clasificarExpediente('111015')).toBe('pasivo')
    expect(clasificarExpediente('111016')).toBe('activo')
    expect(clasificarExpediente('111017')).toBe('activo')
  })

  it('devuelve null para identificadores no puramente numéricos (opacos)', () => {
    expect(clasificarExpediente('EXP-2024-035')).toBeNull()
    expect(clasificarExpediente('1323-23')).toBeNull()
    expect(clasificarExpediente('A-001')).toBeNull()
    expect(clasificarExpediente('111 016')).toBeNull()
    expect(clasificarExpediente('')).toBeNull()
    expect(clasificarExpediente(null)).toBeNull()
    expect(clasificarExpediente(undefined)).toBeNull()
    expect(clasificarExpediente(111016)).toBeNull()
  })

  it('no reformatea el número (no extrae dígitos de otros formatos)', () => {
    expect(clasificarExpediente('EXP-111016')).toBeNull()
    expect(clasificarExpediente('111016-A')).toBeNull()
  })
})
