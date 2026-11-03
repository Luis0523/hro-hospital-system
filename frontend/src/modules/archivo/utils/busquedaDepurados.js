import { limpiarEntradaExpediente } from './expedienteDepuracion'

export function normalizarBusquedaExpediente(valor) {
  const limpio = limpiarEntradaExpediente(valor).replace(/[\s-]+/g, '')
  if (!/^\d*$/.test(limpio)) return null
  return limpio
}

export function filtrarDepuradosPorExpediente(registros = [], busqueda = '') {
  const termino = normalizarBusquedaExpediente(busqueda) ?? ''
  const lista = Array.isArray(registros) ? registros : []
  if (!termino) return { registros: lista, busquedaActiva: false, totalCoincidencias: lista.length }

  const coincidencias = lista.filter((registro) =>
    String(registro?.numeroExpediente ?? '')
      .replace(/\D/g, '')
      .includes(termino),
  )

  return {
    registros: coincidencias,
    busquedaActiva: true,
    totalCoincidencias: coincidencias.length,
  }
}
