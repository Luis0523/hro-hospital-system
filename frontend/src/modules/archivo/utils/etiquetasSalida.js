/** Etiqueta de una salida con compatibilidad para el campo histórico esClinicaMujer. */
export function etiquetaDeSalida(salida) {
  if (salida?.etiqueta) return salida.etiqueta
  if (salida?.esClinicaMujer) {
    return {
      id: 'clinica_mujer',
      codigo: 'clinica_mujer',
      nombre: 'Clínica de la Mujer',
      icono: 'female',
      color: 'rose',
    }
  }
  return null
}

/**
 * Totales por etiqueta a partir de las salidas del listado. Funciona también
 * con backends que todavía no devuelven el resumen por estación.
 */
export function contarEtiquetasSalidas(salidas) {
  const mapa = new Map()
  for (const salida of salidas ?? []) {
    const etiqueta = etiquetaDeSalida(salida)
    const nombre = etiqueta?.nombre ?? 'Sin etiqueta'
    const codigo = etiqueta?.codigo ?? null
    const color = etiqueta?.color ?? 'slate'
    const clave = codigo ?? nombre
    const actual = mapa.get(clave) ?? { etiqueta: nombre, codigo, color, total: 0 }
    actual.total += 1
    mapa.set(clave, actual)
  }
  return [...mapa.values()].sort((a, b) => {
    if (a.codigo == null && b.codigo != null) return 1
    if (a.codigo != null && b.codigo == null) return -1
    return a.etiqueta.localeCompare(b.etiqueta, 'es')
  })
}

/** Agrupa los totales por etiqueta de cada estación a partir de las salidas. */
export function agruparEtiquetasPorEstacion(salidas) {
  const grupos = new Map()
  for (const salida of salidas ?? []) {
    const clave = salida.estacionId ?? 'sin-estacion'
    const lista = grupos.get(clave) ?? []
    lista.push(salida)
    grupos.set(clave, lista)
  }
  const resultado = new Map()
  for (const [clave, lista] of grupos) {
    resultado.set(clave, contarEtiquetasSalidas(lista))
  }
  return resultado
}
