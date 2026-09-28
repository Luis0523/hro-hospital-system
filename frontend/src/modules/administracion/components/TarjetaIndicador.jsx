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
      <div
        className={`flex h-full flex-col gap-3 rounded-lg border border-outline-variant/60 bg-surface-container-lowest p-4 shadow-sm ${className}`}
      >
        <div className="flex items-center gap-2">
          {icono && <Icon name={icono} className="text-[22px] text-primary" />}
          <h3 className="text-headline-sm text-on-surface">{titulo}</h3>
        </div>

        {descripcion && <p className="text-sm text-on-surface-variant">{descripcion}</p>}

        <div className="flex-1 text-sm text-on-surface-variant">{children}</div>

        {accion && <div className="pt-1">{accion}</div>}
      </div>
    </div>
  )
}
