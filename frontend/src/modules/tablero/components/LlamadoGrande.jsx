function formatearTurno(valor) {
  return typeof valor === 'number' && Number.isFinite(valor) && valor > 0
    ? `#${String(valor).padStart(3, '0')}`
    : '—'
}

export default function LlamadoGrande({ asignacion }) {
  const { espacioNumero, turnoActual } = asignacion ?? {}

  return (
    <section
      data-testid="llamado-grande"
      aria-label="Llamado de turno"
      className="flex flex-1 items-center justify-center px-3 py-3 text-center sm:px-5 sm:py-5"
    >
      <div className="grid w-full flex-1 grid-cols-1 content-center items-stretch gap-3 sm:grid-cols-2 sm:gap-6">
        <div className="flex min-w-0 flex-col items-center justify-center gap-2 rounded-3xl border-2 border-primary/20 bg-surface-container-low px-3 py-4 dark:border-sky-400/25 dark:bg-slate-900 sm:gap-4 sm:px-5 sm:py-8">
          <span className="text-[clamp(1rem,1.5vw,2rem)] font-semibold uppercase tracking-[0.35em] text-primary dark:text-sky-400">
            Turno
          </span>
          <span
            data-testid="llamado-turno"
            className="text-[clamp(6rem,15vw,26rem)] font-bold leading-none tabular-nums text-primary drop-shadow-sm dark:text-sky-400"
          >
            {formatearTurno(turnoActual)}
          </span>
        </div>

        <div className="flex min-w-0 flex-col items-center justify-center gap-2 rounded-3xl border-2 border-on-surface-variant/20 bg-surface-container-low px-3 py-4 dark:border-slate-600 dark:bg-slate-900 sm:gap-4 sm:px-5 sm:py-8">
          <span className="text-[clamp(1rem,1.5vw,2rem)] font-semibold uppercase tracking-[0.35em] text-on-surface-variant dark:text-slate-300">
            Clínica
          </span>
          <span
            data-testid="llamado-consultorio"
            className="text-[clamp(6rem,15vw,26rem)] font-bold leading-none tabular-nums text-on-surface dark:text-slate-100"
          >
            {espacioNumero ?? '—'}
          </span>
        </div>
      </div>
    </section>
  )
}
