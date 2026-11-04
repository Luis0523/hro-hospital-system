import { descargarBlob } from './descargarBlob'
import { formatearFechaTexto, formatearGeneracionGuatemala } from './rangoFechas'

const ANCHO = 595
const ALTO = 842
const MARGEN = 40
const ANCHO_CONTENIDO = ANCHO - MARGEN * 2
const FILAS_POR_PAGINA = 27
const ALTO_FILA = 17
const ALTO_ENCABEZADO_TABLA = 22

// Paleta institucional tomada de reportes-pdf/src/pdf/constantes.js.
const COLORES = {
  primario: '0.122 0.227 0.373',
  primarioClaro: '0.180 0.310 0.478',
  texto: '0.102 0.102 0.102',
  textoSuave: '0.357 0.396 0.447',
  borde: '0.604 0.647 0.694',
  filaAlterna: '0.949 0.957 0.969',
  panel: '0.929 0.945 0.965',
  blanco: '1 1 1',
}

const COLUMNAS = [
  { clave: 'fecha', etiqueta: 'FECHA', ancho: 80, alineacion: 'left' },
  {
    clave: 'egresosHospitalarios',
    etiqueta: 'EGRESOS HOSPITALARIOS',
    ancho: 135,
    alineacion: 'right',
  },
  { clave: 'sobresEmergencia', etiqueta: 'SOBRES EMERGENCIA', ancho: 115, alineacion: 'right' },
  { clave: 'sobresSellados', etiqueta: 'SOBRES SELLADOS', ancho: 110, alineacion: 'right' },
  { clave: 'tia', etiqueta: 'TIA', ancho: 75, alineacion: 'right' },
]

const METRICAS_TOTALES = [
  { clave: 'dias', etiqueta: 'Días registrados' },
  { clave: 'egresos', etiqueta: 'Egresos hospitalarios' },
  { clave: 'emergencia', etiqueta: 'Sobres emergencia' },
  { clave: 'sellados', etiqueta: 'Sobres sellados' },
  { clave: 'tia', etiqueta: 'TIA' },
]

