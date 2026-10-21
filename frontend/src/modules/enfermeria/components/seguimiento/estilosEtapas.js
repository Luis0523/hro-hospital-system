// Paleta por etapa. Se usa en tarjetas, casillas del libro y detalle para que
// el color sea consistente en toda la pantalla.
export const ESTILOS_ETAPA = {
  registrado: {
    texto: 'text-sky-600 dark:text-sky-300',
    borde: 'border-sky-500/60',
    fondo: 'bg-sky-500/10',
    punto: 'bg-sky-500',
    barra: 'bg-sky-500',
  },
  recibido: {
    texto: 'text-teal-600 dark:text-teal-300',
    borde: 'border-teal-500/60',
    fondo: 'bg-teal-500/10',
    punto: 'bg-teal-500',
    barra: 'bg-teal-500',
  },
  en_clinica: {
    texto: 'text-violet-600 dark:text-violet-300',
    borde: 'border-violet-500/60',
    fondo: 'bg-violet-500/10',
    punto: 'bg-violet-500',
    barra: 'bg-violet-500',
  },
  devuelto: {
    texto: 'text-amber-600 dark:text-amber-300',
    borde: 'border-amber-500/60',
    fondo: 'bg-amber-500/10',
    punto: 'bg-amber-500',
    barra: 'bg-amber-500',
  },
  archivo: {
    texto: 'text-emerald-600 dark:text-emerald-300',
    borde: 'border-emerald-500/60',
    fondo: 'bg-emerald-500/10',
    punto: 'bg-emerald-500',
    barra: 'bg-emerald-500',
  },
}

export const ESTILO_SIN_REGISTRO = {
  texto: 'text-on-surface-variant',
  borde: 'border-dashed border-outline-variant',
  fondo: 'bg-surface-container-lowest',
  punto: 'bg-outline',
  barra: 'bg-transparent',
}

export function estiloDeEtapa(id) {
  return ESTILOS_ETAPA[id] ?? ESTILO_SIN_REGISTRO
}

// Brillo de las casillas con marca especial (presentación / privado de libertad).
export const ESTILOS_REGISTRO = {
  presentacion:
    'ring-2 ring-cyan-400 shadow-[0_0_12px_2px_rgba(34,211,238,0.75)] dark:ring-cyan-300',
  privado_libertad:
    'ring-2 ring-rose-500 shadow-[0_0_12px_2px_rgba(244,63,94,0.75)] dark:ring-rose-400',
}

export const CHIPS_REGISTRO = {
  presentacion:
    'border-cyan-400/70 bg-cyan-500/15 text-cyan-700 shadow-[0_0_10px_rgba(34,211,238,0.55)] dark:border-cyan-300/60 dark:text-cyan-200',
  privado_libertad:
    'border-rose-400/70 bg-rose-500/15 text-rose-700 shadow-[0_0_10px_rgba(244,63,94,0.55)] dark:border-rose-300/60 dark:text-rose-200',
}

export function estiloRegistro(turno) {
  return ESTILOS_REGISTRO[turno?.tipoRegistro] ?? ''
}

export function etiquetaRegistro(turno) {
  if (turno?.tipoRegistro === 'presentacion') return 'presentación'
  if (turno?.tipoRegistro === 'privado_libertad') return 'privado de libertad'
  return ''
}
