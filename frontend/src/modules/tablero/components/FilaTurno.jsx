function formatearTurno(valor) {
  return typeof valor === 'number' && Number.isFinite(valor) && valor > 0
    ? `#${String(valor).padStart(3, '0')}`
    : '—'
}

export default function FilaTurno({ asignacion }) {
  const { asignacionDiariaEspacioId, espacioNumero, turnoActual, turnoSiguiente, turnosEnEspera } =
    asignacion
  const cola = Array.isArray(turnosEnEspera) ? turnosEnEspera : []

  return (
    <tr data-testid={`fila-turno-${asignacionDiariaEspacioId}`} className="align-middle">
      <td className="px-2 py-2 text-center align-middle md:px-4 md:py-3 2xl:py-5">
        <span className="text-[clamp(3rem,4.5vw,10rem)] font-bold leading-none tabular-nums text-primary dark:text-sky-400">
          {formatearTurno(turnoActual)}
        </span>
      </td>

      <td className="px-2 py-2 text-center align-middle md:px-4 md:py-3 2xl:py-5">
        <span className="text-[clamp(2.25rem,3.5vw,7rem)] font-bold leading-none tabular-nums text-on-surface dark:text-slate-100">
          {espacioNumero ?? '—'}
        </span>
      </td>

      <td className="px-2 py-2 text-center align-middle md:px-4 md:py-3 2xl:py-5">
        <span className="text-[clamp(1.75rem,2.5vw,4.5rem)] font-bold leading-none tabular-nums text-on-surface-variant dark:text-slate-300">
          {formatearTurno(turnoSiguiente)}
        </span>
      </td>

      <td className="px-2 py-2 text-center align-middle md:px-4 md:py-3 2xl:py-5">
        {cola.length > 0 ? (
          <ul
            data-testid={`cola-turno-${asignacionDiariaEspacioId}`}
            className="flex flex-wrap items-center justify-center gap-1 md:gap-2"
          >
            {cola.map((numero) => (
              <li
                key={numero}
                className="rounded-lg bg-surface-container px-2 py-0.5 text-[clamp(1.25rem,1.75vw,3rem)] font-bold leading-tight tabular-nums text-primary dark:bg-slate-800 dark:text-sky-400"
              >
                {formatearTurno(numero)}
              </li>
            ))}
          </ul>
        ) : (
          <span className="text-[clamp(1.75rem,2.5vw,4.5rem)] font-bold leading-none tabular-nums text-on-surface-variant dark:text-slate-300">
            —
          </span>
        )}
      </td>
    </tr>
  )
}
