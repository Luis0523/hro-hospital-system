import Card from '@/shared/components/ui/Card.jsx'
import Icon from '@/shared/components/ui/Icon.jsx'

// Tarjeta de indicador del Dashboard de Archivo. Presentacional: recibe el
// valor ya formateado y no consulta APIs. La variante `excepcion` resalta el
// estado `no_localizado` con el color de error del tema.
const VARIANTES = {
  normal: {
    contenedor: '',
    icono: 'text-primary',
    valor: 'text-on-surface',
  },
  excepcion: {
    contenedor: 'border-error/50',
    icono: 'text-error',
    valor: 'text-error',
  },
}

export default function TarjetaMetrica({
  etiqueta,
  valor,
  icono,
  variante = 'normal',
  detalle,
  testId,
}) {
  const tono = VARIANTES[variante] ?? VARIANTES.normal

  return (
    <div data-testid={testId} role="group" aria-label={`${etiqueta}: ${valor}`} className="h-full">
      <Card className={`flex h-full flex-col gap-2 ${tono.contenedor}`}>
        <div className="flex items-center gap-2">
          {icono && <Icon name={icono} className={`text-[22px] ${tono.icono}`} />}
          <p className="text-label-md uppercase tracking-wide text-on-surface-variant">
            {etiqueta}
          </p>
        </div>

        <p className={`text-metric-display ${tono.valor}`}>{valor}</p>

        {detalle && <p className="text-body-sm text-on-surface-variant">{detalle}</p>}
      </Card>
    </div>
  )
}
