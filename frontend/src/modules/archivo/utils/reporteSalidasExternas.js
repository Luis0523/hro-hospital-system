// Generador del reporte imprimible de Salidas Externas.
//
// Produce un documento HTML autocontenido (CSS de impresión incluido) que se
// abre en una ventana nueva y dispara el diálogo de impresión del navegador.
// No usa dependencias, no guarda datos en el navegador y no consulta la API:
// recibe los registros ya obtenidos por el hook.
//
// Todo valor dinámico se escapa antes de insertarse en el HTML.

import {
  aInstante,
  esFechaIsoValida,
  fechaGuatemalaDe,
  formatearFechaHoraGuatemala,
} from './fechaGuatemala'
import {
  clasificarReporteCierre,
  diasDeAntiguedad,
  numeroExpedienteVisible,
} from './prestamosExternos'

export const TITULO_REPORTE = 'CONTROL DE SALIDAS EXTERNAS DE EXPEDIENTES'
export const SUBTITULO_REPORTE = 'Reporte de control diario'
const LOGO_REPORTE = '/logo-hro.png'

/** Escapa texto para insertarlo con seguridad en HTML. */
export function escaparHtml(valor) {
  return String(valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Descarta lo que no existía en el instante de corte:
 * - salidas posteriores al corte (no habían ocurrido);
 * - devoluciones posteriores al corte (se tratan como aún pendientes).
 * Así el reporte es coherente aunque se genere con datos más recientes.
 */
function registrosAlCorte(registros, corte) {
  const corteMs = corte.getTime()

  return (Array.isArray(registros) ? registros : [])
    .filter((registro) => {
      const salida = aInstante(registro?.fechaSalida)
      return salida && salida.getTime() <= corteMs
    })
    .map((registro) => {
      const devolucion = aInstante(registro.fechaDevolucion)
      if (devolucion && devolucion.getTime() > corteMs) {
        return { ...registro, fechaDevolucion: null }
      }
      return registro
    })
}

function valorOguion(valor) {
  return valor ? escaparHtml(valor) : '—'
}

function antiguedadTexto(dias) {
  if (dias == null) return '—'
  if (dias <= 0) return 'Mismo día'
  return `${dias} ${dias === 1 ? 'día' : 'días'}`
}

function tablaConEncabezado(columnas, filas, mensajeVacio) {
  if (filas.length === 0) {
    return `<p class="vacio">${escaparHtml(mensajeVacio)}</p>`
  }

  const encabezados = columnas
    .map((columna) => `<th scope="col">${escaparHtml(columna)}</th>`)
    .join('')

  const cuerpo = filas
    .map((celdas) => `<tr>${celdas.map((celda) => `<td>${celda}</td>`).join('')}</tr>`)
    .join('')

  return `<table>
    <thead><tr>${encabezados}</tr></thead>
    <tbody>${cuerpo}</tbody>
  </table>`
}

function seccionDevoluciones(reporte) {
  const filas = reporte.devolucionesDelDia.map((registro) => [
    escaparHtml(numeroExpedienteVisible(registro)),
    valorOguion(registro.personaRetira),
    valorOguion(registro.motivo),
    valorOguion(formatearFechaHoraGuatemala(registro.fechaSalida)),
    valorOguion(formatearFechaHoraGuatemala(registro.fechaDevolucion)),
  ])

  return `<section class="seccion">
    <h2>A. EXPEDIENTES DEVUELTOS</h2>
    ${tablaConEncabezado(
      ['N.º expediente', 'Persona que retiró', 'Motivo', 'Salida original', 'Devolución'],
      filas,
      'Sin devoluciones registradas en el día.',
    )}
  </section>`
}

function seccionPendientes(reporte, corte) {
  const filas = reporte.pendientesAlCorte.map((registro) => [
    escaparHtml(numeroExpedienteVisible(registro)),
    valorOguion(registro.personaRetira),
    valorOguion(registro.motivo),
    valorOguion(formatearFechaHoraGuatemala(registro.fechaSalida)),
    escaparHtml(antiguedadTexto(diasDeAntiguedad(registro, corte))),
    '<span class="casilla">[ ]</span>',
  ])

  return `<section class="seccion">
    <h2>B. EXPEDIENTES PENDIENTES</h2>
    ${tablaConEncabezado(
      [
        'N.º expediente',
        'Persona que retiró',
        'Motivo',
        'Salida original',
        'Antigüedad',
        'Comprobado',
      ],
      filas,
      'No hay expedientes pendientes al corte.',
    )}
    <p class="nota-seccion">
      La casilla “Comprobado” es para verificación física del expediente; no es un control
      interactivo.
    </p>
  </section>`
}

/**
 * Construye el HTML completo del reporte. Es una función pura: no toca el DOM.
 */
export function construirHtmlReporteSalidasExternas({
  registros = [],
  fecha = null,
  instanteCorte = null,
  generadoPor = null,
  modoSimulacion = false,
} = {}) {
  const corte = aInstante(instanteCorte) ?? new Date()
  const fechaOperativa = esFechaIsoValida(fecha) ? fecha.trim() : fechaGuatemalaDe(corte)

  const saneados = registrosAlCorte(registros, corte)
  const reporte = clasificarReporteCierre(saneados, {
    fecha: fechaOperativa,
    instanteCorte: corte,
  })

  const emision = formatearFechaHoraGuatemala(corte) || '—'
  const generado = generadoPor ? escaparHtml(generadoPor) : '—'

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escaparHtml(TITULO_REPORTE)} — ${escaparHtml(fechaOperativa ?? '')}</title>
<style>
  @page { size: A4 landscape; margin: 12mm 10mm; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: Arial, Helvetica, sans-serif;
    color: #1a1a1a;
    font-size: 11px;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .encabezado { display: flex; align-items: center; gap: 12px; border-bottom: 2px solid #1F3A5F; padding-bottom: 6px; }
  .logo { width: 46px; height: 46px; object-fit: contain; }
  .institucion { font-size: 16px; font-weight: bold; color: #1F3A5F; letter-spacing: .4px; }
  .institucion-sub { font-size: 9.5px; color: #5B6572; }
  .banda { margin-top: 8px; background: #1F3A5F; color: #ffffff; text-align: center; font-size: 16px; font-weight: bold; padding: 8px 4px; letter-spacing: .5px; }
  .banda-sub { text-align: center; color: #5B6572; font-style: italic; font-size: 10.5px; margin: 4px 0 8px; }
  .panel {
    border: 1px solid #9AA5B1;
    background: #EDF1F6;
    padding: 6px 8px;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 3px 18px;
    font-size: 9.5px;
    margin-bottom: 4px;
  }
  .panel div { min-width: 0; }
  .panel dt { display: inline; color: #5B6572; font-weight: bold; }
  .panel dd { display: inline; margin: 0; }
  .totales { display: flex; gap: 10px; margin: 8px 0 2px; }
  .totales div { flex: 1; border: 1px solid #9AA5B1; padding: 5px 8px; }
  .totales .num { display: block; font-size: 19px; font-weight: bold; color: #1F3A5F; }
  .totales .etiqueta { font-size: 9px; color: #5B6572; text-transform: uppercase; letter-spacing: .3px; }
  .seccion { margin-top: 10px; }
  .seccion h2 { font-size: 11.5px; color: #1F3A5F; margin: 0 0 5px; text-transform: uppercase; }
  table { width: 100%; border-collapse: collapse; }
  thead { display: table-header-group; }
  tr { break-inside: avoid; page-break-inside: avoid; }
  th { background: #1F3A5F; color: #ffffff; font-size: 9.5px; text-align: left; padding: 5px 6px; border: 1px solid #1F3A5F; }
  td { font-size: 10px; padding: 5px 6px; border: 1px solid #9AA5B1; vertical-align: top; }
  tbody tr:nth-child(even) td { background: #F2F4F7; }
  .vacio { margin: 0; padding: 8px 10px; border: 1px dashed #9AA5B1; color: #5B6572; font-size: 10px; }
  .nota-seccion { margin: 4px 0 0; color: #5B6572; font-size: 8.5px; }
  .casilla { font-family: 'Courier New', Courier, monospace; }
  .firmas { display: flex; gap: 40px; margin-top: 24px; break-inside: avoid; page-break-inside: avoid; }
  .firma { flex: 1; border-top: 1px solid #1a1a1a; padding-top: 4px; text-align: center; }
  .firma .nombre { margin: 0 0 2px; font-size: 9.5px; min-height: 13px; }
  .firma .rol { margin: 0; font-size: 9.5px; font-weight: bold; }
  .firma .nota { margin: 1px 0 0; font-size: 8.5px; color: #5B6572; }
  footer { margin-top: 14px; border-top: 1px solid #9AA5B1; padding-top: 4px; display: flex; flex-wrap: wrap; gap: 4px 16px; justify-content: space-between; font-size: 8.5px; color: #5B6572; }
  .simulacion { color: #8a4b00; font-weight: bold; }
</style>
</head>
<body>
  <header class="encabezado">
    <img class="logo" src="${LOGO_REPORTE}" alt="Logo del Hospital Regional de Occidente" />
    <div>
      <p class="institucion">HOSPITAL REGIONAL DE OCCIDENTE</p>
      <p class="institucion-sub">Control documental de expedientes</p>
    </div>
  </header>

  <div class="banda">${escaparHtml(TITULO_REPORTE)}</div>
  <p class="banda-sub">${escaparHtml(SUBTITULO_REPORTE)}</p>

  <dl class="panel">
    <div><dt>Fecha operativa:</dt> <dd>${escaparHtml(fechaOperativa ?? '—')}</dd></div>
    <div><dt>Hora del reporte:</dt> <dd>${escaparHtml(emision)}</dd></div>
    <div><dt>Corte:</dt> <dd>${escaparHtml(emision)}</dd></div>
    <div><dt>Generado por:</dt> <dd>${generado}</dd></div>
  </dl>

  <div class="totales">
    <div><span class="num">${reporte.totales.devoluciones}</span><span class="etiqueta">Expedientes devueltos del día</span></div>
    <div><span class="num">${reporte.totales.pendientes}</span><span class="etiqueta">Expedientes pendientes al corte</span></div>
  </div>

  ${seccionDevoluciones(reporte)}
  ${seccionPendientes(reporte, corte)}

  <div class="firmas">
    <div class="firma">
      <p class="nombre">${generado}</p>
      <p class="rol">Elaborado por — Archivo</p>
      <p class="nota">Nombre y firma</p>
    </div>
    <div class="firma">
      <p class="nombre">&nbsp;</p>
      <p class="rol">Revisado por — Jefatura de Archivo</p>
      <p class="nota">Nombre y firma</p>
    </div>
  </div>

  <footer>
    <span>Hospital Regional de Occidente · Sistema HRO</span>
    <span>Emitido: ${escaparHtml(emision)}</span>
    ${modoSimulacion ? '<span class="simulacion">Modo simulación: registros temporales, no institucionales.</span>' : ''}
  </footer>

  <script>window.addEventListener('load', function () { window.print() })</script>
</body>
</html>`
}

/**
 * Abre una ventana vacía de forma SÍNCRONA (dentro del clic del operador para
 * que el navegador no la bloquee). Devuelve null si no se pudo abrir.
 */
export function abrirVentanaReporte() {
  if (typeof window === 'undefined' || typeof window.open !== 'function') return null
  try {
    return window.open('', '_blank', 'width=1200,height=800')
  } catch {
    return null
  }
}

/** Escribe el documento en la ventana ya abierta. Devuelve false si falla. */
export function escribirReporteEnVentana(ventana, html) {
  if (!ventana || !ventana.document) return false
  try {
    ventana.document.open()
    ventana.document.write(html)
    ventana.document.close()
    ventana.focus?.()
    return true
  } catch {
    return false
  }
}
