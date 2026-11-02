import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  abrirVentanaReporte,
  construirHtmlReporteSalidasExternas,
  escaparHtml,
  escribirReporteEnVentana,
} from './reporteSalidasExternas'

// 12:00 en Guatemala del 02/11/2026.
const CORTE = '2026-11-02T18:00:00.000Z'
const HOY_0900 = '2026-11-02T15:00:00.000Z'
const HOY_1000 = '2026-11-02T16:00:00.000Z'
const HOY_1100 = '2026-11-02T17:00:00.000Z'
const HOY_1130 = '2026-11-02T17:30:00.000Z'
const AYER_0900 = '2026-11-01T15:00:00.000Z'

function registro(overrides = {}) {
  return {
    id: 'se-1',
    numeroExpediente: '927581',
    personaRetira: 'Ana Ramírez',
    motivo: 'Tesis',
    fechaSalida: HOY_0900,
    fechaDevolucion: null,
    registradoPor: 'archivo-01',
    recuperadoManualmente: false,
    ...overrides,
  }
}

function secciones(html) {
  const marcaA = 'A. EXPEDIENTES DEVUELTOS'
  const marcaB = 'B. EXPEDIENTES PENDIENTES'

  const [, trasA] = html.split(marcaA)
  const [seccionA, seccionB] = trasA.split(marcaB)

  return { seccionA, seccionB }
}

