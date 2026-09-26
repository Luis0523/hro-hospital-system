function formatearTurno(valor) {
  return typeof valor === 'number' && Number.isFinite(valor) && valor > 0
    ? `#${String(valor).padStart(3, '0')}`
    : '—'
}

export default function FilaTurno({ asignacion }) {
  const { asignacionDiariaEspacioId, espacioNumero, nivel, subespecialidadNombre, turnoActual } =
    asignacion

  return (
    <tr data-testid={`fila-turno-${asignacionDiariaEspacioId}`} className="align-middle">
      <td className="px-4 py-4 md:px-6 md:py-5">
        <h2 className="text-headline-md uppercase tracking-tight text-on-surface">
          {subespecialidadNombre ?? 'Sin subespecialidad'}
        </h2>
      </td>

      <td className="px-4 py-4 md:px-6 md:py-5">
        <div className="flex flex-col">
          <span className="text-[clamp(2.25rem,3.5vw,4.5rem)] font-bold leading-none tabular-nums text-on-surface">
            {espacioNumero ?? '—'}
          </span>
          {typeof nivel === 'number' && (
            <span className="mt-1 text-label-md uppercase text-on-surface-variant">
              Nivel {nivel}
            </span>
          )}
        </div>
      </td>

      <td className="px-4 py-4 text-right md:px-6 md:py-5">
        <span className="text-[clamp(3rem,4.5vw,6rem)] font-bold leading-none tabular-nums text-primary">
          {formatearTurno(turnoActual)}
        </span>
      </td>
    </tr>
  )
}
