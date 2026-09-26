import FilaTurno from './FilaTurno.jsx'

export default function TablaTurnos({ asignaciones = [] }) {
  return (
    <div className="flex-1 overflow-x-auto">
      <table data-testid="tablero-tabla" className="w-full table-fixed border-collapse">
        <caption className="sr-only">Turnos por clínica</caption>
        <colgroup>
          <col style={{ width: '50%' }} />
          <col style={{ width: '25%' }} />
          <col style={{ width: '25%' }} />
        </colgroup>
        <thead>
          <tr>
            <th
              scope="col"
              className="border-b-2 border-outline-variant/60 px-4 pb-3 text-left text-label-md uppercase tracking-[0.2em] text-on-surface-variant md:px-6"
            >
              Clínica / Subespecialidad
            </th>
            <th
              scope="col"
              className="border-b-2 border-outline-variant/60 px-4 pb-3 text-left text-label-md uppercase tracking-[0.2em] text-on-surface-variant md:px-6"
            >
              Consultorio
            </th>
            <th
              scope="col"
              className="border-b-2 border-outline-variant/60 px-4 pb-3 text-right text-label-md uppercase tracking-[0.2em] text-on-surface-variant md:px-6"
            >
              Turno actual
            </th>
          </tr>
        </thead>
        <tbody data-testid="tablero-tabla-cuerpo" className="divide-y divide-outline-variant/50">
          {asignaciones.map((asignacion) => (
            <FilaTurno key={asignacion.asignacionDiariaEspacioId} asignacion={asignacion} />
          ))}
        </tbody>
      </table>
    </div>
  )
}
