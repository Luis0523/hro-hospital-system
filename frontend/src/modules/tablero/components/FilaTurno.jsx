function formatearTurno(valor) {
  return typeof valor === 'number' && Number.isFinite(valor) && valor > 0
    ? `#${String(valor).padStart(3, '0')}`
    : '—'
}

function primerEnEspera(turnosEnEspera) {
  if (!Array.isArray(turnosEnEspera) || turnosEnEspera.length === 0) return null
  return [...turnosEnEspera]
    .map((numero) => Number(numero))
    .filter((numero) => Number.isInteger(numero) && numero > 0)
    .sort((a, b) => a - b)[0] ?? null
}

export default function FilaTurno({ asignacion }) {
  const { asignacionDiariaEspacioId, subespecialidadNombre, turnosEnEspera } = asignacion
  const siguiente = primerEnEspera(turnosEnEspera)

  return (
    <tr data-testid={`fila-turno-${asignacionDiariaEspacioId}`} className="align-middle">
      <td className="px-2 py-4 md:px-4 md:py-5">
        <h2 className="text-headline-md uppercase tracking-tight text-on-surface dark:text-slate-100">
          {subespecialidadNombre ?? 'Sin clínica'}
        </h2>
      </td>

      <td className="px-2 py-4 text-right md:px-4 md:py-5">
        <span
          data-testid={`fila-siguiente-${asignacionDiariaEspacioId}`}
          className="text-[clamp(3rem,4.5vw,10rem)] font-bold leading-none tabular-nums text-primary dark:text-sky-400"
        >
          {siguiente != null ? formatearTurno(siguiente) : '—'}
        </span>
      </td>
    </tr>
  )
}
