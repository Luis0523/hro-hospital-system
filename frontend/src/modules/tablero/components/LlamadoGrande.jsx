function formatearTurno(valor) {
  return typeof valor === 'number' && Number.isFinite(valor) && valor > 0
    ? `#${String(valor).padStart(3, '0')}`
    : '—'
}

export default function LlamadoGrande({ asignacion }) {
  const { espacioNumero, subespecialidadNombre, turnoActual } = asignacion ?? {}

  return (
    <section
      data-testid="llamado-grande"
      aria-label="Llamado de turno"
      className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-6 text-center"
    >
      <h2 className="max-w-[90%] break-words text-[clamp(1.75rem,3vw,5rem)] font-semibold uppercase tracking-[0.15em] text-on-surface-variant">
        {subespecialidadNombre ?? 'Sin subespecialidad'}
      </h2>

      <div className="flex flex-col items-center">
        <span className="text-label-md uppercase tracking-[0.4em] text-primary">Turno</span>
        <span
          data-testid="llamado-turno"
          className="text-[clamp(6rem,16vw,28rem)] font-bold leading-none tabular-nums text-primary drop-shadow-sm"
        >
          {formatearTurno(turnoActual)}
        </span>
      </div>

      <div className="flex flex-col items-center">
        <span className="text-label-md uppercase tracking-[0.4em] text-on-surface-variant">
          Consultorio
        </span>
        <span
          data-testid="llamado-consultorio"
          className="text-[clamp(3rem,8vw,16rem)] font-bold leading-none tabular-nums text-on-surface"
        >
          {espacioNumero ?? '—'}
        </span>
      </div>
    </section>
  )
}
