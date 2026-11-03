import { hoyIsoGuatemala } from './fechaDepuracionGuatemala'

export const TIPOS_PERIODO = {
  HOY: 'hoy',
  SEMANA: 'semana',
  PERSONALIZADO: 'personalizado',
}

const PATRON_FECHA = /^(\d{4})-(\d{2})-(\d{2})$/
const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
]
const MS_POR_DIA = 24 * 60 * 60 * 1000

export function esAnioBisiesto(anio) {
  return (anio % 4 === 0 && anio % 100 !== 0) || anio % 400 === 0
}

export function diasEnMes(anio, mes) {
  if (mes === 2) return esAnioBisiesto(anio) ? 29 : 28
  if ([4, 6, 9, 11].includes(mes)) return 30
  return 31
}

export function partesFecha(iso) {
  const coincidencia = PATRON_FECHA.exec(String(iso ?? '').trim())
  if (!coincidencia) return null

  const anio = Number(coincidencia[1])
  const mes = Number(coincidencia[2])
  const dia = Number(coincidencia[3])
  if (mes < 1 || mes > 12 || dia < 1 || dia > diasEnMes(anio, mes)) return null

  return { anio, mes, dia }
}

export function esFechaISOValida(iso) {
  return partesFecha(iso) !== null
}

function aIso(anio, mes, dia) {
  return `${String(anio).padStart(4, '0')}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
}

export function sumarDias(iso, cantidad) {
  const partes = partesFecha(iso)
  if (!partes) return null

  const fecha = new Date(Date.UTC(partes.anio, partes.mes - 1, partes.dia + Number(cantidad)))
  return aIso(fecha.getUTCFullYear(), fecha.getUTCMonth() + 1, fecha.getUTCDate())
}

export function diferenciaDias(desde, hasta) {
  const inicio = partesFecha(desde)
  const fin = partesFecha(hasta)
  if (!inicio || !fin) return null

  const inicioUtc = Date.UTC(inicio.anio, inicio.mes - 1, inicio.dia)
  const finUtc = Date.UTC(fin.anio, fin.mes - 1, fin.dia)
  return Math.round((finUtc - inicioUtc) / MS_POR_DIA)
}

export function diaSemanaLunesCero(iso) {
  const partes = partesFecha(iso)
  if (!partes) return null

  const domingoCero = new Date(Date.UTC(partes.anio, partes.mes - 1, partes.dia)).getUTCDay()
  return (domingoCero + 6) % 7
}

export function fechasDelRango(desde, hasta) {
  const total = diferenciaDias(desde, hasta)
  if (total == null || total < 0) return []

  return Array.from({ length: total + 1 }, (_, indice) => sumarDias(desde, indice))
}

export function validarRangoPersonalizado(desde, hasta) {
  const inicio = String(desde ?? '').trim()
  const fin = String(hasta ?? '').trim()

  if (!inicio || !fin) {
    return {
      valido: false,
      error: 'incompleto',
      mensaje: 'Seleccione la fecha inicial y la fecha final.',
    }
  }

  if (!esFechaISOValida(inicio) || !esFechaISOValida(fin)) {
    return {
      valido: false,
      error: 'invalida',
      mensaje: 'Ingrese fechas válidas en formato dd/mm/aaaa.',
    }
  }

  if (inicio > fin) {
    return {
      valido: false,
      error: 'invertida',
      mensaje: 'La fecha inicial no puede ser posterior a la fecha final.',
    }
  }

  const diasCalendario = diferenciaDias(inicio, fin) + 1

  return {
    valido: true,
    error: null,
    mensaje: null,
    desde: inicio,
    hasta: fin,
    diasCalendario,
  }
}

function crearPeriodoValido(tipo, desde, hasta) {
  const dias = fechasDelRango(desde, hasta)
  return {
    tipo,
    valido: true,
    error: null,
    mensaje: null,
    desde,
    hasta,
    dias,
    diasCalendario: dias.length,
  }
}

export function crearPeriodo(tipo, opciones = {}) {
  const hoy = opciones.hoy ?? hoyIsoGuatemala()

  if (!esFechaISOValida(hoy)) {
    return {
      tipo,
      valido: false,
      error: 'hoy_invalido',
      mensaje: 'No se pudo determinar el día operativo actual.',
      desde: '',
      hasta: '',
      dias: [],
      diasCalendario: 0,
    }
  }

  if (tipo === TIPOS_PERIODO.HOY) {
    return crearPeriodoValido(tipo, hoy, hoy)
  }

  if (tipo === TIPOS_PERIODO.SEMANA) {
    const desde = sumarDias(hoy, -diaSemanaLunesCero(hoy))
    return crearPeriodoValido(tipo, desde, sumarDias(desde, 6))
  }

  if (tipo === TIPOS_PERIODO.PERSONALIZADO) {
    const validacion = validarRangoPersonalizado(opciones.desde, opciones.hasta)
    if (!validacion.valido) {
      return {
        tipo,
        ...validacion,
        desde: validacion.desde ?? String(opciones.desde ?? ''),
        hasta: validacion.hasta ?? String(opciones.hasta ?? ''),
        dias: [],
        diasCalendario: 0,
      }
    }
    return crearPeriodoValido(tipo, validacion.desde, validacion.hasta)
  }

  return {
    tipo,
    valido: false,
    error: 'tipo_invalido',
    mensaje: 'Seleccione un período válido.',
    desde: hoy,
    hasta: hoy,
    dias: [],
    diasCalendario: 0,
  }
}

function fechaLarga(iso) {
  const partes = partesFecha(iso)
  if (!partes) return ''
  return `${partes.dia} de ${MESES[partes.mes - 1]} de ${partes.anio}`
}

export function etiquetaRango(desde, hasta) {
  const inicio = partesFecha(desde)
  const fin = partesFecha(hasta)
  if (!inicio || !fin) return ''

  if (desde === hasta) return fechaLarga(desde)

  if (inicio.anio === fin.anio && inicio.mes === fin.mes) {
    return `${inicio.dia} al ${fin.dia} de ${MESES[fin.mes - 1]} de ${fin.anio}`
  }

  if (inicio.anio === fin.anio) {
    return `${inicio.dia} de ${MESES[inicio.mes - 1]} al ${fin.dia} de ${
      MESES[fin.mes - 1]
    } de ${fin.anio}`
  }

  return `${fechaLarga(desde)} al ${fechaLarga(hasta)}`
}

export function etiquetaPeriodo(periodo) {
  if (!periodo?.valido) return ''

  if (periodo.tipo === TIPOS_PERIODO.HOY) {
    return `Hoy, ${fechaLarga(periodo.desde)}`
  }
  if (periodo.tipo === TIPOS_PERIODO.SEMANA) {
    return `Semana del ${etiquetaRango(periodo.desde, periodo.hasta)}`
  }
  return `Del ${etiquetaRango(periodo.desde, periodo.hasta)}`
}

export function tituloPeriodo(tipo) {
  if (tipo === TIPOS_PERIODO.SEMANA) return 'Depurados de la semana'
  if (tipo === TIPOS_PERIODO.PERSONALIZADO) return 'Depurados del rango'
  return 'Depurados de hoy'
}

export function textoVacioPeriodo(tipo) {
  if (tipo === TIPOS_PERIODO.SEMANA) return 'No hay expedientes depurados en esta semana'
  if (tipo === TIPOS_PERIODO.PERSONALIZADO) {
    return 'No hay expedientes depurados en el rango seleccionado'
  }
  return 'Aún no hay expedientes depurados hoy'
}
