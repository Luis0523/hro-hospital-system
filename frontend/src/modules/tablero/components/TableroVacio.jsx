import Icon from '@/shared/components/ui/Icon.jsx'

export default function TableroVacio() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <Icon name="event_available" className="text-[72px] text-outline dark:text-slate-500" />
      <h2 className="text-headline-lg uppercase text-on-surface dark:text-slate-100">
        No hay consultorios con turnos activos
      </h2>
      <p className="text-body-lg text-on-surface-variant dark:text-slate-300">
        El tablero se actualizará automáticamente cuando comience la atención.
      </p>
    </div>
  )
}
