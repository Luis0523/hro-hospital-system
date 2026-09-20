import Card from '@/shared/components/ui/Card.jsx'
import EmptyState from '@/shared/components/ui/EmptyState.jsx'
import Icon from '@/shared/components/ui/Icon.jsx'

export default function SeccionPlaceholder({ titulo, descripcion, icono = 'construction' }) {
  return (
    <section className="space-y-4">
      <header className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-50 text-hro-blue">
          <Icon name={icono} className="text-[24px]" />
        </span>
        <div>
          <h2 className="text-headline-md text-hro-blue">{titulo}</h2>
          {descripcion && <p className="text-sm text-slate-500">{descripcion}</p>}
        </div>
      </header>

      <Card>
        <EmptyState
          title="Funcionalidad en construcción"
          description="Esta sección se habilitará en una fase posterior del Panel de Administración."
        />
      </Card>
    </section>
  )
}
