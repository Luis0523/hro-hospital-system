import Icon from '@/shared/components/ui/Icon.jsx'

export default function ControlVoz({ disponible = false, activa = false, onActivar }) {
  if (!disponible) {
    return (
      <span
        role="status"
        className="inline-flex items-center gap-2 rounded-full bg-on-primary/15 px-3 py-1 text-label-md text-on-primary/80"
      >
        <Icon name="volume_off" className="text-[18px]" />
        Voz no disponible
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={onActivar}
      aria-pressed={activa}
      className="inline-flex items-center gap-2 rounded-full bg-on-primary/15 px-3 py-1 text-label-md text-on-primary transition hover:bg-on-primary/25 focus:outline-none focus:ring-2 focus:ring-on-primary/60"
    >
      <Icon name={activa ? 'volume_up' : 'volume_off'} className="text-[18px]" />
      {activa ? 'Voz activa' : 'Activar voz'}
    </button>
  )
}
