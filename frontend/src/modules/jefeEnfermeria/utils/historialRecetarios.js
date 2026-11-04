const CLAVE = 'hro_recetario_historial'
const LIMITE = 50

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

/** Historial de recetarios impresos, del más reciente al más antiguo. */
export function leerHistorialRecetarios() {
  return leerCrudo().filter((entrada) => entrada?.solicitud?.paciente)
}

/**
 * Guarda una copia inmutable de la solicitud impresa. No se edita desde el
 * historial: solo se consulta y se reimprime.
 */
export function agregarAlHistorial({ solicitud, formato, generadoEn }) {
  const paciente = solicitud?.paciente
  if (!paciente) return leerHistorialRecetarios()

  const entrada = {
    id: `recetario-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    generadoEn: generadoEn ?? new Date().toISOString(),
    formato,
    expediente: String(paciente.numeroExpediente ?? '').trim(),
    pacienteNombre: [paciente.nombres, paciente.apellidos].filter(Boolean).join(' ').trim(),
    solicitud: JSON.parse(JSON.stringify(solicitud)),
  }

  const siguiente = [entrada, ...leerHistorialRecetarios()].slice(0, LIMITE)
  escribir(siguiente)
  return siguiente
}

export function limpiarHistorialRecetarios() {
  escribir([])
  return []
}
