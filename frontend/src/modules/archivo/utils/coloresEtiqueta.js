// Clases estáticas por color de etiqueta. Deben estar escritas completas para
// que Tailwind las incluya en el build (no se pueden construir dinámicamente).
export const CLASES_COLOR_ETIQUETA = {
  primary: {
    seleccionada: 'border-primary bg-primary/10 text-primary ring-2 ring-primary/30',
    chip: 'bg-primary/10 text-primary',
  },
  rose: {
    seleccionada:
      'border-rose-400 bg-rose-50 text-rose-700 ring-2 ring-rose-300 dark:border-rose-700 dark:bg-rose-950/40 dark:text-rose-200',
    chip: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-200',
  },
  blue: {
    seleccionada:
      'border-blue-400 bg-blue-50 text-blue-700 ring-2 ring-blue-300 dark:border-blue-700 dark:bg-blue-950/40 dark:text-blue-200',
    chip: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-200',
  },
  amber: {
    seleccionada:
      'border-amber-400 bg-amber-50 text-amber-800 ring-2 ring-amber-300 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200',
    chip: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200',
  },
  emerald: {
    seleccionada:
      'border-emerald-400 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-300 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200',
    chip: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-200',
  },
  violet: {
    seleccionada:
      'border-violet-400 bg-violet-50 text-violet-700 ring-2 ring-violet-300 dark:border-violet-700 dark:bg-violet-950/40 dark:text-violet-200',
    chip: 'bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-200',
  },
  teal: {
    seleccionada:
      'border-teal-400 bg-teal-50 text-teal-700 ring-2 ring-teal-300 dark:border-teal-700 dark:bg-teal-950/40 dark:text-teal-200',
    chip: 'bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-200',
  },
  slate: {
    seleccionada:
      'border-slate-400 bg-slate-100 text-slate-700 ring-2 ring-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200',
    chip: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  },
}

export function clasesEtiqueta(color, tipo = 'chip') {
  const grupo = CLASES_COLOR_ETIQUETA[color] ?? CLASES_COLOR_ETIQUETA.primary
  return grupo[tipo] ?? grupo.chip
}

export const COLORES_ETIQUETA = Object.keys(CLASES_COLOR_ETIQUETA)
