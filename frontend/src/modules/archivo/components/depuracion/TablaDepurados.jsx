import { formatearExpediente } from '@/shared/utils/expediente'
import { EmptyState, Icon } from '@/shared/components/ui'
import {
  formatearFechaCortaGuatemala,
  formatearHoraGuatemala,
} from '../../utils/fechaDepuracionGuatemala'
import { fechaIsoDeRegistro } from '../../utils/historialDepurados'

const COLUMNAS = [
  { key: 'numeroExpediente', label: 'EXPEDIENTE' },
  { key: 'pacienteNombre', label: 'PACIENTE' },
  { key: 'hora', label: 'HORA' },
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

function celda(fila, clave, mostrarFecha) {
  if (clave === 'hora') {
    return (
      <div className="flex flex-col whitespace-nowrap font-mono text-on-surface-variant">
        <span>{textoOguion(horaDe(fila))}</span>
        {mostrarFecha && (
          <span className="text-label-sm text-on-surface-variant/80">
            {textoOguion(fechaDe(fila))}
          </span>
        )}
      </div>
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
  return fila[clave]
}

function TarjetaDepurado({ registro, mostrarFecha }) {
  return (
    <li className="rounded-xl border border-outline-variant bg-surface-container-low p-3">
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
        <p className="break-words font-mono text-title-md font-bold text-primary">
          {formatearExpediente(registro.numeroExpediente)}
        </p>
        <div className="flex flex-col text-right font-mono text-label-sm text-on-surface-variant">
          <span>
            <span className="sr-only">Hora de depuración: </span>
            {textoOguion(horaDe(registro))}
          </span>
          {mostrarFecha && (
            <span>
              <span className="sr-only">Fecha de depuración: </span>
              {textoOguion(fechaDe(registro))}
            </span>
          )}
        </div>
      </div>

      <p className="mt-1 break-words text-title-sm font-semibold text-on-surface">
        {textoOguion(registro.pacienteNombre)}
      </p>
    </li>
  )
}

export default function TablaDepurados({
  depurados = [],
  titulo = 'Depurados de hoy',
  descripcion = '',
  total = depurados.length,
  totalCoincidencias = depurados.length,
  busquedaActiva = false,
  sinRegistros = 'Aún no hay expedientes depurados hoy',
  consultaIncompleta = false,
  desactualizado = false,
  mostrarFecha = false,
  acciones = null,
  caption = 'Expedientes depurados: expediente, paciente y hora.',
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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3
            id="depurados-titulo"
            className="inline-flex items-center gap-1 text-title-md font-bold text-on-surface"
          >
            <Icon name="history" className="text-[20px] text-primary" />
            {titulo}
          </h3>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-label-sm text-on-surface-variant">
            {descripcion && <span>{descripcion}</span>}
            <span className="rounded bg-primary/10 px-2 py-0.5 font-bold text-primary">
              {etiquetaTotal}
            </span>
          </p>
        </div>
        {acciones && <div className="w-full sm:w-auto">{acciones}</div>}
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
              <TarjetaDepurado
                key={claveRegistro(registro, indice)}
                registro={registro}
                mostrarFecha={mostrarFecha}
              />
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
                        {celda(fila, columna.key, mostrarFecha)}
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
