import Icon from '@/shared/components/ui/Icon.jsx'
import { metadatosEstado } from '../estadosExpediente'

export default function ExpedienteCard({ expediente, activo = false, onSeleccionar }) {
  const meta = metadatosEstado(expediente.estado)
  const esNuevo = expediente.expedienteNuevo

  return (
    <button
      type="button"
      aria-pressed={activo}
      onClick={() => onSeleccionar?.(expediente)}
      className={`w-full rounded-2xl border bg-white p-4 text-left shadow-sm transition active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hro-blue ${
        activo
          ? 'border-hro-blue ring-1 ring-hro-blue'
          : 'border-slate-200 hover:border-hro-celeste'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-title-md text-on-surface">{expediente.pacienteNombre}</p>
          <p className="mt-0.5 flex items-center gap-1 text-body-sm text-on-surface-variant">
            <Icon name="badge" className="text-[16px]" />
            {esNuevo ? 'Sin expediente físico' : expediente.numeroExpediente}
          </p>
        </div>
        {esNuevo ? (
          <span className="shrink-0 rounded bg-amber-100 px-2.5 py-0.5 text-label-sm font-semibold text-amber-800">
            Expediente nuevo
          </span>
        ) : (
          <span
            className={`inline-flex shrink-0 items-center gap-1 rounded px-2.5 py-0.5 text-label-sm font-semibold ${meta.color}`}
          >
            <Icon name={meta.icono} className="text-[14px]" />
            {meta.etiqueta}
          </span>
        )}
      </div>

      <dl className="mt-3 grid grid-cols-1 gap-1 text-body-sm text-on-surface-variant">
        <div className="flex items-center gap-1.5">
          <Icon name="local_hospital" className="text-[16px] text-primary" />
          <span className="truncate">{expediente.clinicaNombre}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Icon name="stethoscope" className="text-[16px] text-primary" />
          <span className="truncate">{expediente.medicoNombre}</span>
        </div>
        {expediente.ubicacion && (
          <div className="flex items-center gap-1.5">
            <Icon name="shelves" className="text-[16px] text-primary" />
            <span className="truncate">{expediente.ubicacion}</span>
          </div>
        )}
      </dl>

      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-label-sm text-on-surface-variant">
        <span>{expediente.horaEstimada?.slice(0, 5)}</span>
        <span className="flex items-center gap-1 font-semibold text-hro-blue">
          {esNuevo ? 'Preparar expediente' : 'Ver trazabilidad'}
          <Icon name="chevron_right" className="text-[16px]" />
        </span>
      </div>
    </button>
  )
}
