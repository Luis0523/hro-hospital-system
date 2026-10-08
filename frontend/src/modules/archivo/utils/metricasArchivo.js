import { ESTADOS_EXPEDIENTE, ORDEN_ESTADOS } from '../estadosExpediente'

// Cálculos de PRESENTACIÓN para el Dashboard de Archivo. No definen reglas de
// negocio ni recalculan estados: solo agrupan, ordenan y formatean lo que ya
// devolvió el backend (o el mock que imita su contrato).
//
// El orden visual canónico es `ORDEN_ESTADOS`; `no_localizado` (excepción) no
// forma parte de la secuencia y se maneja por separado.

const ESTADOS_LOCALIZACION = ['pendiente_localizar', 'en_busqueda', 'localizado']

// Ordena `porEstado` según ORDEN_ESTADOS y deja al final cualquier estado que
// no pertenezca a la secuencia (p. ej. `no_localizado`), preservando el orden
// de entrada para esos casos.
export function ordenarEstados(porEstado = []) {
  const mapa = new Map(porEstado.map((item) => [item.estado, item]))
  const ordenados = ORDEN_ESTADOS.filter((estado) => mapa.has(estado)).map((estado) =>
    mapa.get(estado),
  )
  const resto = porEstado.filter((item) => !ORDEN_ESTADOS.includes(item.estado))
  return [...ordenados, ...resto]
}

// Separa la secuencia normal de las excepciones (según `metadatosEstado`).
export function separarExcepcion(porEstado = []) {
  const secuencia = []
  const excepcion = []

  for (const item of porEstado) {
    if (ESTADOS_EXPEDIENTE[item.estado]?.excepcion) excepcion.push(item)
    else secuencia.push(item)
  }

  return { secuencia: ordenarEstados(secuencia), excepcion }
}

export function totalEstado(porEstado = [], estado) {
  return porEstado.find((item) => item.estado === estado)?.total ?? 0
}

export function sumarPorEstado(porEstado = []) {
  return porEstado.reduce((total, item) => total + (item.total ?? 0), 0)
}

export function maximoPorEstado(porEstado = []) {
  return porEstado.reduce((maximo, item) => Math.max(maximo, item.total ?? 0), 0)
}

// Porcentaje entero con caso borde de división por cero.
export function porcentaje(valor, total) {
  if (!Number.isFinite(total) || total <= 0) return 0
  return Math.round(((valor ?? 0) / total) * 100)
}

// Tiempo promedio (min) para localizar: media de los estados de localización
// presentes en `permanencia`. Devuelve null si no hay datos.
export function promedioLocalizacion(permanencia = []) {
  const valores = permanencia
    .filter((item) => ESTADOS_LOCALIZACION.includes(item.estado))
    .map((item) => item.minutosPromedio)
    .filter((valor) => Number.isFinite(valor))

  if (valores.length === 0) return null
  return Math.round(valores.reduce((total, valor) => total + valor, 0) / valores.length)
}

export function formatearMinutos(minutos) {
  if (minutos == null || !Number.isFinite(Number(minutos))) return '—'
  const total = Math.max(0, Math.round(Number(minutos)))
  if (total < 60) return `${total} min`
  const horas = Math.floor(total / 60)
  const resto = total % 60
  return resto === 0 ? `${horas} h` : `${horas} h ${resto} min`
}
