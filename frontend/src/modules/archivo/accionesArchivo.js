// Acciones del OPERADOR DE ARCHIVO por estado del ciclo.
//
// Fuente de verdad de la matriz: contrato backend Fase 1.
// Archivo gobierna: check-in, iniciar-búsqueda, localizar, despachar, archivar,
// no-localizado y reintentar-búsqueda. NO ejecuta entregar/retornar (Enfermería).
//
// `sin_ciclo` no es un estado del ciclo sino de la jornada; se incluye aquí para
// habilitar el check-in cuando la fila tiene expediente físico.

export const ACCIONES_ARCHIVO = {
  check_in: {
    etiqueta: 'Check-in',
    icono: 'login',
    variante: 'primary',
  },
  iniciar_busqueda: {
    etiqueta: 'Iniciar búsqueda',
    icono: 'travel_explore',
    variante: 'primary',
  },
  localizar: {
    etiqueta: 'Localizar',
    icono: 'inventory_2',
    variante: 'primary',
  },
  no_localizado: {
    etiqueta: 'No localizado',
    icono: 'report',
    variante: 'danger',
    requiereObservacion: true,
  },
  reintentar_busqueda: {
    etiqueta: 'Reintentar búsqueda',
    icono: 'refresh',
    variante: 'primary',
  },
  despachar: {
    etiqueta: 'Despachar',
    icono: 'local_shipping',
    variante: 'primary',
  },
  archivar: {
    etiqueta: 'Archivar',
    icono: 'inventory',
    variante: 'primary',
  },
}

const MATRIZ_ACCIONES = {
  sin_ciclo: ['check_in'],
  pendiente_localizar: ['iniciar_busqueda'],
  en_busqueda: ['localizar', 'no_localizado'],
  no_localizado: ['reintentar_busqueda'],
  localizado: ['despachar'],
  en_transito_entrega: [],
  entregado: [],
  en_transito_retorno: ['archivar'],
  archivado: [],
}

// Devuelve una acción con su id a partir de la matriz (id + metadatos).
export function accionArchivo(id) {
  return { id, ...ACCIONES_ARCHIVO[id] }
}

// Devuelve las acciones válidas (id + metadatos) para un estado del ciclo.
export function accionesParaEstado(estado) {
  return (MATRIZ_ACCIONES[estado] ?? []).map(accionArchivo)
}

// Estados sin acción de Archivo: la pelota está en Enfermería o el ciclo cerró.
export const MENSAJES_SIN_ACCION = {
  en_transito_entrega: 'Esperando recepción en COEX',
  entregado: 'En COEX',
  archivado: 'Ciclo cerrado (archivado)',
}

export function mensajeSinAccion(estado) {
  return MENSAJES_SIN_ACCION[estado] ?? null
}
