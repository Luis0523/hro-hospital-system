import { etiquetaEstado, normalizarEstado } from '../api/doctorMappers'

const ESTILOS = {
  en_espera:
    'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200',
  llamado:
    'border-sky-300 bg-sky-50 text-sky-900 dark:border-sky-700 dark:bg-sky-950 dark:text-sky-200',
  no_responde:
    'border-red-300 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-950 dark:text-red-200',
  atendido:
    'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-200',
  reintegrado:
    'border-violet-300 bg-violet-50 text-violet-900 dark:border-violet-700 dark:bg-violet-950 dark:text-violet-200',
  desconocido: 'border-outline-variant bg-surface-container text-on-surface-variant',
}

export default function EstadoTurnoBadge({ estado }) {
  const clave = normalizarEstado(estado)

  return (
    <span
      className={`inline-flex min-h-[32px] items-center rounded-lg border px-3 py-1 text-sm font-semibold ${ESTILOS[clave] ?? ESTILOS.desconocido}`}
    >
      {etiquetaEstado(clave)}
    </span>
  )
}
