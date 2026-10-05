import { describe, expect, it } from 'vitest'
import {
  calcularTotal,
  CONTADORES_INICIALES,
  DEFINICION_CONTADORES,
  normalizarContador,
} from './contadores'

describe('contadores · definición', () => {
  it('define exactamente los 8 contadores con sigla y nombre', () => {
    expect(DEFINICION_CONTADORES).toEqual([
      { clave: 'ha', sigla: 'H.A.', nombre: 'Historias Archivadas' },
      { clave: 'eh', sigla: 'EH', nombre: 'Egresos Hospitalarios' },
      { clave: 'hdt', sigla: 'HDT', nombre: 'Historias Desactivadas por Trabajo' },
      { clave: 'hdc', sigla: 'HDC', nombre: 'Historias Desactivadas por Consulta' },
      { clave: 'sobres', sigla: 'Sobres', nombre: 'Sobres' },
      { clave: 'hr', sigla: 'HR', nombre: 'Historias Revisadas' },
      { clave: 'hd', sigla: 'HD', nombre: 'Historias Depuradas' },
      { clave: 'tia', sigla: 'T.I.A.', nombre: 'Tarjetas Índices Archivadas' },
    ])
  })

  it('todos los valores iniciales son 0', () => {
    expect(CONTADORES_INICIALES).toEqual({
      ha: 0,
      eh: 0,
      hdt: 0,
      hdc: 0,
      sobres: 0,
      hr: 0,
      hd: 0,
      tia: 0,
    })
  })
})

describe('contadores · calcularTotal', () => {
  it('el total inicial es 0', () => {
    expect(calcularTotal(CONTADORES_INICIALES)).toBe(0)
  })

  it('suma correctamente varios campos', () => {
    expect(calcularTotal({ ha: 1, eh: 2, hdt: 3, hdc: 0, sobres: 4, hr: 0, hd: 5, tia: 6 })).toBe(
      21,
    )
  })

  it('no muta el objeto original', () => {
    const valores = { ...CONTADORES_INICIALES, ha: 3, sobres: 2 }
    const copia = { ...valores }

    calcularTotal(valores)

    expect(valores).toEqual(copia)
  })
})

describe('contadores · normalizarContador', () => {
  it('un entero positivo permanece igual', () => {
    expect(normalizarContador(7)).toBe(7)
    expect(normalizarContador('12')).toBe(12)
  })

  it('normaliza negativos a 0', () => {
    expect(normalizarContador(-3)).toBe(0)
    expect(normalizarContador('-8')).toBe(0)
  })

  it('normaliza decimales truncando', () => {
    expect(normalizarContador(2.9)).toBe(2)
    expect(normalizarContador('4.5')).toBe(4)
  })

  it('normaliza NaN, texto vacío e Infinity a 0', () => {
    expect(normalizarContador('abc')).toBe(0)
    expect(normalizarContador('')).toBe(0)
    expect(normalizarContador('   ')).toBe(0)
    expect(normalizarContador(NaN)).toBe(0)
    expect(normalizarContador(Infinity)).toBe(0)
    expect(normalizarContador(undefined)).toBe(0)
  })
})
