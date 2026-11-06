import { fechaIsoEnGuatemala } from './fechaDepuracionGuatemala'
import { esFechaISOValida } from './periodoDepuracion'

export const MAX_CONCURRENCIA_CONSULTAS = 4
export const ORDEN_HISTORIAL = 'desc'

function instanteRegistro(registro) {
  const instante = Date.parse(registro?.depuradoEn ?? '')
  if (Number.isFinite(instante)) return instante

  if (esFechaISOValida(registro?.fecha)) {
    return Date.parse(`${registro.fecha}T12:00:00-06:00`)
  }

  return Number.NEGATIVE_INFINITY
}

export function claveRegistro(registro) {
  if (registro?.id != null) return `id:${registro.id}`
  return `alt:${registro?.numeroExpediente ?? ''}|${registro?.depuradoEn ?? registro?.fecha ?? ''}`
}

export function ordenarRegistrosDesc(registros = []) {
  return [...registros].sort((a, b) => instanteRegistro(b) - instanteRegistro(a))
}

export function deduplicarRegistros(registros = []) {
  const vistos = new Set()
  return registros.filter((registro) => {
    const clave = claveRegistro(registro)
    if (vistos.has(clave)) return false
    vistos.add(clave)
    return true
  })
}

export function fechaIsoDeRegistro(registro) {
  if (esFechaISOValida(registro?.depuradoEn)) return registro.depuradoEn

  const desdeInstante = registro?.depuradoEn ? fechaIsoEnGuatemala(registro.depuradoEn) : null

  return desdeInstante ?? (esFechaISOValida(registro?.fecha) ? registro.fecha : '')
}

export async function consultarDiasDepuraciones({
  dias = [],
  consultar,
  maxConcurrencia = MAX_CONCURRENCIA_CONSULTAS,
} = {}) {
  const fechas = Array.isArray(dias) ? dias : []
  const resultados = new Array(fechas.length)
  const errores = []
  let cursor = 0

  const limiteTrabajadores = Math.max(
    1,
    Math.min(MAX_CONCURRENCIA_CONSULTAS, Number(maxConcurrencia) || 4, fechas.length || 1),
  )

  async function trabajador() {
    while (cursor < fechas.length) {
      const indice = cursor
      cursor += 1
      try {
        resultados[indice] = await consultar(fechas[indice])
      } catch (error) {
        errores.push({ fecha: fechas[indice], error })
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limiteTrabajadores, fechas.length) }, () => trabajador()),
  )

  const planos = resultados.flatMap((resultado) => (Array.isArray(resultado) ? resultado : []))
  const registros = deduplicarRegistros(ordenarRegistrosDesc(planos))

  return {
    registros,
    errores,
    completo: errores.length === 0,
    diasConsultados: fechas.length,
    diasConError: errores.length,
  }
}
