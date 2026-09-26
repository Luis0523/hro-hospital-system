import FilaTurno from './FilaTurno.jsx'

const CLASE_ENCABEZADO =
  'border-b-2 border-outline-variant/60 px-2 pb-3 text-label-md uppercase tracking-[0.2em] text-on-surface-variant md:px-4'

export default function SeccionTurnos({ asignaciones = [], etiqueta }) {
  return (
    <table className="w-full table-fixed border-collapse">
      <caption className="sr-only">{etiqueta ?? 'Turnos por clínica'}</caption>
      <colgroup>
        <col style={{ width: '42%' }} />
        <col style={{ width: '25%' }} />
        <col style={{ width: '33%' }} />
      </colgroup>
      <thead>
        <tr>
          <th scope="col" className={`${CLASE_ENCABEZADO} text-left`}>
            Clínica / Subespecialidad
          </th>
          <th scope="col" className={`${CLASE_ENCABEZADO} text-left`}>
            Consultorio
          </th>
          <th scope="col" className={`${CLASE_ENCABEZADO} text-right`}>
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
  )
}
