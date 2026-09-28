// Utilidades de presentación para la sección Auditoría.
// El backend expone `valoresAnteriores`/`valoresNuevos` como JSON en texto (String).
// Este módulo NO define catálogos de negocio: las listas de sugerencias son NO
// exhaustivas y provienen únicamente de valores confirmados en backend/docs.

/**
 * Convierte el JSON-en-texto de la auditoría en un valor utilizable, sin lanzar
 * excepciones y sin ejecutar código dinámico (nunca eval/Function).
 *
 * - null / undefined → null
 * - cadena vacía o solo espacios → null
 * - JSON válido (objeto, array, string, número, boolean) → valor parseado
 * - JSON inválido → se conserva el texto original
 */
export function parsearJsonAuditoria(valor) {
  if (valor === null || valor === undefined) return null
  if (typeof valor !== 'string') return valor
  if (valor.trim() === '') return null
  try {
    return JSON.parse(valor)
  } catch {
    return valor
  }
}

// Sugerencias NO exhaustivas (solo ayudan a autocompletar; el campo es libre).
// Acciones documentadas/observadas en el backend.
export const ACCIONES_SUGERIDAS = [
  'crear',
  'actualizar',
  'eliminar',
  'activar',
  'desactivar',
  'reactivar',
]

// Tablas afectadas confirmadas en el código de eventos del backend.
export const TABLAS_SUGERIDAS = [
  'cita',
  'medico',
  'medico_subespecialidad',
  'especialidad',
  'subespecialidad',
  'espacio_fisico',
  'dia_no_laborable',
  'usuario_referencia',
  'turno',
  'paciente',
  'asignacion_diaria_espacio',
  'cierre_asignacion_diaria',
  'mensaje_hl7_log',
]

const ETIQUETAS_ACCION = {
  crear: 'Crear',
  actualizar: 'Actualizar',
  eliminar: 'Eliminar',
  activar: 'Activar',
  desactivar: 'Desactivar',
  reactivar: 'Reactivar',
}

// Presentación únicamente. No valida ni restringe: si la acción no está mapeada
// se muestra el valor original tal como lo devuelve el backend.
export function etiquetaAccion(valor) {
  if (valor === null || valor === undefined) return ''
  const texto = String(valor)
  return ETIQUETAS_ACCION[texto.toLowerCase()] ?? texto
}

// Presentación únicamente: nombres técnicos de tabla con guiones bajos legibles.
export function formatearTabla(valor) {
  if (valor === null || valor === undefined) return ''
  return String(valor).replace(/_/g, ' ')
}

// El detalle debe mostrar JSON válido de forma legible; el texto inválido se
// conserva tal cual. Devuelve `null` cuando no hay contenido que mostrar.
export function textoDetalleJson(valor) {
  const parseado = parsearJsonAuditoria(valor)
  if (parseado === null) return null
  if (typeof parseado === 'string') return parseado
  try {
    return JSON.stringify(parseado, null, 2)
  } catch {
    return String(valor)
  }
}
