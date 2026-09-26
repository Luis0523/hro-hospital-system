function formatearTurno(valor) {
  return typeof valor === 'number' && Number.isFinite(valor) && valor > 0
    ? `#${String(valor).padStart(3, '0')}`
    : '—'
}

export default function FilaTurno({ asignacion }) {
  const { asignacionDiariaEspacioId, espacioNumero, subespecialidadNombre, turnoActual } =
    asignacion

  return (
    <tr data-testid={`fila-turno-${asignacionDiariaEspacioId}`} className="align-middle">
      <td className="px-2 py-4 md:px-4 md:py-5">
        <h2 className="text-headline-md uppercase tracking-tight text-on-surface dark:text-slate-100">
          {subespecialidadNombre ?? 'Sin subespecialidad'}
        </h2>
      </td>

      <td className="px-2 py-4 md:px-4 md:py-5">
        <span className="text-[clamp(2.25rem,3.5vw,7rem)] font-bold leading-none tabular-nums text-on-surface dark:text-slate-100">
          {espacioNumero ?? '—'}
        </span>
      </td>

      <td className="px-2 py-4 text-right md:px-4 md:py-5">
        <span className="text-[clamp(3rem,4.5vw,10rem)] font-bold leading-none tabular-nums text-primary dark:text-sky-400">
          {formatearTurno(turnoActual)}
        </span>
      </td>
    </tr>
  )
}
