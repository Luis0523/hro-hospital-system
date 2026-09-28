import FilaTurno from './FilaTurno.jsx'

const CLASE_ENCABEZADO =
  'border-b-2 border-outline-variant/60 px-2 pb-2 text-center text-label-md uppercase tracking-[0.2em] text-on-surface-variant dark:border-slate-700 dark:text-slate-300 md:px-4'

export default function SeccionTurnos({ asignaciones = [], etiqueta }) {
  return (
    <table className="mx-auto w-full max-w-2xl table-fixed border-collapse text-center">
      <caption className="sr-only">{etiqueta ?? 'Turnos por consultorio'}</caption>
      <colgroup>
        <col style={{ width: '58%' }} />
        <col style={{ width: '42%' }} />
      </colgroup>
      <thead>
        <tr>
          <th scope="col" className={CLASE_ENCABEZADO}>
            Turno actual
          </th>
          <th scope="col" className={CLASE_ENCABEZADO}>
            Consultorio
          </th>
        </tr>
      </thead>
      <tbody
        data-testid="tablero-tabla-cuerpo"
        className="divide-y divide-outline-variant/50 dark:divide-slate-800"
      >
        {asignaciones.map((asignacion) => (
          <FilaTurno key={asignacion.asignacionDiariaEspacioId} asignacion={asignacion} />
        ))}
      </tbody>
    </table>
  )
}
