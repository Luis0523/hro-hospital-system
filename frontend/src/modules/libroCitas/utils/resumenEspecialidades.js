import { ESPECIALIDADES } from '../api/catalogos'

// Orden determinista según el catálogo de especialidades (no alfabético).
const ORDEN = new Map(ESPECIALIDADES.map((especialidad, indice) => [String(especialidad.id), indice]))

/**
 * Deriva el resumen por especialidad a partir de las filas capturadas.
 * Solo incluye especialidades presentes. No muta las filas.
 */
export function resumirPorEspecialidad(filas = []) {
  const conteos = new Map()

  for (const fila of filas) {
    const clave = String(fila.especialidadId)
    const existente = conteos.get(clave)
    if (existente) {
      existente.cantidad += 1
    } else {
      conteos.set(clave, {
        especialidadId: fila.especialidadId,
        especialidadNombre: fila.especialidadNombre,
        cantidad: 1,
      })
    }
  }

  return [...conteos.values()].sort((a, b) => {
    const ordenA = ORDEN.get(String(a.especialidadId)) ?? Number.MAX_SAFE_INTEGER
    const ordenB = ORDEN.get(String(b.especialidadId)) ?? Number.MAX_SAFE_INTEGER
    return ordenA - ordenB
  })
}
