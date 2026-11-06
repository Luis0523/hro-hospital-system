import { hoyIsoGuatemala } from '@/shared/utils/fecha'

const RE_ISO = /^\d{4}-\d{2}-\d{2}$/
const ANIO_MINIMO = 2000
const ANIO_MAXIMO = 2100

function dosDigitos(valor) {
  return String(valor).padStart(2, '0')
}

function fechaReal(anio, mes, dia) {
  if (
    !Number.isInteger(anio) ||
    !Number.isInteger(mes) ||
    !Number.isInteger(dia) ||
    anio < ANIO_MINIMO ||
    anio > ANIO_MAXIMO ||
    mes < 1 ||
    mes > 12 ||
    dia < 1
  ) {
    return false
  }

  const fecha = new Date(Date.UTC(anio, mes - 1, dia))
  return (
    fecha.getUTCFullYear() === anio && fecha.getUTCMonth() === mes - 1 && fecha.getUTCDate() === dia
  )
}

function isoDesdePartes(anio, mes, dia) {
  return `${anio}-${dosDigitos(mes)}-${dosDigitos(dia)}`
}

/** Convierte un ISO válido a `dd/mm/aaaa`. */
export function formatearFechaTexto(iso) {
  if (!RE_ISO.test(String(iso ?? ''))) return ''
  const [anio, mes, dia] = String(iso).split('-')
  return `${dia}/${mes}/${anio}`
}

/** Acepta `dd/mm/aaaa`, dígitos sueltos o un ISO pegado. Devuelve ISO o null. */
export function parsearFechaTexto(texto) {
  const limpio = String(texto ?? '').trim()

  if (RE_ISO.test(limpio)) {
    const [anio, mes, dia] = limpio.split('-').map(Number)
    return fechaReal(anio, mes, dia) ? isoDesdePartes(anio, mes, dia) : null
  }

  const digitos = limpio.replace(/\D/g, '')
  if (digitos.length !== 8) return null

  const dia = Number(digitos.slice(0, 2))
  const mes = Number(digitos.slice(2, 4))
  const anio = Number(digitos.slice(4, 8))
  return fechaReal(anio, mes, dia) ? isoDesdePartes(anio, mes, dia) : null
}

/** Aplica la máscara dd/mm/aaaa mientras se escribe o pega una fecha. */
export function aplicarMascaraFecha(texto) {
  const limpio = String(texto ?? '').trim()

  if (RE_ISO.test(limpio) && parsearFechaTexto(limpio)) {
    return formatearFechaTexto(limpio)
  }

  const digitos = limpio.replace(/\D/g, '').slice(0, 8)
  if (digitos.length <= 2) return digitos
  if (digitos.length <= 4) return `${digitos.slice(0, 2)}/${digitos.slice(2)}`
  return `${digitos.slice(0, 2)}/${digitos.slice(2, 4)}/${digitos.slice(4)}`
}

/** Valida dos campos de texto y devuelve los ISO y errores por campo. */
export function validarRangoFechas(desdeTexto, hastaTexto) {
  const desde = parsearFechaTexto(desdeTexto)
  const hasta = parsearFechaTexto(hastaTexto)
  const errores = {}

  if (!desde) {
    errores.desde = 'Ingrese una fecha válida entre 2000 y 2100 (dd/mm/aaaa).'
  }
  if (!hasta) {
    errores.hasta = 'Ingrese una fecha válida entre 2000 y 2100 (dd/mm/aaaa).'
  }
  if (desde && hasta && desde > hasta) {
    errores.hasta = 'La fecha final no puede ser anterior a la inicial.'
  }

  return { desde, hasta, errores, valido: Object.keys(errores).length === 0 }
}

/** Período inicial: mes actual de Guatemala. */
export function rangoMesActualGuatemala() {
  const hoy = hoyIsoGuatemala()
  const anio = Number(hoy.slice(0, 4))
  const mes = Number(hoy.slice(5, 7))
  const ultimoDia = new Date(Date.UTC(anio, mes, 0)).getUTCDate()
  return {
    desde: isoDesdePartes(anio, mes, 1),
    hasta: isoDesdePartes(anio, mes, ultimoDia),
  }
}

/** Años inclusivos que abarca el rango ISO. */
export function aniosDelRango(desde, hasta) {
  if (!parsearFechaTexto(desde) || !parsearFechaTexto(hasta) || desde > hasta) return []
  const anioInicio = Number(desde.slice(0, 4))
  const anioFin = Number(hasta.slice(0, 4))
  return Array.from({ length: anioFin - anioInicio + 1 }, (_, indice) => anioInicio + indice)
}

/** Filtra registros inclusivos por fecha ISO y los ordena descendente. */
export function filtrarRegistrosPorRango(registros = [], desde, hasta) {
  if (!desde || !hasta) return []
  return registros
    .filter((registro) => registro?.fecha && registro.fecha >= desde && registro.fecha <= hasta)
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
}

/** Indica si una fecha ISO cae dentro del rango. */
export function fechaEnRango(fecha, filtros = {}) {
  if (!fecha) return false
  return fecha >= filtros.desde && fecha <= filtros.hasta
}

/** Fecha y hora de generación en Guatemala, en formato legible. */
export function formatearGeneracionGuatemala(fecha = new Date()) {
  return new Intl.DateTimeFormat('es-GT', {
    timeZone: 'America/Guatemala',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(fecha)
}
