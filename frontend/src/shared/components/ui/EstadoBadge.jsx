const estilos = {
  pendiente: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  confirmada: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  atendida: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  atendido: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  cancelada: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200',
  reprogramada: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  no_asistio: 'bg-surface-container text-on-surface-variant',
  en_espera: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  llamado: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  no_responde: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200',
  reintegrado: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
}

export default function EstadoBadge({ estado }) {
  const etiqueta = String(estado ?? '').replace(/_/g, ' ')
  return (
    <span
      className={`inline-block rounded px-2.5 py-0.5 text-label-sm font-semibold capitalize ${
        estilos[estado] ?? 'bg-surface-container text-on-surface-variant'
      }`}
    >
      {etiqueta}
    </span>
  )
}
