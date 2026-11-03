// Fechas y horas operativas de Archivo/Depuración en la zona del hospital.
// La zona se resuelve con la base IANA `America/Guatemala` mediante Intl, sin
// depender de la zona horaria configurada en el dispositivo ni de offsets fijos.

const ZONA_HOSPITAL = 'America/Guatemala'

const formatoFechaIso = new Intl.DateTimeFormat('en-US', {
  timeZone: ZONA_HOSPITAL,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const formatoHora = new Intl.DateTimeFormat('es-GT', {
  timeZone: ZONA_HOSPITAL,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

const formatoFechaCorta = new Intl.DateTimeFormat('es-GT', {
  timeZone: ZONA_HOSPITAL,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

function aFechaValida(instante) {
  if (instante == null) return null
  const fecha = instante instanceof Date ? instante : new Date(instante)
  return Number.isNaN(fecha.getTime()) ? null : fecha
}

// Fecha ISO `YYYY-MM-DD` del día operativo en Guatemala. Devuelve `null` si el
// instante no es una fecha válida.
export function fechaIsoEnGuatemala(instante = new Date()) {
  const fecha = aFechaValida(instante)
  if (!fecha) return null

  const partes = formatoFechaIso.formatToParts(fecha)
  const valor = (tipo) => partes.find((parte) => parte.type === tipo)?.value ?? ''
  return `${valor('year')}-${valor('month')}-${valor('day')}`
}

// Día operativo actual del hospital.
export function hoyIsoGuatemala() {
  return fechaIsoEnGuatemala(new Date())
}

// Hora `HH:mm` en Guatemala a partir de un instante o de un ISO con offset.
// Devuelve cadena vacía si el valor falta o es inválido.
export function formatearHoraGuatemala(instante) {
  const fecha = aFechaValida(instante)
  if (!fecha) return ''
  return formatoHora.format(fecha)
}

export function formatearFechaCortaGuatemala(valor) {
  if (typeof valor === 'string') {
    const coincidencia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valor.trim())
    if (coincidencia) return `${coincidencia[3]}/${coincidencia[2]}/${coincidencia[1]}`
  }

  const fecha = aFechaValida(valor)
  if (!fecha) return ''

  const partes = formatoFechaCorta.formatToParts(fecha)
  const parte = (tipo) => partes.find((item) => item.type === tipo)?.value ?? ''
  return `${parte('day')}/${parte('month')}/${parte('year')}`
}
