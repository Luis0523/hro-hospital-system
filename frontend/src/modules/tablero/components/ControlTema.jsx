import Icon from '@/shared/components/ui/Icon.jsx'

export default function ControlTema({ tema = 'light', onAlternar }) {
  const esOscuro = tema === 'dark'
  const etiqueta = esOscuro ? 'Modo claro' : 'Modo oscuro'

  return (
    <button
      type="button"
      onClick={onAlternar}
      aria-label={etiqueta}
      aria-pressed={esOscuro}
      className="inline-flex items-center gap-2 rounded-full bg-on-primary/15 px-3 py-1 text-label-md text-on-primary transition hover:bg-on-primary/25 focus:outline-none focus:ring-2 focus:ring-on-primary/60"
    >
      <Icon name={esOscuro ? 'light_mode' : 'dark_mode'} className="text-[18px]" />
      {etiqueta}
    </button>
  )
}
