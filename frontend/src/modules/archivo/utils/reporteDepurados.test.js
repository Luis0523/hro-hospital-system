import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { descargarBlob } = vi.hoisted(() => ({ descargarBlob: vi.fn() }))

vi.mock('./descargarBlob', () => ({ descargarBlob }))

import {
  construirPdfReporteDepurados,
  descargarReporteDepurados,
  motivoReporteNoDisponible,
  nombreArchivoReporte,
  puedeGenerarReporteDepurados,
} from './reporteDepurados'

const FECHA_GENERACION = new Date('2026-11-03T18:45:00Z')

const REGISTROS = [
  {
    id: 'a',
    numeroExpediente: '927581',
    pacienteNombre: 'María Fernanda López García',
    usuarioNombre: 'Archivo Central',
    motivo: 'Expediente ficticio extraviado tras revisión de estantería y bodega',
    depuradoEn: '2026-11-03T05:30:00Z',
  },
  {
    id: 'b',
    numeroExpediente: '001234',
    pacienteNombre: 'Paciente con ceros',
    usuarioNombre: 'Ana López',
    motivo: null,
    depuradoEn: '2026-11-02T15:00:00-06:00',
  },
]

function datos(overrides = {}) {
  return {
    filtroActivo: 'personalizado',
    fechaInicio: '2026-11-02',
    fechaFin: '2026-11-03',
    registros: REGISTROS,
    total: REGISTROS.length,
    orden: 'desc',
    cargando: false,
    error: null,
    completo: true,
    validoParaReportes: true,
    desactualizado: false,
    ...overrides,
  }
}

