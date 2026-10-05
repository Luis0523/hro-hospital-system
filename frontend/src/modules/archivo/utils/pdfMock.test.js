import { describe, expect, it } from 'vitest'
import { construirPdfResumen, construirPdfSimple } from './pdfMock'

// jsdom 25 no expone Blob.arrayBuffer(), por eso se leen los bytes con
// FileReader. Se decodifica como WinAnsi (el encoding declarado en el PDF) para
// comprobar también las tildes.
function leerBytes(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(new Uint8Array(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsArrayBuffer(blob)
  })
}

async function leerPdf(blob) {
  return new TextDecoder('windows-1252').decode(await leerBytes(blob))
}

describe('pdfMock', () => {
  it('genera un Blob PDF no vacío y estructuralmente válido', async () => {
    const blob = construirPdfResumen({
      fecha: '2026-09-28',
      totalCiclos: 6,
      pendienteLocalizar: 1,
    })

    expect(blob).toBeInstanceOf(Blob)
    expect(blob.type).toBe('application/pdf')
    expect(blob.size).toBeGreaterThan(0)

    const texto = await leerPdf(blob)
    expect(texto.startsWith('%PDF-1.4')).toBe(true)
    expect(texto).toContain('xref')
    expect(texto).toContain('startxref')
    expect(texto).toContain('%%EOF')
  })

  it('incluye el contenido mínimo del resumen y la nota de datos simulados', async () => {
    const texto = await leerPdf(construirPdfResumen({ fecha: '2026-09-28' }))

    expect(texto).toContain('SISTEMA HOSPITALARIO HRO')
    expect(texto).toContain('Estación de Archivo / Registro Médico')
    expect(texto).toContain('Resumen del día')
    expect(texto).toContain('Fecha: 2026-09-28')
    expect(texto).toContain('Total de ciclos')
    expect(texto).toContain('Pendientes')
    expect(texto).toContain('Localizados')
    expect(texto).toContain('Entregados')
    expect(texto).toContain('No localizados')
    expect(texto).toContain('Expedientes nuevos')
    expect(texto).toContain('Documento generado con datos simulados.')
  })

  it('construirPdfSimple acepta líneas arbitrarias y escapa paréntesis', async () => {
    const texto = await leerPdf(construirPdfSimple(['Hola (mundo)']))

    expect(texto).toContain('Hola \\(mundo\\)')
  })
})
