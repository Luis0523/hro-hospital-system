const CLAVE = 'hro_recetario_medicamentos_guardados'

const CAMPOS_MEDICAMENTO = ['nombre', 'dosis', 'via', 'frecuencia']

function texto(valor) {
  return String(valor ?? '')
    .trim()
    .replace(/\s+/g, ' ')
}

function normalizar(valor) {
  return texto(valor).toLowerCase()
}

/** Identidad lógica de un medicamento dentro del catálogo (sin fecha ni cantidades). */
export function claveMedicamento(medicamento) {
  return CAMPOS_MEDICAMENTO.map((campo) => normalizar(medicamento?.[campo])).join('|')
}

function normalizarMedicamento(medicamento) {
  return {
    id: texto(medicamento?.id),
    nombre: texto(medicamento?.nombre),
    dosis: texto(medicamento?.dosis),
    via: texto(medicamento?.via),
    frecuencia: texto(medicamento?.frecuencia),
    favorito: Boolean(medicamento?.favorito),
    usadoEn: medicamento?.usadoEn ?? medicamento?.actualizadoEn ?? null,
    actualizadoEn: medicamento?.actualizadoEn ?? new Date().toISOString(),
  }
}

function esValido(medicamento) {
  return (
    Boolean(medicamento.nombre) &&
    /[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(medicamento.nombre) &&
    Boolean(medicamento.dosis)
  )
}

function leerCrudo() {
  try {
    const crudo = JSON.parse(localStorage.getItem(CLAVE) || '[]')
    return Array.isArray(crudo) ? crudo : []
  } catch {
    return []
  }
}

function escribir(lista) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(lista))
  } catch {
    return
  }
}

function ordenar(lista) {
  return [...lista].sort((a, b) => {
    if (a.favorito !== b.favorito) return a.favorito ? -1 : 1
    const usadoA = a.usadoEn ? new Date(a.usadoEn).getTime() : 0
    const usadoB = b.usadoEn ? new Date(b.usadoEn).getTime() : 0
    if (usadoA !== usadoB) return usadoB - usadoA
    return a.nombre.localeCompare(b.nombre, 'es')
  })
}

/** Medicamentos guardados para reutilizar en futuras solicitudes. */
export function leerMedicamentosGuardados() {
  return ordenar(leerCrudo().map(normalizarMedicamento).filter(esValido))
}

/**
 * Crea o actualiza un medicamento del catálogo. La unicidad se define por
 * nombre + dosis + vía + frecuencia; al repetirse se conserva el mismo id.
 */
export function guardarMedicamentoEnCatalogo(medicamento) {
  const datos = normalizarMedicamento(medicamento)
  if (!esValido(datos)) return leerMedicamentosGuardados()

  const clave = claveMedicamento(datos)
  const lista = leerCrudo().map(normalizarMedicamento).filter(esValido)
  const existente = lista.find((item) => claveMedicamento(item) === clave)

  const nuevo = {
    ...datos,
    id: existente?.id || datos.id || `medicamento-${Date.now()}-${lista.length + 1}`,
    favorito: datos.favorito || Boolean(existente?.favorito),
    usadoEn: new Date().toISOString(),
    actualizadoEn: new Date().toISOString(),
  }

  const siguiente = existente
    ? lista.map((item) => (claveMedicamento(item) === clave ? nuevo : item))
    : [...lista, nuevo]

  escribir(siguiente)
  return ordenar(siguiente)
}

/** Alterna el estado de favorito de un medicamento guardado. */
export function alternarFavorito(id) {
  const siguiente = leerCrudo().map((item) => {
    const normalizado = normalizarMedicamento(item)
    return normalizado.id === id
      ? { ...normalizado, favorito: !normalizado.favorito, actualizadoEn: new Date().toISOString() }
      : normalizado
  })
  escribir(siguiente)
  return ordenar(siguiente.filter(esValido))
}

/** Elimina del catálogo el medicamento con el id indicado. */
export function eliminarMedicamentoDelCatalogo(id) {
  const siguiente = leerCrudo().filter((item) => item?.id !== id)
  escribir(siguiente)
  return ordenar(siguiente.map(normalizarMedicamento).filter(esValido))
}

/** Vacía el catálogo (útil para pruebas o reinicio manual). */
export function limpiarCatalogoMedicamentos() {
  escribir([])
  return []
}
