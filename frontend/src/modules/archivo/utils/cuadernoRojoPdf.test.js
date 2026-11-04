import { describe, expect, it } from 'vitest'
import { construirPdfCuaderno, nombreReporteCuaderno } from './cuadernoRojoPdf'

function textoPdf(bytes) {
  return Buffer.from(bytes).toString('latin1')
}

function registro(fecha, egresos, emergencia, sellados, tia) {
  return {
    fecha,
    egresosHospitalarios: egresos,
    sobresEmergencia: emergencia,
    sobresSellados: sellados,
    tia,
  }
}

describe('cuadernoRojoPdf', () => {
  it('genera un PDF válido con encabezado, registros, totales y rango', () => {
    const pdf = textoPdf(
      construirPdfCuaderno({
        registros: [registro('2026-11-01', 1, 2, 3, 4), registro('2026-11-02', 5, 6, 7, 8)],
        desde: '2026-11-01',
        hasta: '2026-11-30',
        generadoEn: '03/11/2026, 20:30',
      }),
    )

    expect(pdf.startsWith('%PDF-1.4')).toBe(true)
    expect(pdf.trimEnd().endsWith('%%EOF')).toBe(true)
    expect(pdf).toContain('/Count 1')
    expect(pdf).toContain('REGISTRO DEL CUADERNO ROJO')
    expect(pdf).toContain('Período:')
    expect(pdf).toContain('01/11/2026 - 30/11/2026')
    expect(pdf).toContain('Generado el:')
    expect(pdf).toContain('03/11/2026, 20:30')
    expect(pdf).toContain('EGRESOS HOSPITALARIOS')
    expect(pdf).toContain('SOBRES EMERGENCIA')
    expect(pdf).toContain('SOBRES SELLADOS')
    expect(pdf).toContain('01/11/2026')
    expect(pdf).toContain('02/11/2026')
    expect(pdf).toContain('TOTALES DEL PERÍODO')
    expect(pdf).toContain('Días registrados')
    expect(pdf).toContain('Egresos hospitalarios')
    expect(pdf).toContain('Sobres emergencia')
    expect(pdf).toContain('Sobres sellados')
    expect(pdf).toContain('TIA')
    expect(pdf).toContain('Página 1 de 1')
    expect(pdf).not.toContain('NaN')
  })

  it('genera varias páginas y repite el encabezado de tabla', () => {
    const registros = Array.from({ length: 30 }, (_, indice) =>
      registro(`2026-11-${String(indice + 1).padStart(2, '0')}`, indice, indice, indice, indice),
    )
    const pdf = textoPdf(
      construirPdfCuaderno({
        registros,
        desde: '2026-11-01',
        hasta: '2026-11-30',
        generadoEn: '03/11/2026, 20:30',
      }),
    )

    expect(pdf).toContain('/Count 2')
    expect((pdf.match(/\/Type \/Page\b/g) ?? []).length).toBe(2)
    expect((pdf.match(/SOBRES EMERGENCIA/g) ?? []).length).toBeGreaterThanOrEqual(2)
    expect(pdf).toContain('Página 2 de 2')
    expect(pdf).toContain('TOTALES DEL PERÍODO')
    expect(pdf).toContain('Días registrados')
    for (let dia = 1; dia <= 30; dia += 1) {
      expect(pdf).toContain(`${String(dia).padStart(2, '0')}/11/2026`)
    }
  })

  it('excluye del reporte los registros fuera del rango consultado', () => {
    const pdf = textoPdf(
      construirPdfCuaderno({
        registros: [
          registro('2026-10-31', 1, 2, 3, 4),
          registro('2026-11-15', 5, 6, 7, 8),
          registro('2026-12-01', 9, 9, 9, 9),
        ],
        desde: '2026-11-01',
        hasta: '2026-11-30',
        generadoEn: '03/11/2026, 20:30',
      }),
    )

    expect(pdf).toContain('15/11/2026')
    expect(pdf).not.toContain('31/10/2026')
    expect(pdf).not.toContain('01/12/2026')
    expect(pdf).toContain('Página 1 de 1')
  })

  it('genera un PDF vacío válido cuando no hay registros', () => {
    const pdf = textoPdf(
      construirPdfCuaderno({
        registros: [],
        desde: '2026-11-01',
        hasta: '2026-11-30',
        generadoEn: '03/11/2026, 20:30',
      }),
    )

    expect(pdf.startsWith('%PDF-1.4')).toBe(true)
    expect(pdf).toContain('/Count 1')
    expect(pdf).toContain('TOTALES DEL PERÍODO')
    expect(pdf).toContain('Días registrados')
    expect(pdf).toContain('Página 1 de 1')
  })

  it('compone el nombre del archivo con el rango', () => {
    expect(nombreReporteCuaderno('2026-11-01', '2026-11-30')).toBe(
      'cuaderno-rojo-2026-11-01_2026-11-30.pdf',
    )
  })
})
