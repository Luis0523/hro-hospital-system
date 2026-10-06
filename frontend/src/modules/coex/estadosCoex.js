// Metadatos de presentación de los estados del ciclo del expediente vistos por
// Mesa COEX. Solo etiquetas, colores e iconos. NO valida transiciones ni decide
// reglas de negocio: esa responsabilidad es del backend.
//
// Los valores snake_case coinciden exactamente con `estadoActual` del contrato
// del backend (ArchivoService), incluidos `en_transito_entrega`,
// `en_transito_retorno`, `archivado` y `sin_ciclo`, ausentes en la metadata
// histórica de la Estación de Archivo.

export const ESTADOS_COEX = {
  pendiente_localizar: {
    etiqueta: 'Pendiente de localizar',
    color:
      'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
    icono: 'search',
  },
  en_busqueda: {
    etiqueta: 'En búsqueda',
    color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
    icono: 'travel_explore',
  },
  localizado: {
    etiqueta: 'Localizado',
    color: 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200',
    icono: 'inventory_2',
  },
  en_transito_entrega: {
    etiqueta: 'En tránsito a COEX',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    icono: 'local_shipping',
  },
  entregado: {
    etiqueta: 'Recibido en COEX',
    color:
      'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    icono: 'check_circle',
  },
  en_transito_retorno: {
    etiqueta: 'En tránsito de retorno',
    color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    icono: 'undo',
  },
  archivado: {
    etiqueta: 'Archivado',
    color:
      'bg-surface-container text-on-surface-variant',
    icono: 'inventory',
  },
  no_localizado: {
    etiqueta: 'No localizado',
    color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200',
    icono: 'error',
  },
  sin_ciclo: {
    etiqueta: 'Sin ciclo',
    color: 'bg-surface-container text-on-surface-variant',
    icono: 'help',
  },
}

const METADATOS_POR_DEFECTO = {
  etiqueta: 'Estado desconocido',
  color: 'bg-surface-container text-on-surface-variant',
  icono: 'help',
}

// Etiqueta legible para un estado sin metadata: reemplaza guiones bajos.
export function etiquetaEstadoCoex(estado) {
  return metadatosEstadoCoex(estado).etiqueta
}

export function metadatosEstadoCoex(estado) {
  return ESTADOS_COEX[estado] ?? { ...METADATOS_POR_DEFECTO, etiqueta: String(estado ?? '') }
}
