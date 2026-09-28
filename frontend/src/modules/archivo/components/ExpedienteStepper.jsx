import Icon from '@/shared/components/ui/Icon.jsx'
import { metadatosEstado, ORDEN_ESTADOS } from '../estadosExpediente'

export default function ExpedienteStepper({ estado }) {
  const metaActual = metadatosEstado(estado)

  if (metaActual.excepcion) {
    return (
      <div
        role="alert"
        className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-red-700"
      >
        <Icon name={metaActual.icono} className="text-[20px]" />
        <span className="text-title-sm font-semibold">{metaActual.etiqueta}</span>
      </div>
    )
  }

  const indiceActual = ORDEN_ESTADOS.indexOf(estado)

  return (
    <ol
      aria-label="Trazabilidad del expediente"
      className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-1"
    >
      {ORDEN_ESTADOS.map((paso, indice) => {
        const meta = metadatosEstado(paso)
        const alcanzado = indice <= indiceActual
        const actual = indice === indiceActual
        return (
          <li
            key={paso}
            aria-current={actual ? 'step' : undefined}
            className="flex flex-1 items-center gap-2 sm:flex-col sm:items-center sm:gap-1 sm:text-center"
          >
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white ${
                alcanzado ? meta.punto : 'bg-slate-200'
              }`}
            >
              <Icon name={alcanzado ? 'check' : meta.icono} className="text-[16px]" />
            </span>
            <span
              className={`text-body-sm ${
                actual ? 'font-semibold text-on-surface' : 'text-on-surface-variant'
              }`}
            >
              {meta.etiqueta}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
