import { ETAPAS_SEGUIMIENTO } from '../../api/seguimientoApi'
import { estiloDeEtapa } from './estilosEtapas'

// Franja superior con el conteo por etapa; cada tarjeta funciona como filtro.
export default function EtapasSeguimiento({ conteos, filtro, onFiltrar }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
      {ETAPAS_SEGUIMIENTO.map((etapa, indice) => {
        const estilo = estiloDeEtapa(etapa.id)
        const activa = filtro === etapa.id
        return (
          <button
            key={etapa.id}
            type="button"
            data-testid={`etapa-${etapa.id}`}
            aria-pressed={activa}
            onClick={() => onFiltrar(activa ? null : etapa.id)}
            className={`min-w-0 rounded-xl border p-3 text-left transition hover:-translate-y-0.5 hover:bg-surface-container-low focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hro-blue ${estilo.borde} ${estilo.fondo} ${
              activa ? 'ring-2 ring-primary' : ''
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-label-sm font-bold tracking-widest text-on-surface-variant">
                0{indice + 1} / 05
              </span>
              <span className={`h-2 w-2 rounded-full ${estilo.punto}`} />
            </div>
            <strong className="mt-2 block min-h-[32px] text-title-sm text-on-surface">
              {etapa.nombre}
            </strong>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-metric-sub ${estilo.texto}`}>{conteos[etapa.id] ?? 0}</span>
              <span className="text-label-sm text-on-surface-variant">turnos</span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
