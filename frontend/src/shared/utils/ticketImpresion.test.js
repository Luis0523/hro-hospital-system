import { afterEach, describe, expect, it, vi } from 'vitest'
import { generarTicketImpresion } from './ticketImpresion.js'

const DATOS_COMPLETOS = {
  titulo: 'Comprobante de cita',
  turno: '043',
  especialidad: 'Medicina General',
  clinica: 'Clínica 01',
  observacion: 'Paciente con cita previa',
  fecha: '20/10/2026 10:30',
  paciente: 'Ana Pérez',
  expediente: '9275-81',
  recomendacion: 'Preséntese 15 minutos antes.',
}

function generarHtml(overrides = {}) {
  return generarTicketImpresion({ ...DATOS_COMPLETOS, ...overrides, abrirVentana: false })
}

function crearVentanaFalsa() {
  return {
    document: { write: vi.fn(), close: vi.fn() },
    focus: vi.fn(),
    print: vi.fn(),
    addEventListener: vi.fn(),
    close: vi.fn(),
  }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('generarTicketImpresion', () => {
  it('genera un ticket completo con todos los campos', () => {
    const html = generarHtml()

    expect(html).toContain('Comprobante de cita')
    expect(html).toContain('043')
    expect(html).toContain('Medicina General')
    expect(html).toContain('Clínica 01')
    expect(html).toContain('Paciente con cita previa')
    expect(html).toContain('20/10/2026 10:30')
    expect(html).toContain('Ana Pérez')
    expect(html).toContain('9275-81')
    expect(html).toContain('Preséntese 15 minutos antes.')
  })

  it('usa un ancho de 58 mm', () => {
    const html = generarHtml()

    expect(html).toContain('width: 58mm')
    expect(html).toContain('width=58mm')
    expect(html).toContain('box-sizing: border-box')
    expect(html).toContain('overflow-wrap: anywhere')
    expect(html).toContain('ui-monospace')
  })

  it('incluye @media print y @page', () => {
    const html = generarHtml()

    expect(html).toContain('@media print')
    expect(html).toContain('@page')
    expect(html).toContain('size: 58mm auto')
    expect(html).toContain('margin: 0')
  })

  it('incluye el pie institucional', () => {
    expect(generarHtml()).toContain('Hospital Regional de Occidente — SIGHO')
  })

  it('escapa &, <, >, " y \'', () => {
    const html = generarHtml({
      titulo: 'Ticket & <control>',
      paciente: 'A & B <C> "D" \'E\'',
      recomendacion: '<b>ojo</b> & listo',
    })

    expect(html).toContain('<title>Ticket &amp; &lt;control&gt;</title>')
    expect(html).toContain('A &amp; B &lt;C&gt; &quot;D&quot; &#39;E&#39;')
    expect(html).toContain('&lt;b&gt;ojo&lt;/b&gt; &amp; listo')
  })

  it('no deja una etiqueta <script> sin escapar', () => {
    const html = generarHtml({ paciente: '<script>alert("x")</script>' })

    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;')
  })

  it('omite las filas de campos opcionales vacíos', () => {
    const html = generarHtml({
      clinica: '',
      observacion: '   ',
      fecha: null,
      paciente: undefined,
      expediente: null,
      recomendacion: '',
    })

    expect(html).not.toContain('Clínica')
    expect(html).not.toContain('Observación')
    expect(html).not.toContain('Fecha y hora')
    expect(html).not.toContain('Paciente')
    expect(html).not.toContain('Expediente')
    expect(html).not.toContain('Recomendación')
    expect(html).toContain('Especialidad')
    expect(html).toContain('043')
  })

  it('usa el título por defecto cuando viene vacío', () => {
    const html = generarHtml({ titulo: '   ' })

    expect(html.match(/Comprobante de cita/g)).toHaveLength(2)
  })

  it('acepta turno 0 como válido', () => {
    const html = generarHtml({ turno: 0 })

    expect(html).toContain('<p class="turno">0</p>')
  })

  it('lanza error si falta el turno y no abre ventana', () => {
    const abrir = vi.spyOn(window, 'open').mockReturnValue(crearVentanaFalsa())

    expect(() =>
      generarTicketImpresion({ ...DATOS_COMPLETOS, turno: '  ', abrirVentana: true }),
    ).toThrow(/turno/)
    expect(abrir).not.toHaveBeenCalled()
  })

  it('lanza error si falta la especialidad y no abre ventana', () => {
    const abrir = vi.spyOn(window, 'open').mockReturnValue(crearVentanaFalsa())

    expect(() =>
      generarTicketImpresion({ ...DATOS_COMPLETOS, especialidad: '', abrirVentana: true }),
    ).toThrow(/especialidad/)
    expect(abrir).not.toHaveBeenCalled()
  })

  it('retorna el HTML y no abre ventana con abrirVentana: false', () => {
    const abrir = vi.spyOn(window, 'open')

    const html = generarTicketImpresion({ ...DATOS_COMPLETOS, abrirVentana: false })

    expect(abrir).not.toHaveBeenCalled()
    expect(html).toContain('043')
  })

  it('abre la ventana, escribe el HTML, registra afterprint y dispara print', () => {
    const ventana = crearVentanaFalsa()
    const abrir = vi.spyOn(window, 'open').mockReturnValue(ventana)

    const html = generarTicketImpresion({ ...DATOS_COMPLETOS, abrirVentana: true })

    expect(abrir).toHaveBeenCalledWith('', '_blank', 'width=320,height=640')
    expect(ventana.document.write).toHaveBeenCalledWith(html)
    expect(ventana.document.close).toHaveBeenCalled()
    expect(ventana.focus).toHaveBeenCalled()
    expect(ventana.addEventListener).toHaveBeenCalledWith('afterprint', expect.any(Function))
    expect(ventana.print).toHaveBeenCalled()
  })

  it('cierra la ventana después de afterprint', () => {
    const ventana = crearVentanaFalsa()
    vi.spyOn(window, 'open').mockReturnValue(ventana)

    generarTicketImpresion({ ...DATOS_COMPLETOS, abrirVentana: true })
    const [, alCerrar] = ventana.addEventListener.mock.calls[0]
    alCerrar()

    expect(ventana.close).toHaveBeenCalled()
  })

  it('lanza un error claro si el popup está bloqueado', () => {
    vi.spyOn(window, 'open').mockReturnValue(null)

    expect(() => generarTicketImpresion({ ...DATOS_COMPLETOS, abrirVentana: true })).toThrow(
      /ventana de impresión/i,
    )
  })

  it('no imprime si la validación falla', () => {
    const ventana = crearVentanaFalsa()
    vi.spyOn(window, 'open').mockReturnValue(ventana)

    expect(() =>
      generarTicketImpresion({ ...DATOS_COMPLETOS, especialidad: '', abrirVentana: true }),
    ).toThrow()

    expect(ventana.document.write).not.toHaveBeenCalled()
    expect(ventana.print).not.toHaveBeenCalled()
  })
})
