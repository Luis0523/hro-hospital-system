import Icon from '@/shared/components/ui/Icon.jsx'
import { metadatosEstadoCoex } from '../estadosCoex'

// Fila de Mesa COEX. Presentacional: no conoce la API ni avanza estados. Cuando
// `seleccionable` está activo expone un checkbox nativo que informa al padre el
// `cicloId` marcado mediante `onToggle`; en caso contrario se muestra como
// fila de solo lectura (p. ej. la sección "En uso").
export default function FilaExpedienteCoex({
  fila,
  seleccionable = false,
  seleccionada = false,
  onToggle,
}) {
  const meta = metadatosEstadoCoex(fila?.estadoActual)
  const numero = fila?.numeroExpediente || 'Sin número de expediente'
  const hora = fila?.horaEstimada ? fila.horaEstimada.slice(0, 5) : null

  const contenido = (
    <>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <span className="min-w-0 break-words text-title-md font-semibold text-on-surface">{numero}</span>
        <span
          className={`inline-flex max-w-full items-center gap-1 break-words rounded px-2 py-0.5 text-label-sm font-semibold ${meta.color}`}
        >
          <Icon name={meta.icono} className="shrink-0 text-[16px]" />
          {meta.etiqueta}
        </span>
      </div>

      <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-body-sm text-on-surface-variant">
        {fila?.pacienteNombre && <span className="min-w-0 break-words">{fila.pacienteNombre}</span>}
        {fila?.subespecialidadNombre && (
          <span className="flex min-w-0 items-center gap-1">
            <Icon name="specialist" className="text-[16px] text-primary" />
            <span className="min-w-0 break-words">{fila.subespecialidadNombre}</span>
          </span>
        )}
        {hora && (
          <span className="flex shrink-0 items-center gap-1">
            <Icon name="schedule" className="text-[16px] text-primary" />
            {hora}
          </span>
        )}
      </div>
    </>
  )

  return (
    <li className="rounded-lg border border-outline-variant bg-surface-container-lowest p-3">
      {seleccionable ? (
        <label className="flex min-w-0 cursor-pointer items-start gap-1">
          <span className="flex h-11 w-11 shrink-0 items-start justify-center pt-0.5">
            <input
              type="checkbox"
              className="h-6 w-6 cursor-pointer rounded accent-hro-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hro-blue"
              checked={seleccionada}
              onChange={() => onToggle?.(fila?.cicloId)}
              aria-label={`Seleccionar expediente ${numero}`}
            />
          </span>
          <span className="min-w-0 flex-1">{contenido}</span>
        </label>
      ) : (
        contenido
      )}
    </li>
  )
}
