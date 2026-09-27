import Icon from '@/shared/components/ui/Icon.jsx'

export default function TarjetaSala({ item, onClick }) {
  const asignada = Boolean(item.asignacionId)

  return (
    <button
      type="button"
      onClick={() => onClick(item)}
      data-testid={`sala-${item.numero}`}
      className={`flex flex-col gap-2 rounded-xl border p-3 text-left shadow-card transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container ${
        asignada
          ? 'border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low'
          : 'border-dashed border-outline bg-surface-container-low hover:bg-surface-container'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-container text-on-primary">
            <Icon name="meeting_room" className="text-[20px]" />
          </span>
          <span className="text-title-md font-semibold text-on-surface">Sala {item.numero}</span>
        </span>
        <span
          className={`rounded px-2 py-0.5 text-label-sm font-semibold ${
            asignada
              ? 'bg-secondary-fixed text-on-secondary-container'
              : 'bg-surface-container-high text-on-surface-variant'
          }`}
        >
          {asignada ? 'Asignada' : 'Sin asignar'}
        </span>
      </div>

      <div className="min-h-[2.5rem] text-body-sm">
        {asignada ? (
          <>
            <p className="font-semibold text-on-surface">{item.subespecialidadNombre}</p>
            <p className="text-on-surface-variant">{item.especialidadNombre}</p>
          </>
        ) : (
          <p className="text-on-surface-variant">Clic para asignar una subespecialidad</p>
        )}
      </div>

      <p className="text-label-sm uppercase tracking-wide text-on-surface-variant">
        Nivel {item.nivel}
        {item.capacidadCamillas > 1 ? ` · ${item.capacidadCamillas} camillas` : ''}
      </p>
    </button>
  )
}