beforeEach(() => {
  descargarBlob.mockReset()
  descargarBlob.mockReturnValue(true)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('reporteDepurados PDF', () => {
  it('genera un PDF real, A4 horizontal, con encabezado, firmas y simulación', () => {
    const reporte = construirPdfReporteDepurados({
      datosHistorial: datos(),
      fechaGeneracion: FECHA_GENERACION,
      usandoMock: true,
    })

    expect(reporte.blob.type).toBe('application/pdf')
    expect(new TextDecoder('latin1').decode(reporte.bytes).startsWith('%PDF-')).toBe(true)
    expect(reporte.texto).toContain('/MediaBox [0 0 841.89 595.28]')
    expect(reporte.texto).toContain('HOSPITAL REGIONAL DE OCCIDENTE')
    expect(reporte.texto).toContain('REPORTE DE EXPEDIENTES DEPURADOS')
    expect(reporte.texto).toContain('MODO SIMULACIÓN')
    expect(reporte.texto).toContain('Elaborado por')
    expect(reporte.texto).toContain('Revisado por')
    expect(reporte.texto).toContain('Jefatura de Archivo')
    expect(reporte.texto).toContain('03/11/2026 12:45')
    expect(reporte.paginas).toBe(1)
    expect(reporte.filas).toBe(2)
  })

  it('usa exactamente los registros, orden, formato y fechas de datosHistorial', () => {
    const reporte = construirPdfReporteDepurados({
      datosHistorial: datos(),
      fechaGeneracion: FECHA_GENERACION,
    })

    expect(reporte.texto).toContain('9275-81')
    expect(reporte.texto).toContain('0012-34')
    expect(reporte.texto.indexOf('9275-81')).toBeLessThan(reporte.texto.indexOf('0012-34'))
    expect(reporte.texto).toContain('02/11/2026 23:30')
    expect(reporte.texto).toContain('02/11/2026 15:00')
    expect(reporte.texto).toContain('María Fernanda López García')
    expect(reporte.texto).toContain('Paciente con ceros')
    expect(reporte.texto).toContain('Archivo Central')
  })

  it('incorpora la búsqueda por expediente y solo los registros coincidentes', () => {
    const registros = [REGISTROS[0]]
    const reporte = construirPdfReporteDepurados({
      datosHistorial: datos({ registros, total: 1 }),
      fechaGeneracion: FECHA_GENERACION,
      busquedaExpediente: '9275',
    })

    expect(reporte.filas).toBe(1)
    expect(reporte.texto).toContain('Expediente 92-75')
    expect(reporte.texto).toContain('9275-81')
    expect(reporte.texto).not.toContain('0012-34')
    expect(reporte.nombre).toContain('_Exp_9275.pdf')
  })

  it('genera varias páginas y mantiene todas las filas', () => {
    const registros = Array.from({ length: 80 }, (_, indice) => ({
      id: `registro-${indice}`,
      numeroExpediente: String(900000 + indice),
      pacienteNombre: `Paciente ficticio ${indice}`,
      usuarioNombre: 'Archivo Central',
      motivo: 'Motivo de prueba con texto suficiente para validar el ajuste de líneas',
      depuradoEn: `2026-11-02T${String(8 + (indice % 10)).padStart(2, '0')}:00:00-06:00`,
    }))
    const reporte = construirPdfReporteDepurados({
      datosHistorial: datos({ registros, total: registros.length }),
      fechaGeneracion: FECHA_GENERACION,
    })

    expect(reporte.paginas).toBeGreaterThan(1)
    expect(reporte.filas).toBe(80)
    expect(reporte.texto).toContain('Página 1 de')
  })

  it('trata nombres y motivos como texto, sin interpolar HTML', () => {
    const registros = [
      {
        ...REGISTROS[0],
        pacienteNombre: '<script>alert(1)</script>',
        motivo: '<b>no html</b>',
      },
    ]
    const reporte = construirPdfReporteDepurados({
      datosHistorial: datos({ registros, total: 1 }),
    })

    expect(reporte.texto).toContain('<script>alert')
    expect(reporte.texto).toContain('</script>')
    expect(reporte.texto).toContain('<b>no html</b>')
    expect(reporte.texto).not.toContain('<html>')
  })

  it('bloquea datos incompletos, desactualizados, con error, en carga o vacíos', () => {
    const casos = [
      { ...datos(), cargando: true },
      { ...datos(), completo: false, error: Object.assign(new Error('fallo'), { status: 500 }) },
      { ...datos(), desactualizado: true },
      { ...datos(), error: Object.assign(new Error('fallo'), { status: 500 }) },
      { ...datos(), validoParaReportes: false },
      { ...datos(), total: 0, registros: [] },
    ]

    for (const caso of casos) {
      expect(puedeGenerarReporteDepurados(caso)).toBe(false)
      expect(motivoReporteNoDisponible(caso)).not.toBe('')
      expect(() => construirPdfReporteDepurados({ datosHistorial: caso })).toThrow()
    }
  })

  it('descarga un PDF sin abrir ventanas ni imprimir', () => {
    const open = vi.spyOn(window, 'open')
    const print = vi.spyOn(window, 'print').mockImplementation(() => {})

    const resultado = descargarReporteDepurados({
      datosHistorial: datos(),
      fechaGeneracion: FECHA_GENERACION,
      usandoMock: true,
    })

    expect(resultado.ok).toBe(true)
    expect(resultado.archivo).toBe(nombreArchivoReporte(datos()))
    expect(resultado.archivo).toMatch(/^HRO_Depurados_2026-11-02_2026-11-03\.pdf$/)
    expect(descargarBlob).toHaveBeenCalledTimes(1)
    expect(descargarBlob.mock.calls[0][0]).toBeInstanceOf(Blob)
    expect(descargarBlob.mock.calls[0][1]).toBe(resultado.archivo)
    expect(open).not.toHaveBeenCalled()
    expect(print).not.toHaveBeenCalled()
  })

  it('no descarga si los datos no son válidos', () => {
    const resultado = descargarReporteDepurados({
      datosHistorial: datos({ completo: false }),
    })

    expect(resultado).toMatchObject({ ok: false, motivo: 'datos' })
    expect(descargarBlob).not.toHaveBeenCalled()
  })
})
