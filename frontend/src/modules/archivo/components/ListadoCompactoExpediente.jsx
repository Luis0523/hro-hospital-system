import Icon from '@/shared/components/ui/Icon.jsx'
import { esExpedienteLocalizado } from '../estadosExpediente'
import {
  ETIQUETAS_CLASIFICACION,
  ESTILOS_CLASIFICACION,
  clasificarExpediente,
} from '../clasificarExpediente'

// Fila operativa de la jornada de Archivo en la UX simplificada.
//
// El operador solo piensa "¿ya encontré físicamente este expediente?": el
// checkbox refleja el estado REAL del backend (localizado o posterior) mediante
// `esExpedienteLocalizado`. No expone estados técnicos, botones de transición,
// stepper ni cicloId. Presentacional: no conoce la API.
export default function ListadoCompactoExpediente({
  expediente,
  resaltado = false,
  procesando = false,
  onToggle,
}) {
  const numero = expediente.numeroExpediente
  const clasificacion = clasificarExpediente(numero)
  const localizado = esExpedienteLocalizado(expediente.estadoActual)
  const hora = expediente.horaEstimada ? expediente.horaEstimada.slice(0, 5) : null
  const tieneExpediente = Boolean(expediente.expedienteId)
  const checkboxDeshabilitado = !tieneExpediente || localizado || procesando

  const clases = resaltado
    ? 'border-amber-400 bg-amber-50 ring-2 ring-amber-300 dark:border-amber-500 dark:bg-amber-500/15 dark:ring-amber-500/60'
    : localizado
      ? 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/40'
      : 'border-outline-variant bg-surface-container-lowest'

  return (
    <li
      data-expediente-id={expediente.id}
      data-resaltado={resaltado ? 'true' : 'false'}
      data-localizado={localizado ? 'true' : 'false'}
      className={`rounded-lg border transition ${clases}`}
    >
      <div className="flex items-start gap-3 p-3">
        {tieneExpediente && (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center">
            <input
              type="checkbox"
              className="h-6 w-6 cursor-pointer rounded accent-hro-blue disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hro-blue"
              checked={localizado}
              disabled={checkboxDeshabilitado}
              onChange={() => onToggle?.(expediente)}
              aria-label={`Localizar expediente ${numero ?? ''}`.trim()}
              title={localizado ? 'Expediente ya localizado' : 'Marcar como localizado'}
            />
          </span>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <span className="min-w-0 break-words text-title-md font-semibold text-on-surface">
              {numero ?? 'Sin número de expediente'}
            </span>
            {clasificacion && (
              <span
                data-clasificacion={clasificacion}
                className={`inline-flex shrink-0 items-center rounded px-2 py-0.5 text-label-sm font-semibold ${ESTILOS_CLASIFICACION[clasificacion]}`}
              >
                {ETIQUETAS_CLASIFICACION[clasificacion]}
              </span>
            )}
            {resaltado && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-label-sm font-semibold text-amber-800 dark:bg-amber-500/20 dark:text-amber-200">
                <Icon name="my_location" className="text-[14px]" />
                Resultado de búsqueda
              </span>
            )}
            {procesando && (
              <span
                role="status"
                aria-label="Procesando"
                className="inline-flex items-center gap-1 text-label-sm text-on-surface-variant"
              >
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-outline-variant border-t-primary-container" />
                Procesando…
              </span>
            )}
          </div>

          <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-0.5 text-body-sm text-on-surface-variant">
            {expediente.pacienteNombre && (
              <span className="min-w-0 break-words">{expediente.pacienteNombre}</span>
            )}
            {expediente.ubicacion && (
              <span className="flex min-w-0 items-center gap-1">
                <Icon name="shelves" className="text-[16px] text-primary" />
                <span className="min-w-0 break-words">{expediente.ubicacion}</span>
              </span>
            )}
            {expediente.subespecialidadNombre && (
              <span className="flex min-w-0 items-center gap-1">
                <Icon name="local_hospital" className="text-[16px] text-primary" />
                <span className="min-w-0 break-words">{expediente.subespecialidadNombre}</span>
              </span>
            )}
            {hora && (
              <span className="flex shrink-0 items-center gap-1">
                <Icon name="schedule" className="text-[16px] text-primary" />
                {hora}
              </span>
            )}
          </div>

          {!tieneExpediente && (
            <p
              role="status"
              className="mt-2 flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1 text-body-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200"
            >
              <Icon name="warning" className="text-[16px]" />
              Cita sin expediente físico: no se puede operar.
            </p>
          )}
        </div>
      </div>
    </li>
  )
}
