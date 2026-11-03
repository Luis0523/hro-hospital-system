import { formatearExpediente } from '@/shared/utils/expediente'
import { EmptyState, Icon } from '@/shared/components/ui'
import {
  formatearFechaCortaGuatemala,
  formatearHoraGuatemala,
} from '../../utils/fechaDepuracionGuatemala'
import { fechaIsoDeRegistro } from '../../utils/historialDepurados'

const COLUMNAS = [
  { key: 'fecha', label: 'Fecha' },
  { key: 'hora', label: 'Hora' },
  { key: 'numeroExpediente', label: 'Expediente' },
  { key: 'pacienteNombre', label: 'Paciente' },
  { key: 'usuarioNombre', label: 'Usuario' },
  { key: 'motivo', label: 'Motivo' },
]

function fechaDe(registro) {
  return formatearFechaCortaGuatemala(
    fechaIsoDeRegistro(registro) || registro?.depuradoEn || registro?.fecha,
  )
}

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
  if (clave === 'fecha') {
    return (
      <span className="whitespace-nowrap font-mono text-on-surface-variant">
        {textoOguion(fechaDe(fila))}
      </span>
    )
  }
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

function TarjetaDepurado({ registro }) {
  return (
    <li className="rounded-xl border border-outline-variant bg-surface-container-low p-3">
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
        <p className="break-words font-mono text-title-md font-bold text-primary">
          {formatearExpediente(registro.numeroExpediente)}
        </p>
        <div className="text-right font-mono text-label-sm text-on-surface-variant">
          <p>
            <span className="sr-only">Fecha de depuración: </span>
            {textoOguion(fechaDe(registro))}
          </p>
          <p>
            <span className="sr-only">Hora de depuración: </span>
            {textoOguion(horaDe(registro))}
          </p>
        </div>
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

export default function TablaDepurados({
  depurados = [],
  titulo = 'Depurados hoy',
  descripcion = '',
  total = depurados.length,
  totalCoincidencias = depurados.length,
  busquedaActiva = false,
  sinRegistros = 'Aún no hay expedientes depurados hoy',
  consultaIncompleta = false,
  desactualizado = false,
  caption = 'Expedientes depurados hoy: fecha, hora, expediente, paciente, usuario y motivo.',
  etiquetaLista = 'Expedientes depurados hoy (tarjetas)',
}) {
  const etiquetaTotal = desactualizado
    ? `Total: ${total} · puede estar desactualizado`
    : consultaIncompleta
      ? `Parcial: ${total}`
      : busquedaActiva
        ? `Mostrando ${totalCoincidencias} de ${total}`
        : `Total: ${total}`

  return (
    <section
      id="bitacora-depurados"
      aria-labelledby="depurados-titulo"
      className="space-y-3 rounded-2xl bg-surface-container-lowest p-4 shadow-card sm:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3
            id="depurados-titulo"
            className="inline-flex items-center gap-1 text-title-md font-bold text-on-surface"
          >
            <Icon name="history" className="text-[20px] text-primary" />
            {titulo}
          </h3>
          {descripcion && (
            <p className="mt-1 text-label-sm text-on-surface-variant">{descripcion}</p>
          )}
        </div>
        <span className="rounded bg-primary/10 px-2 py-0.5 text-label-sm font-bold text-primary">
          {etiquetaTotal}
        </span>
      </div>

      {depurados.length === 0 ? (
        <EmptyState title={sinRegistros} />
      ) : (
        <>
          <ul
            aria-label={etiquetaLista}
            tabIndex={0}
            className="max-h-[60vh] space-y-3 overflow-y-auto pr-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hro-blue lg:hidden"
          >
            {depurados.map((registro, indice) => (
              <TarjetaDepurado key={claveRegistro(registro, indice)} registro={registro} />
            ))}
          </ul>

          <div
            role="region"
            aria-label="Listado de expedientes depurados, desplazable"
            tabIndex={0}
            className="hidden max-h-[460px] overflow-auto rounded-xl border border-outline-variant bg-surface-container-lowest focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hro-blue lg:block"
          >
            <table className="w-full text-left text-sm">
              <caption className="sr-only">{caption}</caption>
              <thead className="bg-surface-container-low text-xs uppercase tracking-wide text-on-surface-variant">
                <tr>
                  {COLUMNAS.map((columna) => (
                    <th
                      key={columna.key}
                      scope="col"
                      className="sticky top-0 z-10 bg-surface-container-low px-4 py-3 font-semibold"
                    >
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
