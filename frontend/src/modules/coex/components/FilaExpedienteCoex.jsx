import Icon from '@/shared/components/ui/Icon.jsx'
import { metadatosEstadoCoex } from '../estadosCoex'

// Fila de lectura de Mesa COEX. Puramente presentacional: no conoce la API, no
// avanza estados y no ofrece acciones. Fase 1 no incluye checkbox ni botones.
export default function FilaExpedienteCoex({ fila }) {
  const meta = metadatosEstadoCoex(fila?.estadoActual)
  const numero = fila?.numeroExpediente || 'Sin número de expediente'
  const hora = fila?.horaEstimada ? fila.horaEstimada.slice(0, 5) : null

  return (
    <li className="rounded-lg border border-outline-variant bg-surface-container-lowest p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-title-md font-semibold text-on-surface">{numero}</span>
        <span
          className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-label-sm font-semibold ${meta.color}`}
        >
          <Icon name={meta.icono} className="text-[16px]" />
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
    </li>
  )
}