describe('reporteSalidasExternas', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('escapa caracteres peligrosos', () => {
    expect(escaparHtml('<script>alert("x")</script>')).toBe(
      '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;',
    )
    expect(escaparHtml("A & B 'c'")).toBe('A &amp; B &#39;c&#39;')
    expect(escaparHtml(null)).toBe('')
  })

  it('incluye encabezado, dos apartados, firmas y pie institucional', () => {
    const html = construirHtmlReporteSalidasExternas({
      registros: [registro()],
      fecha: '2026-11-02',
      instanteCorte: CORTE,
      generadoPor: 'Personal de Archivo',
    })

    expect(html).toContain('HOSPITAL REGIONAL DE OCCIDENTE')
    expect(html).toContain('CONTROL DE SALIDAS EXTERNAS DE EXPEDIENTES')
    expect(html).toContain('Reporte de control diario')
    expect(html).toContain('A. EXPEDIENTES DEVUELTOS')
    expect(html).toContain('B. EXPEDIENTES PENDIENTES')
    expect(html).not.toContain('EXPEDIENTES PRESTADOS')
    expect(html).toContain('Elaborado por — Archivo')
    expect(html).toContain('Revisado por — Jefatura de Archivo')
    expect(html).toContain('Sistema HRO')
    expect(html).toContain('Personal de Archivo')
    expect(html).toContain('@page { size: A4 landscape')
    expect(html).toContain('display: table-header-group')
    expect(html).toContain('break-inside: avoid')
  })

  it('muestra la fecha operativa, la emisión y el corte', () => {
    const html = construirHtmlReporteSalidasExternas({
      registros: [],
      fecha: '2026-11-02',
      instanteCorte: CORTE,
    })

    expect(html).toContain('2026-11-02')
    expect(html).toContain('02/11/2026 12:00')
  })

  it('separa devoluciones del día y pendientes al corte', () => {
    const registros = [
      registro({ id: 'a', numeroExpediente: '111111', fechaSalida: HOY_0900 }),
      registro({
        id: 'b',
        numeroExpediente: '222222',
        fechaSalida: AYER_0900,
        fechaDevolucion: HOY_1000,
      }),
      registro({ id: 'c', numeroExpediente: '333333', fechaSalida: AYER_0900 }),
      registro({
        id: 'd',
        numeroExpediente: '444444',
        fechaSalida: HOY_1100,
        fechaDevolucion: HOY_1130,
      }),
    ]

    const html = construirHtmlReporteSalidasExternas({
      registros,
      fecha: '2026-11-02',
      instanteCorte: CORTE,
    })
    const { seccionA, seccionB } = secciones(html)

    // A: devoluciones del día, incluida la de un préstamo de ayer.
    expect(seccionA).toContain('2222-22')
    expect(seccionA).toContain('4444-44')
    expect(seccionA).not.toContain('1111-11')

    // B: pendientes al corte, incluye el préstamo de ayer.
    expect(seccionB).toContain('1111-11')
    expect(seccionB).toContain('3333-33')
    expect(seccionB).not.toContain('2222-22')
    expect(seccionB).not.toContain('4444-44')
    expect(seccionB).toContain('1 día')
  })

  it('cuenta devoluciones y pendientes por separado', () => {
    const html = construirHtmlReporteSalidasExternas({
      registros: [
        registro({ id: 'a', numeroExpediente: '111111' }),
        registro({ id: 'c', numeroExpediente: '333333', fechaSalida: AYER_0900 }),
        registro({ id: 'e', numeroExpediente: '555555', fechaSalida: AYER_0900 }),
        registro({
          id: 'b',
          numeroExpediente: '222222',
          fechaSalida: AYER_0900,
          fechaDevolucion: HOY_1000,
        }),
        registro({
          id: 'd',
          numeroExpediente: '444444',
          fechaSalida: HOY_1100,
          fechaDevolucion: HOY_1130,
        }),
      ],
      fecha: '2026-11-02',
      instanteCorte: CORTE,
    })

    expect(html).toContain(
      '<span class="num">2</span><span class="etiqueta">Expedientes devueltos del día</span>',
    )
    expect(html).toContain(
      '<span class="num">3</span><span class="etiqueta">Expedientes pendientes al corte</span>',
    )
    expect(html).not.toContain('Salidas del día')
  })

  it('respeta la presentación del ingreso manual', () => {
    const html = construirHtmlReporteSalidasExternas({
      registros: [
        registro({
          numeroExpediente: '911330',
          numeroExpedientePresentacion: '91-1330',
        }),
      ],
      fecha: '2026-11-02',
      instanteCorte: CORTE,
    })

    expect(html).toContain('91-1330')
    expect(html).not.toContain('9113-30')
  })

  it('excluye movimientos posteriores al instante de corte', () => {
    const html = construirHtmlReporteSalidasExternas({
      registros: [
        registro({
          id: 'tarde',
          numeroExpediente: '555555',
          fechaSalida: '2026-11-02T19:00:00.000Z',
        }),
      ],
      fecha: '2026-11-02',
      instanteCorte: CORTE,
    })

    expect(html).not.toContain('5555-55')
  })

  it('trata como pendiente una devolución posterior al corte', () => {
    const html = construirHtmlReporteSalidasExternas({
      registros: [
        registro({
          id: 'f',
          numeroExpediente: '666666',
          fechaSalida: AYER_0900,
          fechaDevolucion: '2026-11-02T19:00:00.000Z',
        }),
      ],
      fecha: '2026-11-02',
      instanteCorte: CORTE,
    })
    const { seccionA, seccionB } = secciones(html)

    expect(seccionA).not.toContain('6666-66')
    expect(seccionB).toContain('6666-66')
  })

  it('genera un documento comprensible sin movimientos', () => {
    const html = construirHtmlReporteSalidasExternas({
      registros: [],
      fecha: '2026-11-02',
      instanteCorte: CORTE,
    })

    expect(html).toContain('Sin devoluciones registradas en el día.')
    expect(html).toContain('No hay expedientes pendientes al corte.')
    expect(html).toContain(
      '<span class="num">0</span><span class="etiqueta">Expedientes pendientes al corte</span>',
    )
  })

  it('escapa persona y motivo para impedir inyección de HTML', () => {
    const html = construirHtmlReporteSalidasExternas({
      registros: [
        registro({
          personaRetira: '<script>alert("xss")</script>',
          motivo: 'A & B <b>negrita</b>',
        }),
      ],
      fecha: '2026-11-02',
      instanteCorte: CORTE,
    })

    expect(html).toContain('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;')
    expect(html).toContain('A &amp; B &lt;b&gt;negrita&lt;/b&gt;')
    expect(html).not.toContain('<script>alert("xss")</script>')
  })

  it('identifica el modo simulación solo cuando corresponde', () => {
    const conSimulacion = construirHtmlReporteSalidasExternas({
      registros: [],
      fecha: '2026-11-02',
      instanteCorte: CORTE,
      modoSimulacion: true,
    })
    const sinSimulacion = construirHtmlReporteSalidasExternas({
      registros: [],
      fecha: '2026-11-02',
      instanteCorte: CORTE,
      modoSimulacion: false,
    })

    expect(conSimulacion).toContain('Modo simulación: registros temporales')
    expect(sinSimulacion).not.toContain('Modo simulación: registros temporales')
  })

  it('abre la ventana de impresión y detecta el bloqueo', () => {
    const ventana = { document: {}, focus: vi.fn(), close: vi.fn() }
    const abrir = vi.spyOn(window, 'open').mockReturnValue(ventana)

    expect(abrirVentanaReporte()).toBe(ventana)
    expect(abrir).toHaveBeenCalledTimes(1)

    abrir.mockReturnValue(null)
    expect(abrirVentanaReporte()).toBeNull()
  })

  it('escribe el documento en la ventana abierta', () => {
    const ventana = {
      document: { open: vi.fn(), write: vi.fn(), close: vi.fn() },
      focus: vi.fn(),
    }

    expect(escribirReporteEnVentana(ventana, '<p>hola</p>')).toBe(true)
    expect(ventana.document.write).toHaveBeenCalledWith('<p>hola</p>')
    expect(ventana.document.close).toHaveBeenCalled()
    expect(ventana.focus).toHaveBeenCalled()

    expect(escribirReporteEnVentana(null, '<p>hola</p>')).toBe(false)
    expect(escribirReporteEnVentana({}, '<p>hola</p>')).toBe(false)
  })
})
