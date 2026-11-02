// Fecha y hora operativas del Hospital Regional de Occidente.
//
// El hospital opera en America/Guatemala (UTC-6, sin horario de verano), por lo
// que "el día" NO debe calcularse con la zona horaria del navegador ni con
// métodos como toLocaleDateString sin `timeZone`. Aquí todos los instantes se
// reciben y devuelven como fecha absoluta (Date o ISO 8601); las cadenas
// dd/MM/yyyy y HH:mm son SOLO de presentación.
//
// Las funciones de datos devuelven `null` cuando el instante no es válido, para
// que la UI decida qué mostrar en lugar de propagar "Invalid Date".

export const ZONA_HORARIA_GUATEMALA = 'America/Guatemala'

const FORMATO_PARTES = new Intl.DateTimeFormat('en-US', {
  timeZone: ZONA_HORARIA_GUATEMALA,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
})

const PATRON_FECHA_ISO = /^\d{4}-\d{2}-\d{2}$/
const PATRON_HORA = /^([01]\d|2[0-3]):([0-5]\d)$/
const MS_POR_DIA = 24 * 60 * 60 * 1000

const FORMATO_FECHA_LARGA = new Intl.DateTimeFormat('es-GT', {
  timeZone: ZONA_HORARIA_GUATEMALA,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

/**
 * Convierte Date | ISO | epoch-ms en un Date válido. Devuelve null si no lo es.
 */
export function aInstante(valor) {
  if (valor instanceof Date) {
    return Number.isNaN(valor.getTime()) ? null : new Date(valor.getTime())
  }
  if (typeof valor === 'number') {
    if (!Number.isFinite(valor)) return null
    const fecha = new Date(valor)
    return Number.isNaN(fecha.getTime()) ? null : fecha
  }
  if (typeof valor === 'string') {
    const texto = valor.trim()
    if (!texto) return null
    const fecha = new Date(texto)
    return Number.isNaN(fecha.getTime()) ? null : fecha
  }
  return null
}

export function esInstanteValido(valor) {
  return aInstante(valor) !== null
}

/** Descompone un instante en su "reloj de pared" de Guatemala. */
function partesDe(valor) {
  const instante = aInstante(valor)
  if (!instante) return null

  const datos = {}
  for (const parte of FORMATO_PARTES.formatToParts(instante)) {
    if (parte.type !== 'literal') datos[parte.type] = parte.value
  }

  return {
    anio: datos.year,
    mes: datos.month,
    dia: datos.day,
    hora: datos.hour,
    minuto: datos.minute,
    segundo: datos.second,
  }
}

/** "YYYY-MM-DD" según el calendario de Guatemala. */
export function fechaGuatemalaDe(valor = new Date()) {
  const partes = partesDe(valor)
  if (!partes) return null
  return `${partes.anio}-${partes.mes}-${partes.dia}`
}

/** "HH:mm" en formato de 24 horas según Guatemala. */
export function horaGuatemalaDe(valor = new Date()) {
  const partes = partesDe(valor)
  if (!partes) return null
  return `${partes.hora}:${partes.minuto}`
}

/** "HH:mm:ss" en formato de 24 horas según Guatemala (reloj de pantalla). */
export function horaConSegundosGuatemalaDe(valor = new Date()) {
  const partes = partesDe(valor)
  if (!partes) return null
  return `${partes.hora}:${partes.minuto}:${partes.segundo}`
}

/**
 * Fecha larga con día de la semana (p. ej. "Domingo, 1 de noviembre de 2026").
 * Cadena vacía si el instante no es válido.
 */
export function formatearFechaLargaGuatemala(valor) {
  const instante = aInstante(valor)
  if (!instante) return ''
  const texto = FORMATO_FECHA_LARGA.format(instante)
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

/** "dd/MM/yyyy" para presentación. Cadena vacía si el instante no es válido. */
export function formatearFechaGuatemala(valor) {
  const partes = partesDe(valor)
  if (!partes) return ''
  return `${partes.dia}/${partes.mes}/${partes.anio}`
}

/** "dd/MM/yyyy HH:mm" para presentación. Cadena vacía si el instante no es válido. */
export function formatearFechaHoraGuatemala(valor) {
  const partes = partesDe(valor)
  if (!partes) return ''
  return `${partes.dia}/${partes.mes}/${partes.anio} ${partes.hora}:${partes.minuto}`
}

/** ¿Ambos instantes caen en el mismo día operativo de Guatemala? */
export function mismoDiaOperativo(a, b = new Date()) {
  const fechaA = fechaGuatemalaDe(a)
  const fechaB = fechaGuatemalaDe(b)
  if (!fechaA || !fechaB) return false
  return fechaA === fechaB
}

/** ¿El instante ocurrió en el día guatemalteco "YYYY-MM-DD"? */
export function ocurrioEnFecha(valor, fechaIso) {
  if (!esFechaIsoValida(fechaIso)) return false
  const fecha = fechaGuatemalaDe(valor)
  if (!fecha) return false
  return fecha === fechaIso.trim()
}

/** Valida "YYYY-MM-DD" incluyendo que la fecha exista en el calendario. */
export function esFechaIsoValida(valor) {
  const texto = typeof valor === 'string' ? valor.trim() : ''
  if (!PATRON_FECHA_ISO.test(texto)) return false

  const [anio, mes, dia] = texto.split('-').map(Number)
  const fecha = new Date(Date.UTC(anio, mes - 1, dia))

  return (
    fecha.getUTCFullYear() === anio && fecha.getUTCMonth() === mes - 1 && fecha.getUTCDate() === dia
  )
}

/**
 * Desfase de Guatemala (en ms) para un instante dado.
 * Se deriva de Intl en lugar de asumir -06:00 fijo.
 */
function desplazamientoGuatemalaMs(instante) {
  const partes = partesDe(instante)
  const comoUtc = Date.UTC(
    Number(partes.anio),
    Number(partes.mes) - 1,
    Number(partes.dia),
    Number(partes.hora),
    Number(partes.minuto),
    Number(partes.segundo),
  )
  const ms = instante.getTime()
  const sinMilisegundos = ms - (((ms % 1000) + 1000) % 1000)
  return comoUtc - sinMilisegundos
}

/**
 * Construye el instante absoluto de una fecha/hora "de pared" de Guatemala.
 * `fecha` = "YYYY-MM-DD"; `hora` = "HH:mm" (24 h). Null si algo no es válido.
 */
export function instanteDesdeFechaHoraGuatemala(fecha, hora = '00:00') {
  if (!esFechaIsoValida(fecha)) return null

  const textoFecha = fecha.trim()
  const coincidencia = PATRON_HORA.exec(String(hora ?? '').trim())
  if (!coincidencia) return null

  const [anio, mes, dia] = textoFecha.split('-').map(Number)
  const horas = Number(coincidencia[1])
  const minutos = Number(coincidencia[2])
  const comoUtc = Date.UTC(anio, mes - 1, dia, horas, minutos, 0)

  // Dos pasadas: la primera aproxima, la segunda corrige si el desfase cambia.
  let candidato = new Date(comoUtc - desplazamientoGuatemalaMs(new Date(comoUtc)))
  candidato = new Date(comoUtc - desplazamientoGuatemalaMs(candidato))

  // Verificación de ida y vuelta: detecta horas inexistentes o desbordes.
  const horaEsperada = `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`
  if (fechaGuatemalaDe(candidato) !== textoFecha) return null
  if (horaGuatemalaDe(candidato) !== horaEsperada) return null

  return candidato
}

/** Suma (o resta) días a una fecha "YYYY-MM-DD". Null si la fecha no es válida. */
export function sumarDiasIso(fecha, dias) {
  if (!esFechaIsoValida(fecha) || !Number.isInteger(dias)) return null

  const [anio, mes, dia] = fecha.trim().split('-').map(Number)
  const resultado = new Date(Date.UTC(anio, mes - 1, dia + dias))

  const anioFinal = resultado.getUTCFullYear()
  const mesFinal = String(resultado.getUTCMonth() + 1).padStart(2, '0')
  const diaFinal = String(resultado.getUTCDate()).padStart(2, '0')
  return `${anioFinal}-${mesFinal}-${diaFinal}`
}

/** Último milisegundo del día guatemalteco indicado. Null si la fecha no es válida. */
export function finDelDiaGuatemala(fecha) {
  const siguiente = sumarDiasIso(fecha, 1)
  if (!siguiente) return null

  const inicioSiguiente = instanteDesdeFechaHoraGuatemala(siguiente, '00:00')
  if (!inicioSiguiente) return null

  return new Date(inicioSiguiente.getTime() - 1)
}

/** Diferencia en días de calendario (hasta - desde). Null si alguna fecha no es válida. */
export function diasEntreFechasIso(desde, hasta) {
  if (!esFechaIsoValida(desde) || !esFechaIsoValida(hasta)) return null

  const [anioA, mesA, diaA] = desde.trim().split('-').map(Number)
  const [anioB, mesB, diaB] = hasta.trim().split('-').map(Number)
  const msA = Date.UTC(anioA, mesA - 1, diaA)
  const msB = Date.UTC(anioB, mesB - 1, diaB)

  return Math.round((msB - msA) / MS_POR_DIA)
}
