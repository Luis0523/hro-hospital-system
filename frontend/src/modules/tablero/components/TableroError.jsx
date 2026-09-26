import Button from '@/shared/components/ui/Button.jsx'
import Icon from '@/shared/components/ui/Icon.jsx'

export default function TableroError({ mensaje, onReintentar }) {
  return (
    <div
      role="alert"
      className="flex flex-1 flex-col items-center justify-center gap-4 text-center"
    >
      <Icon name="cloud_off" className="text-[72px] text-error" />
      <h2 className="text-headline-lg uppercase text-on-surface">No se pudo cargar el tablero</h2>
      <p className="max-w-2xl text-body-lg text-on-surface-variant">
        {mensaje ?? 'Ocurrió un error al obtener el estado inicial.'}
      </p>
      {onReintentar && (
        <Button onClick={onReintentar} className="mt-2">
          Reintentar
        </Button>
      )}
    </div>
  )
}
