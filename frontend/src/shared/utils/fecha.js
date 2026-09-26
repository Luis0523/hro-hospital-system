export function aIso(fecha) {
  const anio = fecha.getFullYear()
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${anio}-${mes}-${dia}`
}

export function hoyIso() {
  return aIso(new Date())
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
