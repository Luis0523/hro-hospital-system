import { describe, expect, it } from 'vitest'
import { agruparPorMesAnio, clavePeriodo, etiquetaPeriodo } from './agruparHistorial'

// Datos sintéticos EXCLUSIVOS de esta prueba (no forman parte de la aplicación).
const REGISTROS = [
  { id: 'a', fecha: '2026-10-03', egresosHospitalarios: 1 },
  { id: 'b', fecha: '2026-10-01', egresosHospitalarios: 2 },
  { id: 'c', fecha: '2026-09-15', egresosHospitalarios: 3 },
  { id: 'd', fecha: '2025-10-20', egresosHospitalarios: 4 },
]

describe('agruparHistorial · clavePeriodo', () => {
  it('extrae la clave YYYY-MM de una fecha válida', () => {
    expect(clavePeriodo('2026-10-13')).toBe('2026-10')
  })

  it('devuelve null para fechas inválidas o ausentes', () => {
    expect(clavePeriodo('')).toBeNull()
    expect(clavePeriodo('13/10/2026')).toBeNull()
    expect(clavePeriodo(null)).toBeNull()
    expect(clavePeriodo(undefined)).toBeNull()
  })
})

describe('agruparHistorial · etiquetaPeriodo', () => {
  it('genera una etiqueta legible en español', () => {
    expect(etiquetaPeriodo('2026-10')).toBe('Octubre 2026')
    expect(etiquetaPeriodo('2026-01')).toBe('Enero 2026')
  })
})

describe('agruparHistorial · agruparPorMesAnio', () => {
  it('devuelve los grupos ordenados del período más reciente al más antiguo', () => {
    const grupos = agruparPorMesAnio(REGISTROS)
    expect(grupos.map((grupo) => grupo.clave)).toEqual(['2026-10', '2026-09', '2025-10'])
    expect(grupos.map((grupo) => grupo.etiqueta)).toEqual([
      'Octubre 2026',
      'Septiembre 2026',
      'Octubre 2025',
    ])
  })

  it('incluye anio y mes numéricos y agrupa los registros del mismo período', () => {
    const [octubre2026] = agruparPorMesAnio(REGISTROS)
    expect(octubre2026.anio).toBe(2026)
    expect(octubre2026.mes).toBe(10)
    expect(octubre2026.registros.map((registro) => registro.id)).toEqual(['a', 'b'])
  })

  it('ordena los registros de cada grupo por fecha descendente', () => {
    const [octubre2026] = agruparPorMesAnio(REGISTROS)
    expect(octubre2026.registros.map((registro) => registro.fecha)).toEqual([
      '2026-10-03',
      '2026-10-01',
    ])
  })

  it('descarta registros sin fecha válida y no inventa períodos', () => {
    const grupos = agruparPorMesAnio([
      { id: 'x', fecha: '' },
      { id: 'y' },
      { id: 'z', fecha: '2026-05-01' },
    ])
    expect(grupos).toHaveLength(1)
    expect(grupos[0].clave).toBe('2026-05')
  })

  it('devuelve una lista vacía cuando no hay registros', () => {
    expect(agruparPorMesAnio([])).toEqual([])
    expect(agruparPorMesAnio()).toEqual([])
  })

  it('no muta la lista de entrada', () => {
    const copia = REGISTROS.map((registro) => ({ ...registro }))
    agruparPorMesAnio(REGISTROS)
    expect(REGISTROS).toEqual(copia)
  })
})
