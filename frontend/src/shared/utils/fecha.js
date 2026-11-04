export function aIso(fecha) {
  const anio = fecha.getFullYear()
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${anio}-${mes}-${dia}`
}

export function hoyIso() {
  return aIso(new Date())
}

const ZONA_GUATEMALA = 'America/Guatemala'

/**
 * Día actual según la zona horaria del Hospital Regional de Occidente.
 * Independiente de la zona horaria configurada en el navegador.
 * Devuelve una fecha ISO `YYYY-MM-DD`.
 */
export function hoyIsoGuatemala() {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA_GUATEMALA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())

  const valor = (tipo) => partes.find((parte) => parte.type === tipo)?.value
  return `${valor('year')}-${valor('month')}-${valor('day')}`
}

export function formatearFechaLarga(iso) {
  if (!iso) return ''
  const [anio, mes, dia] = iso.split('-').map(Number)
  const fecha = new Date(anio, mes - 1, dia)
  return fecha.toLocaleDateString('es-GT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function mesDe(iso) {
  const [anio, mes] = iso.split('-').map(Number)
  return new Date(anio, mes - 1, 1)
}

export function rangoDelMes(anio, mes) {
  const primero = new Date(anio, mes, 1)
  const ultimo = new Date(anio, mes + 1, 0)
  return { primero, ultimo, fechaInicio: aIso(primero), fechaFin: aIso(ultimo) }
}

export function calcularEdad(iso) {
  if (!iso) return null
  const [anio, mes, dia] = iso.split('-').map(Number)
  const nacimiento = new Date(anio, mes - 1, dia)
  const hoy = new Date()
  let edad = hoy.getFullYear() - nacimiento.getFullYear()
  const diferenciaMes = hoy.getMonth() - nacimiento.getMonth()
  if (diferenciaMes < 0 || (diferenciaMes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad -= 1
  }
  return edad
}
