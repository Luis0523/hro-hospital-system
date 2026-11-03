import { formatearExpediente } from '@/shared/utils/expediente'
import { descargarBlob } from './descargarBlob'
import {
  fechaIsoEnGuatemala,
  formatearFechaCortaGuatemala,
  formatearHoraGuatemala,
} from './fechaDepuracionGuatemala'
import { fechaIsoDeRegistro } from './historialDepurados'
import { etiquetaPeriodo } from './periodoDepuracion'

const ANCHO_PAGINA = 595.28
const ALTO_PAGINA = 841.89
const MARGEN = 28
const ANCHO_TABLA = 539.28
const INICIO_TABLA = 172
const FIN_CONTENIDO = 760
const COLUMNAS = [
  { clave: 'numeroExpediente', titulo: 'EXPEDIENTE', ancho: 82 },
  { clave: 'pacienteNombre', titulo: 'PACIENTE', ancho: 160 },
  { clave: 'fecha', titulo: 'FECHA', ancho: 68 },
  { clave: 'hora', titulo: 'HORA', ancho: 48 },
  { clave: 'usuarioNombre', titulo: 'USUARIO', ancho: 181.28 },
]

const COLOR_AZUL = '0.122 0.227 0.373'
const COLOR_TEXTO = '0.067 0.09 0.12'
const COLOR_BLANCO = '1 1 1'
const COLOR_LINEA = '0.58 0.64 0.70'
const COLOR_SIMULACION = '1 0.984 0.929'
const COLOR_BORDE_SIMULACION = '0.70 0.35 0.05'

function aWinAnsi(valor) {
  const mapa = {
    '—': '\x97',
    '–': '\x96',
    '“': '\x93',
    '”': '\x94',
    '‘': '\x91',
    '’': '\x92',
    '…': '...',
  }
  return Array.from(String(valor ?? ''))
    .map((caracter) => {
      if (mapa[caracter]) return mapa[caracter]
      return caracter.charCodeAt(0) <= 0xff ? caracter : '?'
    })
    .join('')
}

