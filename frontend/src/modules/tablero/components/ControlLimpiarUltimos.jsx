import Icon from '@/shared/components/ui/Icon.jsx'

export default function ControlLimpiarUltimos({ visible = false, onLimpiar }) {
  if (!visible) return null

  return (
    <button
      type="button"
      onClick={onLimpiar}
      aria-label="Limpiar últimos llamados"
      className="inline-flex items-center gap-2 rounded-full bg-on-primary/15 px-3 py-1 text-label-md text-on-primary transition hover:bg-on-primary/25 focus:outline-none focus:ring-2 focus:ring-on-primary/60"
    >
      <Icon name="clear_all" className="text-[18px]" />
      Limpiar últimos
    </button>
  )
}