function escaparPdf(texto) {
  return String(texto).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

function anchoAproximado(valor, tamano, negrita = false) {
  return String(valor).length * tamano * (negrita ? 0.56 : 0.52)
}

function texto(contenido, x, y, valor, tamano = 8.5, negrita = false, color = COLORES.texto) {
  const fuente = negrita ? 'F2' : 'F1'
  contenido.push(
    `BT /${fuente} ${tamano} Tf ${color} rg 1 0 0 1 ${x} ${y} Tm (${escaparPdf(valor)}) Tj ET`,
  )
}

function textoDerecha(
  contenido,
  derecha,
  y,
  valor,
  tamano = 8.5,
  negrita = false,
  color = COLORES.texto,
) {
  const x = derecha - anchoAproximado(valor, tamano, negrita)
  texto(contenido, x, y, valor, tamano, negrita, color)
}

function textoCentrado(
  contenido,
  centro,
  y,
  valor,
  tamano = 8.5,
  negrita = false,
  color = COLORES.texto,
) {
  const x = centro - anchoAproximado(valor, tamano, negrita) / 2
  texto(contenido, x, y, valor, tamano, negrita, color)
}

function linea(contenido, x1, y1, x2, y2, color = COLORES.borde, grosor = 0.5) {
  contenido.push(`${color} RG ${grosor} w ${x1} ${y1} m ${x2} ${y2} l S`)
}

function caminoRedondeado(x, y, ancho, alto, radio) {
  const r = Math.min(radio, ancho / 2, alto / 2)
  const k = 0.5522847498 * r
  return [
    `${x + r} ${y} m`,
    `${x + ancho - r} ${y} l`,
    `${x + ancho - r + k} ${y} ${x + ancho} ${y + r - k} ${x + ancho} ${y + r} c`,
    `${x + ancho} ${y + alto - r} l`,
    `${x + ancho} ${y + alto - r + k} ${x + ancho - r + k} ${y + alto} ${x + ancho - r} ${y + alto} c`,
    `${x + r} ${y + alto} l`,
    `${x + r - k} ${y + alto} ${x} ${y + alto - r + k} ${x} ${y + alto - r} c`,
    `${x} ${y + r} l`,
    `${x} ${y + r - k} ${x + r - k} ${y} ${x + r} ${y} c`,
    'h',
  ].join(' ')
}

function rectangulo(
  contenido,
  x,
  y,
  ancho,
  alto,
  relleno = null,
  borde = null,
  radio = 0,
  grosor = 0.5,
) {
  const camino =
    radio > 0 ? caminoRedondeado(x, y, ancho, alto, radio) : `${x} ${y} ${ancho} ${alto} re`

  if (relleno) contenido.push(`${relleno} rg`)
  if (borde) contenido.push(`${borde} RG ${grosor} w`)

  if (relleno && borde) contenido.push(`${camino} B`)
  else if (relleno) contenido.push(`${camino} f`)
  else if (borde) contenido.push(`${camino} S`)
}

function sumar(registros, clave) {
  return registros.reduce((total, registro) => total + (Number(registro?.[clave]) || 0), 0)
}

function filtrarPorRango(registros, desde, hasta) {
  if (!desde || !hasta) return [...registros]
  return registros.filter((registro) => registro?.fecha >= desde && registro?.fecha <= hasta)
}

function dibujarPiePagina(contenido, { pagina, totalPaginas }) {
  linea(contenido, MARGEN, 40, ANCHO - MARGEN, 40, COLORES.borde, 0.5)
  texto(
    contenido,
    MARGEN,
    28,
    'Hospital Regional de Occidente - Sistema HRO',
    7.5,
    false,
    COLORES.textoSuave,
  )
  textoCentrado(
    contenido,
    ANCHO / 2,
    28,
    'REGISTRO DEL CUADERNO ROJO',
    7.5,
    false,
    COLORES.textoSuave,
  )
  textoDerecha(
    contenido,
    ANCHO - MARGEN,
    28,
    `Página ${pagina} de ${totalPaginas}`,
    7.5,
    false,
    COLORES.textoSuave,
  )
}

function dibujarEncabezadoTabla(contenido, yInferior) {
  rectangulo(
    contenido,
    MARGEN,
    yInferior,
    ANCHO_CONTENIDO,
    ALTO_ENCABEZADO_TABLA,
    COLORES.primario,
    COLORES.primario,
  )

  let x = MARGEN
  for (const columna of COLUMNAS) {
    const centro = x + columna.ancho / 2
    if (columna.alineacion === 'left') {
      texto(contenido, x + 5, yInferior + 7, columna.etiqueta, 8.5, true, COLORES.blanco)
    } else {
      textoCentrado(contenido, centro, yInferior + 7, columna.etiqueta, 8.5, true, COLORES.blanco)
    }
    x += columna.ancho
  }

  return yInferior
}

function dibujarEncabezadoCompleto(contenido, contexto) {
  texto(contenido, MARGEN, 800, 'HOSPITAL REGIONAL DE OCCIDENTE', 14, true, COLORES.primario)
  texto(contenido, MARGEN, 787, 'DEPARTAMENTO DE ARCHIVO', 8, false, COLORES.textoSuave)
  textoDerecha(contenido, ANCHO - MARGEN, 800, 'Sistema HRO', 7.5, false, COLORES.textoSuave)
  textoDerecha(
    contenido,
    ANCHO - MARGEN,
    787,
    'Uso interno - Archivo',
    7.5,
    false,
    COLORES.textoSuave,
  )

  rectangulo(contenido, MARGEN, 750, ANCHO_CONTENIDO, 28, COLORES.primario, COLORES.primario, 4)
  textoCentrado(contenido, ANCHO / 2, 759, 'REGISTRO DEL CUADERNO ROJO', 16, true, COLORES.blanco)
  textoCentrado(
    contenido,
    ANCHO / 2,
    739,
    'Reporte de registros diarios',
    9,
    false,
    COLORES.textoSuave,
  )

  rectangulo(contenido, MARGEN, 684, ANCHO_CONTENIDO, 44, COLORES.panel, COLORES.borde, 4)

  const izquierda = MARGEN + 10
  const derecha = MARGEN + ANCHO_CONTENIDO / 2 + 4
  const valorIzquierda = izquierda + 82
  const valorDerecha = derecha + 82

  texto(contenido, izquierda, 712, 'Período:', 7.5, true, COLORES.textoSuave)
  texto(contenido, valorIzquierda, 712, contexto.periodo, 8.5, false, COLORES.texto)
  texto(contenido, derecha, 712, 'Generado el:', 7.5, true, COLORES.textoSuave)
  texto(contenido, valorDerecha, 712, contexto.generadoEn, 8.5, false, COLORES.texto)

  texto(contenido, izquierda, 696, 'Días registrados:', 7.5, true, COLORES.textoSuave)
  texto(contenido, valorIzquierda, 696, String(contexto.totalDias), 8.5, false, COLORES.texto)
  texto(contenido, derecha, 696, 'Elaborado por:', 7.5, true, COLORES.textoSuave)
  texto(contenido, valorDerecha, 696, 'Sistema HRO - Archivo', 8.5, false, COLORES.texto)

  return dibujarEncabezadoTabla(contenido, 652)
}

function dibujarEncabezadoContinuacion(contenido, contexto) {
  texto(contenido, MARGEN, 800, 'HOSPITAL REGIONAL DE OCCIDENTE', 11, true, COLORES.primario)
  textoDerecha(
    contenido,
    ANCHO - MARGEN,
    800,
    'REGISTRO DEL CUADERNO ROJO',
    8,
    true,
    COLORES.primarioClaro,
  )
  linea(contenido, MARGEN, 790, ANCHO - MARGEN, 790, COLORES.primario, 0.8)
  texto(
    contenido,
    MARGEN,
    779,
    `Continuación - Período: ${contexto.periodo} - Generado el: ${contexto.generadoEn}`,
    7.5,
    false,
    COLORES.textoSuave,
  )

  return dibujarEncabezadoTabla(contenido, 736)
}

function dibujarEncabezadoPagina(contenido, contexto) {
  if (contexto.pagina === 1) return dibujarEncabezadoCompleto(contenido, contexto)
  return dibujarEncabezadoContinuacion(contenido, contexto)
}

function dibujarFila(contenido, registro, yInferior, alterna) {
  const relleno = alterna ? COLORES.filaAlterna : COLORES.blanco
  let x = MARGEN

  for (const columna of COLUMNAS) {
    rectangulo(contenido, x, yInferior, columna.ancho, ALTO_FILA, relleno, COLORES.borde, 0, 0.5)

    const valor =
      columna.clave === 'fecha'
        ? formatearFechaTexto(registro?.fecha) || String(registro?.fecha ?? '-')
        : String(registro?.[columna.clave] ?? 0)

    if (columna.alineacion === 'right') {
      textoDerecha(
        contenido,
        x + columna.ancho - 5,
        yInferior + 5.5,
        valor,
        8.5,
        false,
        COLORES.texto,
      )
    } else {
      texto(contenido, x + 5, yInferior + 5.5, valor, 8.5, false, COLORES.texto)
    }

    x += columna.ancho
  }
}

function dibujarTotales(contenido, registros, yDespuesFilas) {
  const top = Math.max(112, yDespuesFilas - 14)
  const barraInferior = top - 18
  const panelInferior = top - 54

  rectangulo(contenido, MARGEN, barraInferior, ANCHO_CONTENIDO, 18, COLORES.primario, null, 3)
  texto(contenido, MARGEN + 5, barraInferior + 6, 'TOTALES DEL PERÍODO', 8.5, true, COLORES.blanco)

  rectangulo(contenido, MARGEN, panelInferior, ANCHO_CONTENIDO, 36, COLORES.panel, COLORES.borde, 3)

  const totales = {
    dias: registros.length,
    egresos: sumar(registros, 'egresosHospitalarios'),
    emergencia: sumar(registros, 'sobresEmergencia'),
    sellados: sumar(registros, 'sobresSellados'),
    tia: sumar(registros, 'tia'),
  }
  const anchoMetrica = ANCHO_CONTENIDO / METRICAS_TOTALES.length

  METRICAS_TOTALES.forEach((metrica, indice) => {
    const x = MARGEN + indice * anchoMetrica
    if (indice > 0) {
      linea(contenido, x, panelInferior + 5, x, panelInferior + 31, COLORES.borde, 0.5)
    }
    textoCentrado(
      contenido,
      x + anchoMetrica / 2,
      panelInferior + 22,
      metrica.etiqueta,
      7,
      true,
      COLORES.textoSuave,
    )
    textoCentrado(
      contenido,
      x + anchoMetrica / 2,
      panelInferior + 8,
      String(totales[metrica.clave]),
      12,
      true,
      COLORES.primario,
    )
  })
}

function contenidoPagina(registros, inicio, fin, contexto) {
  const contenido = []
  let y = dibujarEncabezadoPagina(contenido, contexto)
  let indiceFila = 0

  for (let indice = inicio; indice < fin; indice += 1) {
    y -= ALTO_FILA
    dibujarFila(contenido, registros[indice], y, indiceFila % 2 === 1)
    indiceFila += 1
  }

  if (fin === registros.length) {
    dibujarTotales(contenido, registros, y)
  }

  dibujarPiePagina(contenido, contexto)
  return contenido.join('\n')
}

/**
 * Construye un PDF A4 vertical con los registros filtrados y sus totales.
 * Sigue la paleta, el encabezado, la tabla y el pie de reportes-pdf sin agregar
 * dependencias: todo se escribe como contenido PDF básico.
 */
export function construirPdfCuaderno({
  registros = [],
  desde,
  hasta,
  generadoEn = formatearGeneracionGuatemala(),
}) {
  const filtrados = filtrarPorRango(registros, desde, hasta)
  const ordenados = [...filtrados].sort((a, b) =>
    String(b?.fecha ?? '').localeCompare(String(a?.fecha ?? '')),
  )
  const cantidadPaginas = Math.max(1, Math.ceil(ordenados.length / FILAS_POR_PAGINA))
  const periodo = `${formatearFechaTexto(desde) || '-'} - ${formatearFechaTexto(hasta) || '-'}`
  const paginas = []

  for (let pagina = 0; pagina < cantidadPaginas; pagina += 1) {
    const inicio = pagina * FILAS_POR_PAGINA
    const fin = Math.min(inicio + FILAS_POR_PAGINA, ordenados.length)
    paginas.push(
      contenidoPagina(ordenados, inicio, fin, {
        desde,
        hasta,
        generadoEn,
        periodo,
        totalDias: ordenados.length,
        pagina: pagina + 1,
        totalPaginas: cantidadPaginas,
      }),
    )
  }

  const objetos = []
  const referencia = (numero) => `${numero} 0 R`
  const numeroPagina = (indice) => 5 + indice * 2
  const numeroContenido = (indice) => 6 + indice * 2

  objetos[1] = '<< /Type /Catalog /Pages 2 0 R >>'
  objetos[2] = `<< /Type /Pages /Kids [${paginas
    .map((_, indice) => referencia(numeroPagina(indice)))
    .join(' ')}] /Count ${paginas.length} >>`
  objetos[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'
  objetos[4] =
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>'

  paginas.forEach((contenido, indice) => {
    objetos[numeroPagina(indice)] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${ANCHO} ${ALTO}] ` +
      `/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> ` +
      `/Contents ${numeroContenido(indice)} 0 R >>`
    objetos[numeroContenido(indice)] =
      `<< /Length ${contenido.length} >>\nstream\n${contenido}\nendstream`
  })

  let pdf = '%PDF-1.4\n'
  const desplazamientos = []
  for (let numero = 1; numero < objetos.length; numero += 1) {
    desplazamientos[numero] = pdf.length
    pdf += `${numero} 0 obj\n${objetos[numero]}\nendobj\n`
  }

  const inicioXref = pdf.length
  pdf += `xref\n0 ${objetos.length}\n0000000000 65535 f \n`
  for (let numero = 1; numero < objetos.length; numero += 1) {
    pdf += `${String(desplazamientos[numero]).padStart(10, '0')} 00000 n \n`
  }
  pdf += `trailer\n<< /Size ${objetos.length} /Root 1 0 R >>\nstartxref\n${inicioXref}\n%%EOF`

  const bytes = new Uint8Array(pdf.length)
  for (let indice = 0; indice < pdf.length; indice += 1) {
    bytes[indice] = pdf.charCodeAt(indice) & 0xff
  }
  return bytes
}

export function nombreReporteCuaderno(desde, hasta) {
  return `cuaderno-rojo-${desde}_${hasta}.pdf`
}

export function descargarReporteCuaderno({ registros, desde, hasta, generadoEn }) {
  const bytes = construirPdfCuaderno({ registros, desde, hasta, generadoEn })
  const blob = new Blob([bytes], { type: 'application/pdf' })
  return descargarBlob(blob, nombreReporteCuaderno(desde, hasta))
}
