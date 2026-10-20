const TITULO_POR_DEFECTO = 'Comprobante de cita'
const ANCHO_TICKET = '58mm'

const ESCAPES_HTML = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

function escaparHtml(valor) {
  return String(valor).replace(/[&<>"']/g, (caracter) => ESCAPES_HTML[caracter])
}

function normalizarTexto(valor) {
  if (valor == null) return ''
  return String(valor).trim()
}

function validarDatos(datos) {
  const turno = normalizarTexto(datos?.turno)
  if (!turno) throw new Error('El ticket requiere el campo "turno".')

  const especialidad = normalizarTexto(datos?.especialidad)
  if (!especialidad) throw new Error('El ticket requiere el campo "especialidad".')

  return { turno, especialidad }
}

function fila(etiqueta, valor) {
  const texto = normalizarTexto(valor)
  if (!texto) return ''

  return `      <div class="fila">
        <span class="etiqueta">${etiqueta}</span>
        <span class="valor">${escaparHtml(texto)}</span>
      </div>
`
}

function construirHtmlTicket(datos = {}) {
  const { turno, especialidad } = validarDatos(datos)
  const titulo = normalizarTexto(datos.titulo) || TITULO_POR_DEFECTO
  const recomendacion = normalizarTexto(datos.recomendacion)

  const bloqueRecomendacion = recomendacion
    ? `      <hr class="separador" />
      <p class="recomendacion"><span class="etiqueta">Recomendación:</span> ${escaparHtml(
        recomendacion,
      )}</p>
`
    : ''

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=${ANCHO_TICKET}" />
  <title>${escaparHtml(titulo)}</title>
  <style>
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; background: #fff; color: #000; }
    body {
      width: ${ANCHO_TICKET};
      padding: 1.5mm;
      font-family: ui-monospace, "Courier New", monospace;
      font-size: 11px;
      line-height: 1.35;
    }
    .titulo {
      margin: 0 0 1.5mm;
      font-size: 13px;
      font-weight: 700;
      text-align: center;
      text-transform: uppercase;
    }
    .turno {
      margin: 0 0 1.5mm;
      font-size: 30px;
      font-weight: 700;
      line-height: 1;
      text-align: center;
    }
    .fila {
      display: flex;
      justify-content: space-between;
      gap: 2mm;
      margin: 0.5mm 0;
    }
    .etiqueta { font-weight: 700; white-space: nowrap; }
    .valor { min-width: 0; text-align: right; overflow-wrap: anywhere; }
    .separador { margin: 1.5mm 0; border: 0; border-top: 1px dashed #000; }
    .recomendacion { margin: 0; overflow-wrap: anywhere; }
    .pie {
      margin: 2.5mm 0 0;
      font-size: 9px;
      text-align: center;
      overflow-wrap: anywhere;
    }
    @media print {
      html, body { width: ${ANCHO_TICKET}; }
      body { padding: 1.5mm; }
      @page { size: ${ANCHO_TICKET} auto; margin: 0; }
    }
  </style>
</head>
<body>
  <p class="titulo">${escaparHtml(titulo)}</p>
  <p class="turno">${escaparHtml(turno)}</p>
${fila('Especialidad', especialidad)}${fila('Clínica', datos.clinica)}${fila(
    'Observación',
    datos.observacion,
  )}${fila('Fecha y hora', datos.fecha)}${fila('Paciente', datos.paciente)}${fila(
    'Expediente',
    datos.expediente,
  )}${bloqueRecomendacion}  <p class="pie">Hospital Regional de Occidente — SIGHO</p>
</body>
</html>`
}

export function generarTicketImpresion(datos = {}) {
  const html = construirHtmlTicket(datos)
  if (datos.abrirVentana === false) return html

  const ventana = window.open('', '_blank', 'width=320,height=640')
  if (!ventana) {
    throw new Error(
      'No se pudo abrir la ventana de impresión. Verifica que el navegador no esté bloqueando las ventanas emergentes.',
    )
  }

  ventana.document.write(html)
  ventana.document.close()
  ventana.focus?.()
  ventana.addEventListener?.('afterprint', () => ventana.close?.())
  ventana.print()

  return html
}
