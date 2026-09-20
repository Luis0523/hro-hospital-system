import Icon from '@/shared/components/ui/Icon.jsx'
import { metadatosEstado, ORDEN_ESTADOS } from '../estadosExpediente'

export default function ResumenEstados({ resumen = {}, total = 0 }) {
  const estados = [...ORDEN_ESTADOS, 'no_localizado']

  return (
    <section
      aria-label="Resumen de expedientes por estado"
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-title-md text-on-surface">
          <Icon name="monitoring" className="text-[20px] text-primary" />
          Resumen del día
        </h2>
        <span className="rounded bg-surface-container px-2 py-0.5 text-label-sm text-on-surface-variant">
          {total} expedientes
        </span>
      </div>

      <ul className="flex flex-wrap gap-2">
        {estados.map((estado) => {
          const meta = metadatosEstado(estado)
          return (
            <li
              key={estado}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-label-md ${meta.color}`}
            >
              <Icon name={meta.icono} className="text-[16px]" />
              <span>{meta.etiqueta}</span>
              <span className="font-bold">{resumen[estado] ?? 0}</span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
