// Metadatos de presentación de los estados del expediente físico.
// Solo etiquetas, colores y orden visual. No contiene reglas de negocio
// ni valida transiciones: esa lógica es responsabilidad del backend.
//
// Los literales son EXACTAMENTE los del backend (snake_case) y no deben
// traducirse ni agruparse: la UI habilita acciones según el estado real.

export const ESTADOS_EXPEDIENTE = {
  pendiente_localizar: {
    etiqueta: 'Pendiente de localizar',
    descripcion: 'La cita existe, pero el expediente aún no se ha buscado.',
    color: 'bg-slate-100 text-slate-700',
    punto: 'bg-slate-400',
    icono: 'search',
    excepcion: false,
  },
  en_busqueda: {
    etiqueta: 'En búsqueda',
    descripcion: 'El personal marcó que está buscando el expediente.',
    color: 'bg-cyan-100 text-cyan-800',
    punto: 'bg-cyan-500',
    icono: 'travel_explore',
    excepcion: false,
  },
  localizado: {
    etiqueta: 'Localizado',
    descripcion: 'El expediente fue encontrado físicamente.',
    color: 'bg-sky-100 text-sky-800',
    punto: 'bg-sky-500',
    icono: 'inventory_2',
    excepcion: false,
  },
  en_transito_entrega: {
    etiqueta: 'En tránsito a COEX',
    descripcion: 'El expediente va camino a la consulta externa.',
    color: 'bg-blue-100 text-blue-800',
    punto: 'bg-blue-600',
    icono: 'local_shipping',
    excepcion: false,
  },
  entregado: {
    etiqueta: 'Entregado',
    descripcion: 'El expediente ya está en el destino, listo para la consulta.',
    color: 'bg-emerald-100 text-emerald-800',
    punto: 'bg-emerald-500',
    icono: 'check_circle',
    excepcion: false,
  },
  en_transito_retorno: {
    etiqueta: 'En retorno',
    descripcion: 'El expediente regresa al archivo tras la atención.',
    color: 'bg-indigo-100 text-indigo-800',
    punto: 'bg-indigo-500',
    icono: 'keyboard_return',
    excepcion: false,
  },
  archivado: {
    etiqueta: 'Archivado',
    descripcion: 'El expediente fue guardado en su ubicación. Fin del ciclo.',
    color: 'bg-slate-100 text-slate-800',
    punto: 'bg-slate-600',
    icono: 'inventory',
    excepcion: false,
  },
  no_localizado: {
    etiqueta: 'No localizado',
    descripcion: 'No se encontró el expediente; requiere atención inmediata.',
    color: 'bg-red-100 text-red-700',
    punto: 'bg-red-500',
    icono: 'error',
    excepcion: true,
  },
  // No es un estado del ciclo, sino de la jornada: la cita aún no tiene ciclo.
  sin_ciclo: {
    etiqueta: 'Sin ciclo',
    descripcion: 'La cita todavía no tiene un ciclo de expediente iniciado.',
    color: 'bg-amber-100 text-amber-800',
    punto: 'bg-amber-500',
    icono: 'pending_actions',
    excepcion: false,
  },
}

// Orden visual de la secuencia normal. Quedan fuera `no_localizado` (excepción)
// y `sin_ciclo` (no es un estado del ciclo).
export const ORDEN_ESTADOS = [
  'pendiente_localizar',
  'en_busqueda',
  'localizado',
  'en_transito_entrega',
  'entregado',
  'en_transito_retorno',
  'archivado',
]

const METADATOS_POR_DEFECTO = {
  etiqueta: 'Estado desconocido',
  descripcion: '',
  color: 'bg-slate-100 text-slate-600',
  punto: 'bg-slate-300',
  icono: 'help',
  excepcion: false,
}

export function metadatosEstado(estado) {
  return ESTADOS_EXPEDIENTE[estado] ?? METADATOS_POR_DEFECTO
}
