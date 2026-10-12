import { porcentajeAvance } from '../../utils/limitesCarnets'

// Barra horizontal de avance de una especialidad respecto a su límite.
// Presentacional: `fila` = { nombre, registrados, limite, excedido }.
export default function BarraUmbralCarnet({ fila, maximoSinLimite = 0 }) {
  const tieneLimite = fila.limite != null
  const avance = tieneLimite
    ? porcentajeAvance(fila.registrados, fila.limite)
    : maximoSinLimite > 0
      ? Math.round((fila.registrados / maximoSinLimite) * 100)
      : 0

  const color = fila.excedido ? 'bg-error' : tieneLimite ? 'bg-primary' : 'bg-secondary'
  const texto = tieneLimite ? `${fila.registrados}/${fila.limite}` : String(fila.registrados)
  const aria = tieneLimite
    ? `${fila.nombre}: ${fila.registrados} de ${fila.limite} carnets`
    : `${fila.nombre}: ${fila.registrados} carnets`

  return (
    <li className="space-y-1">
      <div className="flex items-center justify-between gap-3 text-body-sm">
        <span className="min-w-0 truncate text-on-surface">{fila.nombre}</span>
        <span
          className={`shrink-0 tabular-nums ${
            fila.excedido ? 'font-semibold text-error' : 'text-on-surface-variant'
          }`}
        >
          {texto}
        </span>
      </div>
      <div
        role="img"
        aria-label={aria}
        className="h-2.5 w-full overflow-hidden rounded-full bg-surface-container"
      >
        <div className={`h-full rounded-full ${color}`} style={{ width: `${avance}%` }} />
      </div>
    </li>
  )
}
