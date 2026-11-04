import { ETAPAS_VISIBLES } from '../../api/seguimientoApi'
import { estiloDeEtapa } from './estilosEtapas'

const ETIQUETAS_ETAPA = {
  registrado: 'Registrar',
  en_clinica: 'Recibir/Repartir',
}

// Pestañas superiores con el conteo por etapa. Sustituyen a la barra
// lateral de "Flujo de seguimiento" en la variante touch.
export default function PestanasEtapas({ conteos, filtro, onFiltrar }) {
  return (
    <nav
      aria-label="Etapas del flujo de seguimiento"
      data-testid="pestanas-etapas"
      className="flex shrink-0 items-stretch gap-1 overflow-x-auto border-b border-outline-variant bg-surface-container-lowest px-2 py-1.5"
    >
      {ETAPAS_VISIBLES.map((etapa) => {
        const estilo = estiloDeEtapa(etapa.id)
        const activa = filtro === etapa.id
        const etiqueta = ETIQUETAS_ETAPA[etapa.id] ?? etapa.nombre
        return (
          <button
            key={etapa.id}
            type="button"
            title={`${etapa.nombre}: ${conteos[etapa.id] ?? 0} turnos`}
            data-testid={`etapa-${etapa.id}`}
            aria-pressed={activa}
            onClick={() => onFiltrar(activa ? null : etapa.id)}
            onKeyDown={(evento) => {
              if (evento.key !== 'Enter') return
              evento.preventDefault()
              onFiltrar(activa ? null : etapa.id)
            }}
            className={`flex min-h-12 min-w-0 flex-1 items-center justify-between gap-2 rounded-lg border-2 px-3 py-1.5 text-left transition touch-manipulation select-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hro-blue active:scale-[0.98] ${estilo.borde} ${
              activa
                ? 'bg-primary-container text-on-primary ring-2 ring-primary'
                : 'bg-surface-container-lowest hover:bg-surface-container-low'
            }`}
          >
            <span className="flex min-w-0 items-center gap-2">
              <span
                className={`h-2.5 w-2.5 shrink-0 rounded-sm ${activa ? 'bg-on-primary' : estilo.punto}`}
                aria-hidden="true"
              />
              <span className="truncate text-label-md font-bold">{etiqueta}</span>
            </span>
            <span
              className={`shrink-0 rounded-md px-2 py-0.5 text-label-md font-black tabular-nums ${
                activa ? 'bg-on-primary/20 text-on-primary' : estilo.fondo
              } ${activa ? '' : estilo.texto}`}
            >
              {conteos[etapa.id] ?? 0}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
