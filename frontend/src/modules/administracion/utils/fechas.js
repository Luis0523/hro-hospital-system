// Utilidades de fecha para el calendario institucional.
// Trabajan con el contrato LocalDate (YYYY-MM-DD) del backend sin usar
// new Date('YYYY-MM-DD') para evitar desfases por zona horaria.

export const NOMBRES_MES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

// Semana del backend: 1 = Lunes ... 7 = Domingo.
export const NOMBRES_DIA_CORTO = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

function dosDigitos(valor) {
  return String(valor).padStart(2, '0')
}

export function mesActual() {
  const ahora = new Date()
  return { anio: ahora.getFullYear(), mes: ahora.getMonth() + 1 }
}

export function aISO(anio, mes, dia) {
  return `${anio}-${dosDigitos(mes)}-${dosDigitos(dia)}`
}

export function desdeISO(iso) {
  const [anio, mes, dia] = String(iso ?? '')
    .split('-')
    .map(Number)
  return { anio, mes, dia }
}

export function nombreMes(mes) {
  return NOMBRES_MES[Number(mes) - 1] ?? ''
}

export function diasEnMes(anio, mes) {
  return new Date(Date.UTC(anio, mes, 0)).getUTCDate()
}

// Día de la semana ISO: 1 = Lunes ... 7 = Domingo.
export function diaSemanaISO(anio, mes, dia) {
  const diaJS = new Date(Date.UTC(anio, mes - 1, dia)).getUTCDay()
  return diaJS === 0 ? 7 : diaJS
}

// Rejilla mensual que inicia en lunes. Las celdas de relleno son null.
export function construirMatrizMes(anio, mes) {
  const total = diasEnMes(anio, mes)
  const offset = diaSemanaISO(anio, mes, 1) - 1
  const celdas = []
  for (let i = 0; i < offset; i += 1) celdas.push(null)
  for (let dia = 1; dia <= total; dia += 1) {
    celdas.push({ anio, mes, dia, iso: aISO(anio, mes, dia) })
  }
  while (celdas.length % 7 !== 0) celdas.push(null)

  const semanas = []
  for (let i = 0; i < celdas.length; i += 7) semanas.push(celdas.slice(i, i + 7))
  return semanas
}

export function rangoMesISO(anio, mes) {
  return { inicio: aISO(anio, mes, 1), fin: aISO(anio, mes, diasEnMes(anio, mes)) }
}

export function sumarMes(anio, mes, delta) {
  const base = new Date(Date.UTC(anio, mes - 1 + delta, 1))
  return { anio: base.getUTCFullYear(), mes: base.getUTCMonth() + 1 }
}

export function formatearFechaLarga(iso) {
  const { anio, mes, dia } = desdeISO(iso)
  if (!anio || !mes || !dia) return ''
  return `${dia} de ${nombreMes(mes).toLowerCase()} de ${anio}`
}

export function formatearFechaCorta(iso) {
  const { anio, mes, dia } = desdeISO(iso)
  if (!anio || !mes || !dia) return ''
  return `${dosDigitos(dia)}/${dosDigitos(mes)}/${anio}`
}

export function hoyISO() {
  const ahora = new Date()
  return aISO(ahora.getFullYear(), ahora.getMonth() + 1, ahora.getDate())
}

// creadoEn viaja como OffsetDateTime, por lo que sí incluye zona horaria.
export function formatearFechaHora(valor) {
  if (!valor) return ''
  const fecha = new Date(valor)
  if (Number.isNaN(fecha.getTime())) return ''
  return fecha.toLocaleString('es-GT', { dateStyle: 'medium', timeStyle: 'short' })
}
