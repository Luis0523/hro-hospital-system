import { aCp850, normalizarTexto } from './cp850.js'

const ESC = 0x1b
const GS = 0x1d

const CMD = {
  inicializar: [ESC, 0x40],
  cp850: [ESC, 0x74, 0x02],
  interlineado: [ESC, 0x33, 0x18],
  izquierda: [ESC, 0x61, 0x00],
  centro: [ESC, 0x61, 0x01],
  negritaOn: [ESC, 0x45, 0x01],
  negritaOff: [ESC, 0x45, 0x00],
  doble: [GS, 0x21, 0x11],
  normal: [GS, 0x21, 0x00],
  cortar: [GS, 0x56, 0x42, 0x00],
}

function limpiar(valor) {
  return normalizarTexto(valor)
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function envolver(texto, ancho) {
  const palabras = String(texto).split(/\s+/).filter(Boolean)
  const lineas = []
  let actual = ''
  for (const palabra of palabras) {
    if (!actual) {
      actual = palabra
    } else if (`${actual} ${palabra}`.length <= ancho) {
      actual += ` ${palabra}`
    } else {
      lineas.push(actual)
      actual = palabra
    }
  }
  if (actual) lineas.push(actual)
  return lineas.length ? lineas : ['']
}

function campo(etiqueta, valor, ancho) {
  const disponible = Math.max(8, ancho - etiqueta.length)
  return envolver(limpiar(valor), disponible).map((parte, indice) =>
    indice === 0 ? `${etiqueta}${parte}` : `${' '.repeat(etiqueta.length)}${parte}`,
  )
}

function fechaHoraActual() {
  const fecha = new Date()
  const dd = String(fecha.getDate()).padStart(2, '0')
  const mm = String(fecha.getMonth() + 1).padStart(2, '0')
  const aaaa = fecha.getFullYear()
  const hh = String(fecha.getHours()).padStart(2, '0')
  const min = String(fecha.getMinutes()).padStart(2, '0')
  return `${dd}/${mm}/${aaaa} ${hh}:${min}`
}

/**
 * Construye el ticket de prueba en formato ESC/POS.
 * Ancho pensado para 80 mm (576 puntos = 48 columnas en fuente A).
 */
export function construirTicketPrueba(
  { turno, especialidad, clinica, fechaHora },
  { columnas = 48, corte = true } = {},
) {
  const numero = Number(turno)
  if (!Number.isInteger(numero) || numero < 0) {
    throw new Error('El número de turno debe ser un entero mayor o igual a cero')
  }

  const ancho = Math.max(32, Math.min(64, Number(columnas) || 48))
  const separador = '-'.repeat(ancho)
  const numeroGrande = `#${String(numero).padStart(3, '0')}`

  const encabezado = [
    'HOSPITAL REGIONAL DE OCCIDENTE',
    'SIGHO',
    separador,
    'NUMERO DE TURNO',
  ]

  const clinicaTexto = clinica == null ? '' : limpiar(clinica)

  const detalle = [
    ...campo('ESPECIALIDAD: ', especialidad, ancho),
    ...(clinicaTexto
      ? campo('CLINICA:      ', clinicaTexto, ancho)
      : ['', 'ESTAR ATENTO A LA PANTALLA']),
    ...campo('FECHA Y HORA: ', fechaHora || fechaHoraActual(), ancho),
  ]

  return Buffer.concat([
    Buffer.from(CMD.inicializar),
    Buffer.from(CMD.cp850),
    Buffer.from(CMD.interlineado),
    Buffer.from(CMD.centro),
    Buffer.from(CMD.negritaOn),
    aCp850(encabezado.join('\n')),
    Buffer.from(CMD.negritaOff),
    aCp850('\n'),
    Buffer.from(CMD.doble),
    aCp850(`${numeroGrande}\n`),
    Buffer.from(CMD.normal),
    aCp850(`${separador}\n`),
    Buffer.from(CMD.izquierda),
    aCp850(detalle.join('\n')),
    Buffer.from(CMD.centro),
    aCp850('\n\n'),
    ...(corte ? [Buffer.from(CMD.cortar)] : []),
  ])
}
