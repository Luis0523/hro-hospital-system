import Card from '@/shared/components/ui/Card.jsx'
import Icon from '@/shared/components/ui/Icon.jsx'

// Componente presentacional: solo compone título, icono, cuerpo y acción.
// No consulta APIs ni conoce reglas de negocio; el estado lo decide el contenedor.
export default function TarjetaIndicador({
  titulo,
  icono,
  descripcion,
  children,
  accion,
  className = '',
  testId,
}) {
  return (
    <div data-testid={testId} className="h-full">
      <Card className={`flex h-full flex-col gap-3 ${className}`}>
        <div className="flex items-center gap-2">
          {icono && <Icon name={icono} className="text-[22px] text-hro-celeste" />}
          <h3 className="text-headline-sm text-slate-700">{titulo}</h3>
        </div>

        {descripcion && <p className="text-sm text-slate-500">{descripcion}</p>}

        <div className="flex-1 text-sm text-slate-600">{children}</div>

        {accion && <div className="pt-1">{accion}</div>}
      </Card>
    </div>
  )
}
