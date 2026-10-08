import Icon from '@/shared/components/ui/Icon.jsx'

// Indicador del estado de la conexión del feed en vivo.
const ESTADOS = {
  en_vivo: {
    etiqueta: 'En vivo',
    color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200',
    punto: 'bg-emerald-500',
    icono: 'sensors',
  },
  reconectando: {
    etiqueta: 'Reconectando',
    color: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200',
    punto: 'bg-amber-500',
    icono: 'sync',
  },
  simulado: {
    etiqueta: 'Simulado',
    color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-500/20 dark:text-cyan-200',
    punto: 'bg-cyan-500',
    icono: 'science',
  },
  detenido: {
    etiqueta: 'Detenido',
    color: 'bg-surface-container text-on-surface-variant',
    punto: 'bg-slate-400',
    icono: 'pause_circle',
  },
}

export default function IndicadorConexion({ estado = 'detenido', onReconectar }) {
  const info = ESTADOS[estado] ?? ESTADOS.detenido

  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-label-sm ${info.color}`}
        aria-label={`Conexión: ${info.etiqueta}`}
      >
        <span className={`inline-block h-2 w-2 rounded-full ${info.punto}`} aria-hidden="true" />
        <Icon name={info.icono} className="text-[16px]" />
        {info.etiqueta}
      </span>

      {onReconectar && estado !== 'en_vivo' && (
        <button
          type="button"
          onClick={onReconectar}
          className="rounded-lg px-2 py-1 text-label-sm font-semibold text-primary transition hover:bg-surface-container focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hro-blue"
        >
          Reconectar
        </button>
      )}
    </div>
  )
}
