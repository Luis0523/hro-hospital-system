import { formatearExpediente } from '@/shared/utils/expediente'
import { EmptyState, Icon } from '@/shared/components/ui'
import { formatearHoraGuatemala } from '../../utils/fechaDepuracionGuatemala'

const COLUMNAS = [
  { key: 'hora', label: 'Hora' },
  { key: 'numeroExpediente', label: 'Expediente' },
  { key: 'pacienteNombre', label: 'Paciente' },
  { key: 'usuarioNombre', label: 'Usuario' },
  { key: 'motivo', label: 'Motivo' },
]

function horaDe(registro) {
  return formatearHoraGuatemala(registro?.depuradoEn)
}

function textoOguion(valor) {
  return valor || '—'
}

function claveRegistro(registro, indice) {
  return registro.id ?? `${registro.numeroExpediente}-${indice}`
}

function celda(fila, clave) {
  if (clave === 'hora') {
    return (
      <span className="whitespace-nowrap font-mono text-on-surface-variant">
        {textoOguion(horaDe(fila))}
      </span>
    )
  }
  if (clave === 'numeroExpediente') {
    return (
      <span className="whitespace-nowrap font-mono font-semibold text-primary">
        {formatearExpediente(fila.numeroExpediente)}
      </span>
    )
  }
  if (clave === 'pacienteNombre') {
    return <span className="break-words">{textoOguion(fila.pacienteNombre)}</span>
  }
  if (clave === 'usuarioNombre') {
    return <span className="break-words">{textoOguion(fila.usuarioNombre)}</span>
  }
  if (clave === 'motivo') {
    return (
      <span className="break-words text-on-surface-variant" title={fila.motivo ?? ''}>
        {textoOguion(fila.motivo)}
      </span>
    )
  }
  return fila[clave]
}

// Tarjeta de la vista móvil. Usa los mismos campos y formateadores que la
// tabla de escritorio para no duplicar reglas de presentación.
function TarjetaDepurado({ registro }) {
  return (
    <li className="rounded-xl border border-outline-variant bg-surface-container-low p-3">
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
        <p className="break-words font-mono text-title-md font-bold text-primary">
          {formatearExpediente(registro.numeroExpediente)}
        </p>
        <p className="font-mono text-label-sm text-on-surface-variant">
          <span className="sr-only">Hora de depuración: </span>
          {textoOguion(horaDe(registro))}
        </p>
      </div>

      <p className="mt-1 break-words text-title-sm font-semibold text-on-surface">
        {textoOguion(registro.pacienteNombre)}
      </p>

      <dl className="mt-2 space-y-1 text-label-sm">
        <div className="flex flex-wrap gap-x-2">
          <dt className="text-on-surface-variant">Usuario</dt>
          <dd className="min-w-0 break-words text-on-surface">
            {textoOguion(registro.usuarioNombre)}
          </dd>
        </div>
        <div className="flex flex-wrap gap-x-2">
          <dt className="text-on-surface-variant">Motivo</dt>
          <dd className="min-w-0 break-words text-on-surface-variant">
            {textoOguion(registro.motivo)}
          </dd>
        </div>
      </dl>
    </li>
  )
}

// Bitácora del día de expedientes depurados. Sin correlativo (a diferencia del
// registro de carnets). Tabla semántica en escritorio y tarjetas en móvil,
// siempre sobre el mismo arreglo de registros.
export default function TablaDepurados({ depurados = [] }) {
  return (
    <section
      aria-labelledby="depurados-titulo"
      className="space-y-3 rounded-xl bg-surface-container-lowest p-4 shadow-card"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3
          id="depurados-titulo"
          className="inline-flex items-center gap-1 text-title-md font-bold text-on-surface"
        >
          <Icon name="history" className="text-[20px] text-primary" />
          Depurados hoy
        </h3>
        <span className="rounded bg-primary/10 px-2 py-0.5 text-label-sm font-bold text-primary">
          Total: {depurados.length}
        </span>
      </div>

      {depurados.length === 0 ? (
        <EmptyState title="Aún no hay expedientes depurados hoy" />
      ) : (
        <>
          <ul aria-label="Expedientes depurados hoy (tarjetas)" className="space-y-3 lg:hidden">
            {depurados.map((registro, indice) => (
              <TarjetaDepurado key={claveRegistro(registro, indice)} registro={registro} />
            ))}
          </ul>

          <div className="hidden overflow-x-auto rounded-xl border border-outline-variant bg-surface-container-lowest lg:block">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">
                Expedientes depurados hoy: hora, expediente, paciente, usuario y motivo.
              </caption>
              <thead className="bg-surface-container-low text-xs uppercase tracking-wide text-on-surface-variant">
                <tr>
                  {COLUMNAS.map((columna) => (
                    <th key={columna.key} scope="col" className="px-4 py-3 font-semibold">
                      {columna.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/60">
                {depurados.map((fila, indice) => (
                  <tr
                    key={claveRegistro(fila, indice)}
                    className="hover:bg-surface-container-low/60"
                  >
                    {COLUMNAS.map((columna) => (
                      <td key={columna.key} className="px-4 py-3 text-on-surface">
                        {celda(fila, columna.key)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  )
}
