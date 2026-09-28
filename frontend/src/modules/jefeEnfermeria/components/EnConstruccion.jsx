import Icon from '@/shared/components/ui/Icon.jsx'

export default function EnConstruccion({ titulo, descripcion, tarea }) {
  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h2 className="text-headline-lg text-on-surface">{titulo}</h2>
        {descripcion && <p className="text-body-md text-on-surface-variant">{descripcion}</p>}
      </header>

      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest p-10 text-center">
        <Icon name="construction" className="text-[36px] text-primary" />
        <p className="text-title-sm text-on-surface">En construcción</p>
        {tarea && <p className="text-body-sm text-on-surface-variant">{tarea}</p>}
      </div>
    </section>
  )
}
