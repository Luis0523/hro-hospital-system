import { describe, expect, it } from 'vitest'
import {
  calcularReporteCarnets,
  limiteDe,
  normalizarNombre,
  porcentajeAvance,
} from './limitesCarnets'

describe('limitesCarnets', () => {
  it('normaliza el nombre (sin acentos ni mayúsculas)', () => {
    expect(normalizarNombre('Clínica de la Mujer')).toBe('clinica de la mujer')
    expect(normalizarNombre('  Oncología ')).toBe('oncologia')
  })

  it('devuelve el límite por especialidad', () => {
    expect(limiteDe('Medicina Interna')).toBe(100)
    expect(limiteDe('Oncología')).toBe(14)
    expect(limiteDe('Oncologia')).toBe(14)
    expect(limiteDe('Nutrición')).toBe(12)
    expect(limiteDe('Clínica de la Mujer')).toBe(12)
    expect(limiteDe('Cardiología')).toBeNull()
  })

  it('calcula el reporte, une catálogo + registros y marca excedidos', () => {
    const registros = [
      ...Array.from({ length: 15 }, () => ({
        especialidadId: 1,
        especialidadNombre: 'Oncología',
      })),
      { especialidadId: 2, especialidadNombre: 'Medicina Interna' },
    ]
    const especialidades = [
      { id: 1, nombre: 'Oncología' },
      { id: 2, nombre: 'Medicina Interna' },
      { id: 3, nombre: 'Nutrición' },
    ]

    const filas = calcularReporteCarnets(registros, especialidades)

    const oncologia = filas.find((fila) => fila.especialidadId === 1)
    expect(oncologia).toMatchObject({ registrados: 15, limite: 14, excedido: true })

    const medicina = filas.find((fila) => fila.especialidadId === 2)
    expect(medicina).toMatchObject({ registrados: 1, limite: 100, excedido: false })

    const nutricion = filas.find((fila) => fila.especialidadId === 3)
    expect(nutricion).toMatchObject({ registrados: 0, limite: 12, excedido: false })

    // Las excedidas se ordenan primero.
    expect(filas[0].especialidadId).toBe(1)
  })

  it('calcula el porcentaje de avance con tope en 100', () => {
    expect(porcentajeAvance(25, 100)).toBe(25)
    expect(porcentajeAvance(120, 100)).toBe(100)
    expect(porcentajeAvance(5, 0)).toBe(0)
  })
})
