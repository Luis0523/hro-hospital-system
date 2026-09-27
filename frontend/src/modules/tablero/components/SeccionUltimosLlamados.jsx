function formatearTurno(valor) {
  return typeof valor === 'number' && Number.isFinite(valor) && valor > 0
    ? `#${String(valor).padStart(3, '0')}`
    : '—'
}

const CLASE_ENCABEZADO =
  'border-b-2 border-outline-variant/60 px-2 pb-2 text-center text-label-md uppercase tracking-[0.2em] text-on-surface-variant dark:border-slate-700 dark:text-slate-300 md:px-4'

/**
 * Columna derecha temporal cuando existen llamados recientes. Muestra solo
 * `turnoActual` y `espacioNumero` (datos públicos), en el orden recibido.
 */
export default function SeccionUltimosLlamados({ ultimosLlamados = [] }) {
  return (
    <table
      data-testid="tablero-ultimos-llamados"
      className="mx-auto w-full max-w-2xl table-fixed border-collapse text-center"
    >
      <caption className="sr-only">Últimos llamados</caption>
      <colgroup>
        <col style={{ width: '58%' }} />
        <col style={{ width: '42%' }} />
      </colgroup>
      <thead>
        <tr>
          <th scope="col" colSpan={2} className={CLASE_ENCABEZADO}>
            Últimos llamados
          </th>
        </tr>
      </thead>
      <tbody
        data-testid="tablero-ultimos-cuerpo"
        className="divide-y divide-outline-variant/50 dark:divide-slate-800"
      >
        {ultimosLlamados.map((llamado) => (
          <tr
            key={`${llamado.asignacionDiariaEspacioId}-${llamado.turnoActual}`}
            data-testid={`ultimo-llamado-${llamado.asignacionDiariaEspacioId}-${llamado.turnoActual}`}
            className="align-middle"
          >
            <td className="px-2 py-2 text-center align-middle md:px-4 md:py-3 2xl:py-5">
              <span className="text-[clamp(3rem,4.5vw,10rem)] font-bold leading-none tabular-nums text-primary dark:text-sky-400">
                {formatearTurno(llamado.turnoActual)}
              </span>
            </td>

            <td className="px-2 py-2 text-center align-middle md:px-4 md:py-3 2xl:py-5">
              <span className="text-[clamp(2.25rem,3.5vw,7rem)] font-bold leading-none tabular-nums text-on-surface dark:text-slate-100">
                {llamado.espacioNumero ?? '—'}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
