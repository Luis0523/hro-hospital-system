import { describe, expect, it } from 'vitest'
import { elegirCandidato } from './useNavegacionFlechas'

function rect(left, top, width = 20, height = 20) {
  return { left, top, width, height }
}

describe('elegirCandidato', () => {
  it('elige el elemento más cercano a la derecha en la misma fila', () => {
    const candidatos = [
      { elemento: 'lejos', rect: rect(200, 0) },
      { elemento: 'cerca', rect: rect(40, 2) },
      { elemento: 'abajo', rect: rect(10, 80) },
    ]

    expect(elegirCandidato(rect(0, 0), candidatos, 'ArrowRight')).toBe('cerca')
  })

  it('elige el elemento más cercano abajo en la misma columna', () => {
    const candidatos = [
      { elemento: 'derecha', rect: rect(80, 0) },
      { elemento: 'abajo', rect: rect(0, 40) },
      { elemento: 'abajo-lejos', rect: rect(2, 120) },
    ]

    expect(elegirCandidato(rect(0, 0), candidatos, 'ArrowDown')).toBe('abajo')
  })

  it('respeta las direcciones izquierda y arriba', () => {
    const candidatos = [
      { elemento: 'izquierda', rect: rect(-60, 0) },
      { elemento: 'arriba', rect: rect(0, -60) },
    ]

    expect(elegirCandidato(rect(0, 0), candidatos, 'ArrowLeft')).toBe('izquierda')
    expect(elegirCandidato(rect(0, 0), candidatos, 'ArrowUp')).toBe('arriba')
  })

  it('devuelve null cuando no hay elementos en esa dirección', () => {
    const candidatos = [{ elemento: 'izquierda', rect: rect(-40, 0) }]

    expect(elegirCandidato(rect(0, 0), candidatos, 'ArrowRight')).toBeNull()
  })
})
