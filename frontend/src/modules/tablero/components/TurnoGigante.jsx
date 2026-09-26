export default function TurnoGigante({ valor, etiqueta, variante = 'siguiente' }) {
  const tieneTurno = typeof valor === 'number' && Number.isFinite(valor) && valor > 0
  const esActual = variante === 'actual'

  const colorEtiqueta = esActual ? 'text-primary' : 'text-on-surface-variant'
  const colorNumero = esActual ? 'text-primary' : 'text-on-surface'
  const tamano = esActual ? 'text-[clamp(4.5rem,6vw,10rem)]' : 'text-[clamp(2.5rem,3.5vw,4.5rem)]'

  return (
    <div className="flex w-full min-w-0 flex-col items-center gap-2 text-center">
      <span className={`text-label-sm uppercase tracking-[0.25em] ${colorEtiqueta}`}>
        {etiqueta}
      </span>
      <span
        className={`max-w-full whitespace-nowrap font-bold leading-none tabular-nums ${tamano} ${colorNumero} ${
          esActual ? 'drop-shadow-sm' : 'opacity-90'
        }`}
      >
        {tieneTurno ? `#${String(valor).padStart(3, '0')}` : '—'}
      </span>
    </div>
  )
}
