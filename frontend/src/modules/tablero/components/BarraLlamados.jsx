function formatearTurno(valor) {
  return typeof valor === 'number' && Number.isFinite(valor) && valor > 0
    ? `#${String(valor).padStart(3, '0')}`
    : null
}

/**
 * Barra inferior (azul) con el último llamado de cada sala: número, clínica,
 * consultorio y nombre del paciente. Puede mostrar varios a la vez.
 */
export default function BarraLlamados({ asignaciones = [] }) {
  const llamados = asignaciones
    .filter((asignacion) => formatearTurno(asignacion?.turnoActual))
    .sort((a, b) => (b.turnoActual ?? 0) - (a.turnoActual ?? 0))

  return (
    <footer
      data-testid="barra-llamados"
      className="flex min-h-[4.5rem] flex-wrap items-center gap-x-6 gap-y-2 bg-primary-container px-6 py-3 text-on-primary dark:bg-sky-900 dark:text-sky-50"
    >
      <span className="text-label-md uppercase tracking-[0.3em] opacity-80">
        {llamados.length > 1 ? 'Llamados' : 'Llamado'}
      </span>

      {llamados.length === 0 ? (
        <span className="text-headline-sm opacity-80">Aún no hay llamados</span>
      ) : (
        <ul className="flex flex-wrap items-center gap-x-8 gap-y-2">
          {llamados.map((asignacion) => (
            <li key={asignacion.asignacionDiariaEspacioId} className="text-headline-sm font-semibold">
              {`${formatearTurno(asignacion.turnoActual)} · ${
                asignacion.subespecialidadNombre ?? '—'
              } · Consultorio ${asignacion.espacioNumero ?? '—'}${
                asignacion.pacienteNombre ? ` · ${asignacion.pacienteNombre}` : ''
              }`}
            </li>
          ))}
        </ul>
      )}
    </footer>
  )
}
