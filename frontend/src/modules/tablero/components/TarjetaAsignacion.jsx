import Icon from '@/shared/components/ui/Icon.jsx'
import TurnoGigante from './TurnoGigante.jsx'

export default function TarjetaAsignacion({ asignacion }) {
  const { asignacionDiariaEspacioId, espacioNumero, nivel, subespecialidadNombre } = asignacion

  return (
    <article
      data-testid={`asignacion-${asignacionDiariaEspacioId}`}
      aria-label={`Turnos de ${subespecialidadNombre ?? 'consultorio'}`}
      className="flex min-h-[15rem] flex-col gap-3 overflow-hidden rounded-2xl bg-surface-container-lowest p-5 shadow-card ring-1 ring-outline-variant/40 2xl:min-h-[30rem] 2xl:gap-6 2xl:p-8"
    >
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-headline-md uppercase tracking-tight text-on-surface">
            {subespecialidadNombre ?? 'Sin subespecialidad'}
          </h2>
          <p className="mt-1 flex items-center gap-1 text-title-md text-on-surface-variant">
            <Icon name="meeting_room" className="text-[20px] text-secondary" />
            Consultorio {espacioNumero ?? '—'}
          </p>
        </div>
        {typeof nivel === 'number' && (
          <span className="shrink-0 rounded-full bg-surface-container px-3 py-1 text-label-md uppercase text-on-surface-variant">
            Nivel {nivel}
          </span>
        )}
      </header>

      <div className="flex flex-1 flex-col items-center justify-center">
        <TurnoGigante etiqueta="Turno actual" valor={asignacion.turnoActual} variante="actual" />
      </div>

      <div className="flex flex-col items-center rounded-xl bg-surface-container-low px-3 py-2 2xl:py-4">
        <TurnoGigante
          etiqueta="Siguiente turno"
          valor={asignacion.turnoSiguiente}
          variante="siguiente"
        />
      </div>
    </article>
  )
}
