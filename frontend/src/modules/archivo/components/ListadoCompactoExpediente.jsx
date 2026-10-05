import { Button } from '@/shared/components/ui'
import Icon from '@/shared/components/ui/Icon.jsx'
import { metadatosEstado } from '../estadosExpediente'
import { accionesParaEstado, mensajeSinAccion } from '../accionesArchivo'

// Fila operativa de la jornada de Archivo.
//
// Presentacional: no conoce la API. Muestra el estado REAL del ciclo
// (`estadoActual`) y solo las acciones que corresponden al Operador de Archivo
// según la matriz de `accionesArchivo.js`. No usa checkbox reversible.
export default function ListadoCompactoExpediente({
  expediente,
  resaltado = false,
  procesando = false,
  onAccion,
  onVerDetalle,
}) {
  const estado = expediente.estadoActual ?? expediente.estado
  const meta = metadatosEstado(estado)
  const numero = expediente.numeroExpediente
  const hora = expediente.horaEstimada ? expediente.horaEstimada.slice(0, 5) : null
  const tieneExpediente = Boolean(expediente.expedienteId)
  const acciones = tieneExpediente ? accionesParaEstado(estado) : []
  const avisoSinAccion = tieneExpediente ? mensajeSinAccion(estado) : null

  const clases = resaltado
    ? 'border-amber-400 bg-amber-50 ring-2 ring-amber-300 dark:border-amber-500 dark:bg-amber-500/15 dark:ring-amber-500/60'
    : 'border-outline-variant bg-surface-container-lowest'

  return (
    <li
      data-expediente-id={expediente.id}
      data-resaltado={resaltado ? 'true' : 'false'}
      className={`rounded-lg border p-3 transition ${clases}`}
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="min-w-0 break-words text-title-md font-semibold text-on-surface">
          {numero ?? 'Sin número de expediente'}
        </span>
        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded px-2 py-0.5 text-label-sm font-semibold ${meta.color}`}
        >
          <Icon name={meta.icono} className="text-[14px]" />
          {meta.etiqueta}
        </span>
        {resaltado && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-label-sm font-semibold text-amber-800 dark:bg-amber-500/20 dark:text-amber-200">
            <Icon name="my_location" className="text-[14px]" />
            Resultado de búsqueda
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
          Cita sin expediente físico: no se puede operar ni hacer check-in.
        </p>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {acciones.map((accion) => (
          <Button
            key={accion.id}
            variant={accion.variante}
            size="sm"
            disabled={procesando}
            onClick={() => onAccion?.(accion, expediente)}
          >
            <Icon name={accion.icono} className="text-[16px]" />
            {accion.etiqueta}
          </Button>
        ))}

        {tieneExpediente && acciones.length === 0 && avisoSinAccion && (
          <span className="text-body-sm text-on-surface-variant">{avisoSinAccion}</span>
        )}

        <Button variant="ghost" size="sm" onClick={() => onVerDetalle?.(expediente)}>
          <Icon name="visibility" className="text-[16px]" />
          Ver detalle
        </Button>
      </div>
    </li>
  )
}