function escaparPdf(valor) {
  return aWinAnsi(valor).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

function texto(x, top, tamano, valor, negrita = false, color = COLOR_TEXTO) {
  return `${color} rg\nBT /${negrita ? 'F2' : 'F1'} ${tamano} Tf ${x} ${
    ALTO_PAGINA - top
  } Td (${escaparPdf(valor)}) Tj ET`
}

function textoCentrado(top, tamano, valor, negrita = false) {
  const ancho = String(valor).length * tamano * 0.5
  return texto((ANCHO_PAGINA - ancho) / 2, top, tamano, valor, negrita)
}

function rectangulo(x, top, ancho, alto, { relleno, borde } = {}) {
  let salida = ''
  if (relleno) salida += `${relleno} rg\n`
  if (borde) salida += `${borde} RG\n0.5 w\n`
  salida += `${x} ${ALTO_PAGINA - top - alto} ${ancho} ${alto} re ${relleno && borde ? 'B' : relleno ? 'f' : 'S'}\n`
  return salida
}

function linea(x1, top1, x2, top2, color = COLOR_LINEA, grosor = 0.5) {
  return `${color} RG\n${grosor} w\n${x1} ${ALTO_PAGINA - top1} m ${x2} ${ALTO_PAGINA - top2} l S\n`
}

function normalizarEspacios(valor) {
  return String(valor ?? '')
    .replace(/\s+/g, ' ')
    .trim()
}

function envolverTexto(valor, maximo) {
  const palabras = normalizarEspacios(valor).split(' ').filter(Boolean)
  if (palabras.length === 0) return ['—']

  const lineas = []
  let actual = ''
  for (const palabra of palabras) {
    const candidata = actual ? `${actual} ${palabra}` : palabra
    if (candidata.length <= maximo) {
      actual = candidata
      continue
    }
    if (actual) lineas.push(actual)
    if (palabra.length <= maximo) {
      actual = palabra
      continue
    }
    for (let indice = 0; indice < palabra.length; indice += maximo) {
      const trozo = palabra.slice(indice, indice + maximo)
      if (trozo.length === maximo) lineas.push(trozo)
      else actual = trozo
    }
  }
  if (actual) lineas.push(actual)
  return lineas.length > 0 ? lineas : ['—']
}

function fechaGuatemala(instante) {
  const iso = fechaIsoEnGuatemala(instante)
  return iso ? formatearFechaCortaGuatemala(iso) : '—'
}

function horaGuatemala(instante) {
  return formatearHoraGuatemala(instante) || '—'
}

function fechaRegistro(registro) {
  const iso = fechaIsoDeRegistro(registro)
  return iso ? formatearFechaCortaGuatemala(iso) : '—'
}

function horaRegistro(registro) {
  return formatearHoraGuatemala(registro?.depuradoEn) || '—'
}

function etiquetaFiltro(tipo) {
  if (tipo === 'hoy') return 'Hoy'
  if (tipo === 'semana') return 'Esta semana'
  return 'Rango personalizado'
}

function filaTexto(registro) {
  return {
    numeroExpediente: formatearExpediente(registro?.numeroExpediente) || '—',
    pacienteNombre: registro?.pacienteNombre || '—',
    fecha: fechaRegistro(registro),
    hora: horaRegistro(registro),
    usuarioNombre: registro?.usuarioNombre || '—',
  }
}

function dibujarEncabezado(pagina, datos, generado, periodo, filtro) {
  const c = pagina.comandos
  c.push(texto(MARGEN, 36, 12, 'HOSPITAL REGIONAL DE OCCIDENTE', true))
  c.push(texto(MARGEN, 49, 8, 'Sistema Hospitalario HRO · Archivo Clínico'))
  c.push(texto(480, 36, 9, 'ARCHIVO', true))
  c.push(texto(450, 49, 8, 'Estación de Archivo'))
  c.push(linea(MARGEN, 60, MARGEN + ANCHO_TABLA, 60, COLOR_AZUL, 1))

  c.push(textoCentrado(80, 12, 'REPORTE DE EXPEDIENTES DEPURADOS', true))

  if (datos.usandoMock) {
    c.push(
      rectangulo(MARGEN, 92, ANCHO_TABLA, 16, {
        relleno: COLOR_SIMULACION,
        borde: COLOR_BORDE_SIMULACION,
      }),
    )
    c.push(
      textoCentrado(103, 8, 'MODO SIMULACIÓN — Datos de prueba sin validez institucional.', true),
    )
  }

  const metaTop = 121
  c.push(texto(MARGEN, metaTop, 7.5, 'PERIODO CONSULTADO', true))
  c.push(texto(140, metaTop, 7.2, periodo))
  c.push(texto(MARGEN, metaTop + 12, 7.5, 'FILTRO', true))
  c.push(texto(140, metaTop + 12, 7.2, filtro))
  c.push(texto(MARGEN, metaTop + 24, 7.5, 'FECHA DE GENERACIÓN', true))
  c.push(texto(150, metaTop + 24, 7.2, generado.fecha))
  c.push(texto(360, metaTop + 24, 7.5, 'HORA DE GENERACIÓN', true))
  c.push(texto(455, metaTop + 24, 7.2, generado.hora))
  c.push(texto(MARGEN, metaTop + 36, 7.5, 'TOTAL DE EXPEDIENTES', true))
  c.push(texto(150, metaTop + 36, 7.2, String(datos.total)))
}

function dibujarCabeceraTabla(pagina) {
  let x = MARGEN
  for (const columna of COLUMNAS) {
    pagina.comandos.push(
      rectangulo(x, INICIO_TABLA, columna.ancho, 16, {
        relleno: COLOR_AZUL,
        borde: COLOR_AZUL,
      }),
    )
    pagina.comandos.push(texto(x + 3, INICIO_TABLA + 10, 6.8, columna.titulo, true, COLOR_BLANCO))
    x += columna.ancho
  }
}

function nuevaPagina(datos, generado, periodo, filtro, conTabla = true) {
  const pagina = { comandos: [] }
  dibujarEncabezado(pagina, datos, generado, periodo, filtro)
  if (conTabla) dibujarCabeceraTabla(pagina)
  return pagina
}

function dibujarFila(pagina, registro, top) {
  const valores = filaTexto(registro)
  const celdas = COLUMNAS.map((columna) => ({
    ...columna,
    lineas: envolverTexto(
      valores[columna.clave],
      Math.max(6, Math.floor((columna.ancho - 6) / 3.9)),
    ),
  }))
  const lineas = Math.max(...celdas.map((celda) => celda.lineas.length))
  const alto = lineas * 9 + 6

  let x = MARGEN
  for (const celda of celdas) {
    pagina.comandos.push(rectangulo(x, top, celda.ancho, alto, { borde: COLOR_LINEA }))
    celda.lineas.forEach((lineaTexto, indice) => {
      pagina.comandos.push(texto(x + 3, top + 10 + indice * 9, 7.2, lineaTexto))
    })
    x += celda.ancho
  }

  return alto
}

function dibujarFirmas(pagina, top) {
  pagina.comandos.push(linea(60, top + 28, 275, top + 28, COLOR_TEXTO, 0.7))
  pagina.comandos.push(linea(320, top + 28, 535, top + 28, COLOR_TEXTO, 0.7))
  pagina.comandos.push(texto(140, top + 39, 9, 'Elaborado por', true))
  pagina.comandos.push(texto(155, top + 49, 8, 'Archivo'))
  pagina.comandos.push(texto(387, top + 39, 9, 'Revisado por', true))
  pagina.comandos.push(texto(377, top + 49, 8, 'Jefatura de Archivo'))
}

function dibujarPie(pagina, numero, total) {
  pagina.comandos.push(linea(MARGEN, 805, MARGEN + ANCHO_TABLA, 805, COLOR_LINEA, 0.5))
  pagina.comandos.push(texto(MARGEN, 817, 7.5, 'Hospital Regional de Occidente · Archivo Clínico'))
  pagina.comandos.push(texto(505, 817, 7.5, `Página ${numero} de ${total}`, true))
}

function aBytesLatin1(textoPdf) {
  const bytes = new Uint8Array(textoPdf.length)
  for (let indice = 0; indice < textoPdf.length; indice += 1) {
    bytes[indice] = textoPdf.charCodeAt(indice) & 0xff
  }
  return bytes
}

function construirDocumento(paginas) {
  const objetos = []
  const totalPaginas = paginas.length
  const kids = []
  const contenidos = paginas.map((pagina) => pagina.comandos.join('\n'))

  objetos[1] = '<< /Type /Catalog /Pages 2 0 R >>'
  objetos[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'
  objetos[4] =
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>'

  contenidos.forEach((contenido, indice) => {
    const paginaId = 5 + indice * 2
    const contenidoId = paginaId + 1
    kids.push(`${paginaId} 0 R`)
    objetos[paginaId] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${ANCHO_PAGINA} ${ALTO_PAGINA}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contenidoId} 0 R >>`
    objetos[contenidoId] = `<< /Length ${contenido.length} >>\nstream\n${contenido}\nendstream`
  })

  objetos[2] = `<< /Type /Pages /Kids [${kids.join(' ')}] /Count ${totalPaginas} >>`

  let pdf = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n'
  const desplazamientos = []
  for (let indice = 1; indice < objetos.length; indice += 1) {
    desplazamientos[indice] = pdf.length
    pdf += `${indice} 0 obj\n${objetos[indice]}\nendobj\n`
  }

  const inicioXref = pdf.length
  pdf += `xref\n0 ${objetos.length}\n0000000000 65535 f \n`
  for (let indice = 1; indice < objetos.length; indice += 1) {
    pdf += `${String(desplazamientos[indice]).padStart(10, '0')} 00000 n \n`
  }
  pdf += `trailer\n<< /Size ${objetos.length} /Root 1 0 R >>\nstartxref\n${inicioXref}\n%%EOF`

  return { bytes: aBytesLatin1(pdf), texto: pdf, paginas: totalPaginas }
}

export function motivoReporteNoDisponible(datos) {
  if (!datos) return 'El historial todavía no está disponible.'
  if (datos.cargando) return 'Espere a que termine la consulta del historial.'
  if (datos.desactualizado) {
    return 'El historial está desactualizado; actualícelo antes de generar el reporte.'
  }
  if (!datos.completo) {
    return 'La consulta del período está incompleta; no se puede generar el reporte.'
  }
  if (datos.error)
    return 'El historial tiene un error de consulta. Reintente antes de generar el reporte.'
  if (!datos.validoParaReportes) {
    return 'El historial no está validado para generar reportes.'
  }
  if (!datos.total || !Array.isArray(datos.registros) || datos.registros.length === 0) {
    return 'No hay expedientes depurados en el período seleccionado.'
  }
  return ''
}

export function puedeGenerarReporteDepurados(datos) {
  return Boolean(
    datos &&
    datos.cargando === false &&
    !datos.error &&
    datos.completo === true &&
    datos.desactualizado !== true &&
    datos.validoParaReportes === true &&
    datos.total > 0 &&
    Array.isArray(datos.registros) &&
    datos.registros.length === datos.total,
  )
}

export function nombreArchivoReporte({ fechaInicio, fechaFin, busquedaExpediente } = {}) {
  const sufijo = busquedaExpediente ? `_Exp_${busquedaExpediente}` : ''
  return `HRO_Depurados_${fechaInicio}_${fechaFin}${sufijo}.pdf`
}

export function construirPdfReporteDepurados({
  datosHistorial,
  fechaGeneracion = new Date(),
  usandoMock = false,
  periodoEtiqueta,
  busquedaExpediente = '',
} = {}) {
  if (!puedeGenerarReporteDepurados(datosHistorial)) {
    throw new Error(motivoReporteNoDisponible(datosHistorial))
  }

  const datos = {
    ...datosHistorial,
    usandoMock,
  }
  const periodo =
    periodoEtiqueta ||
    etiquetaPeriodo({
      tipo: datos.filtroActivo,
      valido: true,
      desde: datos.fechaInicio,
      hasta: datos.fechaFin,
    })
  const filtro = busquedaExpediente
    ? `Expediente ${formatearExpediente(busquedaExpediente)}`
    : etiquetaFiltro(datos.filtroActivo)
  const generado = {
    fecha: fechaGuatemala(fechaGeneracion),
    hora: horaGuatemala(fechaGeneracion),
  }
  const paginas = []
  let pagina = nuevaPagina(datos, generado, periodo, filtro)
  paginas.push(pagina)
  let top = INICIO_TABLA + 16

  datos.registros.forEach((registro) => {
    const alto =
      Math.max(
        ...COLUMNAS.map((columna) => {
          const valor = filaTexto(registro)[columna.clave]
          return envolverTexto(valor, Math.max(6, Math.floor((columna.ancho - 8) / 4.3))).length
        }),
      ) *
        9 +
      6

    if (top + alto > FIN_CONTENIDO) {
      pagina = nuevaPagina(datos, generado, periodo, filtro)
      paginas.push(pagina)
      top = INICIO_TABLA + 16
    }
    top += dibujarFila(pagina, registro, top)
  })

  if (top + 70 > 790) {
    pagina = nuevaPagina(datos, generado, periodo, filtro, false)
    paginas.push(pagina)
    top = 175
  }
  dibujarFirmas(pagina, top + 8)

  paginas.forEach((item, indice) => {
    dibujarPie(item, indice + 1, paginas.length)
  })

  const documento = construirDocumento(paginas)
  const blob = new Blob([documento.bytes], { type: 'application/pdf' })
  return {
    blob,
    bytes: documento.bytes,
    texto: documento.texto,
    paginas: documento.paginas,
    filas: datos.registros.length,
    nombre: nombreArchivoReporte({
      fechaInicio: datos.fechaInicio,
      fechaFin: datos.fechaFin,
      busquedaExpediente,
    }),
  }
}

export function descargarReporteDepurados({
  datosHistorial,
  fechaGeneracion = new Date(),
  usandoMock = false,
  periodoEtiqueta,
  busquedaExpediente = '',
} = {}) {
  if (!puedeGenerarReporteDepurados(datosHistorial)) {
    return { ok: false, motivo: 'datos', mensaje: motivoReporteNoDisponible(datosHistorial) }
  }

  const reporte = construirPdfReporteDepurados({
    datosHistorial,
    fechaGeneracion,
    usandoMock,
    periodoEtiqueta,
    busquedaExpediente,
  })
  const iniciada = descargarBlob(reporte.blob, reporte.nombre)

  if (!iniciada) {
    return {
      ok: false,
      motivo: 'descarga',
      mensaje: 'No se pudo iniciar la descarga del PDF. Inténtelo de nuevo.',
    }
  }

  return { ok: true, archivo: reporte.nombre, blob: reporte.blob, paginas: reporte.paginas }
}
