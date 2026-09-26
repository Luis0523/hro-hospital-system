import Icon from '@/shared/components/ui/Icon.jsx'
import { calcularEdad, formatearFechaLarga } from '@/shared/utils/fecha'

function Dato({ etiqueta, valor, className = '' }) {
  return (
    <div className={className}>
      <dt className="text-on-surface-variant">{etiqueta}</dt>
      <dd className="truncate font-semibold text-on-surface">{valor || '—'}</dd>
    </div>
  )
}

export default function FichaPaciente({ paciente, cita, onQuitar }) {
  if (!paciente) return null

  const edad = calcularEdad(paciente.fechaNacimiento)

  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-low p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-secondary-fixed text-on-secondary-container">
          <Icon name="person" className="text-[24px]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-headline-sm text-on-surface">
            {paciente.nombres} {paciente.apellidos}
          </p>
          <p className="flex items-center gap-1 text-title-sm text-primary">
            <Icon name="badge" className="text-[16px]" />
            Expediente {paciente.numeroExpediente}
          </p>
        </div>
        {onQuitar && (
          <button
            type="button"
            onClick={onQuitar}
            aria-label="Quitar paciente"
            className="rounded-md p-1 text-on-surface-variant hover:bg-surface-container"
          >
            <Icon name="close" className="text-[18px]" />
          </button>
        )}
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-body-sm sm:grid-cols-3">
        <Dato etiqueta="DPI" valor={paciente.dpi} />
        <Dato etiqueta="Edad" valor={edad != null ? `${edad} años` : null} />
        <Dato etiqueta="Sexo" valor={paciente.sexo} />
        <Dato etiqueta="Teléfono" valor={paciente.telefono} />
        <Dato
          etiqueta="Dirección"
          valor={paciente.direccion}
          className="col-span-2 sm:col-span-3"
        />
      </dl>

      {cita && (
        <div className="mt-3 rounded-lg bg-surface-container-lowest p-3">
          <p className="text-label-sm uppercase tracking-wider text-on-surface-variant">
            Cita del día
          </p>
          <p className="text-title-sm text-on-surface">
            {cita.clinicaNombre} • {cita.medicoNombre}
          </p>
          <p className="text-body-sm text-on-surface-variant">
            {formatearFechaLarga(cita.fechaCita)} · Hora estimada{' '}
            {cita.horaEstimada ? cita.horaEstimada.slice(0, 5) : 'sin hora estimada'}
          </p>
        </div>
      )}
    </div>
  )
}
