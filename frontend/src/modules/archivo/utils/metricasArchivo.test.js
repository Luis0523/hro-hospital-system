import { describe, expect, it } from 'vitest'
import { ORDEN_ESTADOS } from '../estadosExpediente'
import {
  formatearMinutos,
  maximoPorEstado,
  ordenarEstados,
  porcentaje,
  promedioLocalizacion,
  separarExcepcion,
  sumarPorEstado,
  totalEstado,
} from './metricasArchivo'

const POR_ESTADO_DESORDENADO = [
  { estado: 'no_localizado', total: 2 },
  { estado: 'entregado', total: 12 },
  { estado: 'en_busqueda', total: 5 },
  { estado: 'pendiente_localizar', total: 3 },
  { estado: 'archivado', total: 5 },
]

describe('metricasArchivo', () => {
  it('ordena porEstado según ORDEN_ESTADOS y deja no_localizado al final', () => {
    const ordenados = ordenarEstados(POR_ESTADO_DESORDENADO)

    expect(ordenados.map((item) => item.estado)).toEqual([
      'pendiente_localizar',
      'en_busqueda',
      'entregado',
      'archivado',
      'no_localizado',
    ])
    // La secuencia normal respeta exactamente ORDEN_ESTADOS cuando están todos.
    expect(ordenados.filter((item) => ORDEN_ESTADOS.includes(item.estado))).toHaveLength(4)
  })

  it('separa la excepción (no_localizado) de la secuencia normal', () => {
    const { secuencia, excepcion } = separarExcepcion(POR_ESTADO_DESORDENADO)

    expect(excepcion.map((item) => item.estado)).toEqual(['no_localizado'])
    expect(secuencia.some((item) => item.estado === 'no_localizado')).toBe(false)
  })

  it('suma totales y calcula máximos', () => {
    expect(sumarPorEstado(POR_ESTADO_DESORDENADO)).toBe(27)
    expect(totalEstado(POR_ESTADO_DESORDENADO, 'entregado')).toBe(12)
    expect(totalEstado(POR_ESTADO_DESORDENADO, 'inexistente')).toBe(0)
    expect(maximoPorEstado(POR_ESTADO_DESORDENADO)).toBe(12)
  })

  it('calcula porcentajes con caso borde de división por cero', () => {
    expect(porcentaje(5, 10)).toBe(50)
    expect(porcentaje(0, 0)).toBe(0)
    expect(porcentaje(5, 0)).toBe(0)
    expect(porcentaje(undefined, 10)).toBe(0)
  })

  it('calcula el promedio de localización y devuelve null sin datos', () => {
    const permanencia = [
      { estado: 'pendiente_localizar', minutosPromedio: 18 },
      { estado: 'en_busqueda', minutosPromedio: 42 },
      { estado: 'localizado', minutosPromedio: 12 },
      { estado: 'archivado', minutosPromedio: 5 },
    ]

    expect(promedioLocalizacion(permanencia)).toBe(24)
    expect(promedioLocalizacion([])).toBeNull()
    expect(promedioLocalizacion([{ estado: 'archivado', minutosPromedio: 5 }])).toBeNull()
  })

  it('formatea minutos de forma legible', () => {
    expect(formatearMinutos(42)).toBe('42 min')
    expect(formatearMinutos(60)).toBe('1 h')
    expect(formatearMinutos(90)).toBe('1 h 30 min')
    expect(formatearMinutos(null)).toBe('—')
    expect(formatearMinutos(undefined)).toBe('—')
  })
})
