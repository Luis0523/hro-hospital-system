import Icon from '@/shared/components/ui/Icon.jsx'

export function pruebaAudioHabilitada(env = import.meta.env) {
  return env.DEV === true
}

export default function PruebaAudioLlamado({ habilitado = false, onProbar }) {
  if (!habilitado) return null

  return (
    <button
      type="button"
      onClick={onProbar}
      aria-label="Probar audio de llamado"
      className="inline-flex items-center gap-2 rounded-full border border-on-primary/30 bg-on-primary/10 px-3 py-1 text-label-md text-on-primary transition hover:bg-on-primary/20 focus:outline-none focus:ring-2 focus:ring-on-primary/60"
    >
      <Icon name="volume_up" className="text-[18px]" />
      Probar audio 55 → 3
    </button>
  )
}
