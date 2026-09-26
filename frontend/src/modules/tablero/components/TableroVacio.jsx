import Icon from '@/shared/components/ui/Icon.jsx'

export default function TableroVacio() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <Icon name="event_available" className="text-[72px] text-outline" />
      <h2 className="text-headline-lg uppercase text-on-surface">
        No hay consultorios con turnos activos
      </h2>
      <p className="text-body-lg text-on-surface-variant">
        El tablero se actualizará automáticamente cuando comience la atención.
      </p>
    </div>
  )
}
