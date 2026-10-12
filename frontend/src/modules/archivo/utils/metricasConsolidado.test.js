import { describe, expect, it } from 'vitest'
import {
  calcularHA,
  calcularSubTotal,
  calcularTotalDetalle,
  calcularTotalInforme,
  maximoPorEspecialidad,
  ordenarPorTotal,
  porcentajeDe,
  totalPorEspecialidad,
} from './metricasConsolidado'

describe('metricasConsolidado — consolidado diario', () => {
  const lista = [
    { especialidadNombre: 'Pediatría', total: 2 },
    { especialidadNombre: 'Medicina', total: 8 },
  ]

  it('suma el total y calcula el máximo', () => {
    expect(totalPorEspecialidad(lista)).toBe(10)
    expect(maximoPorEspecialidad(lista)).toBe(8)
    expect(totalPorEspecialidad([])).toBe(0)
  })

  it('ordena de mayor a menor (con desempate por nombre)', () => {
    expect(ordenarPorTotal(lista).map((item) => item.especialidadNombre)).toEqual([
      'Medicina',
      'Pediatría',
    ])
  })

  it('calcula porcentajes con caso borde de división por cero', () => {
    expect(porcentajeDe(5, 10)).toBe(50)
    expect(porcentajeDe(5, 0)).toBe(0)
    expect(porcentajeDe(undefined, 10)).toBe(0)
  })
})

describe('metricasConsolidado — fórmulas del Excel', () => {
  it('SUB_TOTAL = MEDICINA + HEMODIALISIS', () => {
    expect(calcularSubTotal({ medicina: 5, hemodialisis: 3 })).toBe(8)
    expect(calcularSubTotal({})).toBe(0)
  })

  it('TOTAL detalle = SUB_TOTAL + resto de especialidades', () => {
    const fila = {
      medicina: 5,
      hemodialisis: 3,
      cirugia: 2,
      traumatologia: 1,
      ginecoObstetricia: 1,
      pediatria: 2,
      psicosocial: 0,
      odontologia: 1,
      clinicaMujer: 0,
      clinicaVih: 0,
    }
    expect(calcularTotalDetalle(fila)).toBe(15)
  })

  it('TOTAL informe excluye HA y TIA', () => {
    const fila = { eh: 1, hdt: 2, hdc: 4, sobres: 1, hr: 1, hd: 1, ha: 99, tia: 50 }
    expect(calcularTotalInforme(fila)).toBe(10)
  })

  it('HA = TOTAL * 2', () => {
    expect(calcularHA(10)).toBe(20)
    expect(calcularHA(0)).toBe(0)
  })
})
