import { ETAPAS_SEGUIMIENTO } from '../../api/seguimientoApi'
import { estiloDeEtapa } from './estilosEtapas'

// Columna vertical con el conteo por etapa; cada tarjeta funciona como filtro.
export default function EtapasSeguimiento({ conteos, filtro, onFiltrar }) {
  return (
    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 md:flex md:flex-col">
      {ETAPAS_SEGUIMIENTO.map((etapa, indice) => {
        const estilo = estiloDeEtapa(etapa.id)
        const activa = filtro === etapa.id
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
              onFiltrar(etapa.id)
            }}
            className={`min-w-0 rounded-lg border px-2 py-1 text-left transition hover:bg-surface-container-low focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hro-blue ${estilo.borde} ${estilo.fondo} ${
              activa ? 'ring-2 ring-primary' : ''
            }`}
          >
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-[9px] font-bold tracking-wider text-on-surface-variant">
                0{indice + 1} / 0{ETAPAS_SEGUIMIENTO.length}
              </span>
              <span className={`h-1.5 w-1.5 rounded-full ${estilo.punto}`} />
            </div>
            <strong className="mt-0.5 block truncate text-[11px] leading-tight text-on-surface">
              {etapa.nombre}
            </strong>
            <div className="mt-0.5 flex items-baseline gap-1">
              <span className={`text-label-md font-black ${estilo.texto}`}>
                {conteos[etapa.id] ?? 0}
              </span>
              <span className="text-[9px] text-on-surface-variant">turnos</span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
