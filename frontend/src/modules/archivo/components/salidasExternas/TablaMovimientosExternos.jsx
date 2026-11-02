import { Alert, Button, EmptyState, Icon, Spinner } from '@/shared/components/ui'
import { VISTA_DEVUELTOS, VISTA_PENDIENTES, VISTA_TODOS } from '../../hooks/useSalidasExternas'
import {
  fechaGuatemalaDe,
  formatearFechaGuatemala,
  formatearFechaHoraGuatemala,
} from '../../utils/fechaGuatemala'
import { numeroExpedienteVisible } from '../../utils/prestamosExternos'

const VISTAS_UI = [
  { id: VISTA_TODOS, etiqueta: 'Todos' },
  { id: VISTA_PENDIENTES, etiqueta: 'Pendientes' },
  { id: VISTA_DEVUELTOS, etiqueta: 'Devueltos' },
]

const DESCRIPCION_VACIA = {
  [VISTA_TODOS]: 'Aún no hay movimientos de la jornada ni préstamos pendientes.',
  [VISTA_PENDIENTES]: 'No hay préstamos pendientes de devolución.',
  [VISTA_DEVUELTOS]: 'Todavía no se han registrado devoluciones en esta sesión.',
}

function EstadoMovimiento({ registro, mostrarAnterior, hoy }) {
  const devuelto = Boolean(registro.fechaDevolucion)
  const deDiasAnteriores =
    !devuelto && mostrarAnterior && fechaGuatemalaDe(registro.fechaSalida) !== hoy

  return (
    <div className="flex flex-wrap items-center gap-1">
      <span
        className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-label-sm font-semibold ${
          devuelto
            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
        }`}
      >
        <Icon name={devuelto ? 'task_alt' : 'schedule'} className="text-[14px]" />
        {devuelto ? 'Devuelto' : 'Pendiente'}
      </span>

      {registro.recuperadoManualmente && (
        <span className="rounded bg-surface-container px-2 py-0.5 text-label-sm font-semibold text-on-surface-variant">
          Recuperado
        </span>
      )}

      {deDiasAnteriores && (
        <span
          title={`Prestado el ${formatearFechaGuatemala(registro.fechaSalida)}`}
          className="rounded bg-surface-container px-2 py-0.5 text-label-sm font-semibold text-on-surface-variant"
        >
          Días anteriores
        </span>
      )}
    </div>
  )
}

function fechaDevolucionVisible(registro) {
  return formatearFechaHoraGuatemala(registro.fechaDevolucion) || '—'
}

/**
 * Listado de movimientos de salidas externas.
 * Componente presentacional: recibe los registros ya filtrados y ordenados por
 * el hook (Todos / Pendientes / Devueltos + búsqueda local).
 */
export default function TablaMovimientosExternos({
  registros = [],
  vista = VISTA_TODOS,
  onCambiarVista,
  busquedaLocal = '',
  onBuscar,
  cargando = false,
  errorCarga = null,
  onReintentar,
  hoy,
}) {
  const hayBusqueda = busquedaLocal.trim().length > 0
  const mostrarAnterior = vista === VISTA_PENDIENTES
  const total = registros.length
  const actualizando = cargando && total > 0
  const mostrarSpinner = cargando && total === 0

  return (
    <section
      aria-labelledby="titulo-movimientos"
      className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 shadow-card sm:p-6"
    >
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 id="titulo-movimientos" className="text-title-md font-semibold text-on-surface">
            Movimientos de expedientes
          </h3>
          <p className="mt-0.5 text-body-sm text-on-surface-variant">
            Préstamos y devoluciones de la sesión, del movimiento más reciente al más antiguo.
          </p>
        </div>
        <span
          aria-live="polite"
          className="rounded-lg bg-surface-container px-2 py-1 text-label-sm font-semibold text-on-surface-variant"
        >
          {total} {hayBusqueda ? 'coincidencia(s)' : 'movimiento(s)'}
          {actualizando ? ' · actualizando…' : ''}
        </span>
      </header>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          role="group"
          aria-label="Vista de movimientos"
          className="flex w-full gap-1 rounded-xl border border-outline-variant bg-surface-container-low p-1 sm:w-auto"
        >
          {VISTAS_UI.map((opcion) => {
            const activa = vista === opcion.id
            return (
              <button
                key={opcion.id}
                type="button"
                aria-pressed={activa}
                onClick={() => onCambiarVista?.(opcion.id)}
                className={`min-h-11 flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hro-blue sm:flex-none ${
                  activa
                    ? 'bg-primary text-white'
                    : 'text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                {opcion.etiqueta}
              </button>
            )
          })}
        </div>

        <div className="relative w-full sm:w-72">
          <Icon
            name="search"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-on-surface-variant"
          />
          <input
            type="search"
            value={busquedaLocal}
            onChange={(evento) => onBuscar?.(evento.target.value)}
            aria-label="Buscar movimientos"
            placeholder="Expediente, persona o motivo"
            autoComplete="off"
            className="h-11 w-full rounded-lg border border-outline-variant bg-surface-container-lowest pl-10 pr-3 text-sm text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="mt-4">
        {mostrarSpinner && <Spinner label="Cargando movimientos…" />}

        {errorCarga && (
          <Alert tone="error" title="No se pudieron cargar los movimientos">
            <p>{errorCarga.mensaje}</p>
            {onReintentar && (
              <div className="mt-3">
                <Button type="button" variant="secondary" size="sm" onClick={onReintentar}>
                  <Icon name="refresh" className="text-[18px]" />
                  Reintentar
                </Button>
              </div>
            )}
          </Alert>
        )}

        {!errorCarga && total === 0 && !mostrarSpinner && (
          <EmptyState
            title={hayBusqueda ? 'No se encontraron coincidencias' : 'No hay movimientos'}
            description={
              hayBusqueda
                ? 'Pruebe con otro número de expediente, persona o motivo.'
                : DESCRIPCION_VACIA[vista]
            }
          />
        )}

        {!errorCarga && total > 0 && (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">
                  Movimientos de salidas externas con expediente, persona, motivo, fechas y estado
                </caption>
                <thead className="bg-surface-container-low text-xs uppercase tracking-wide text-on-surface-variant">
                  <tr>
                    <th scope="col" className="px-3 py-2 font-semibold">
                      Expediente
                    </th>
                    <th scope="col" className="px-3 py-2 font-semibold">
                      Persona
                    </th>
                    <th scope="col" className="px-3 py-2 font-semibold">
                      Motivo
                    </th>
                    <th scope="col" className="px-3 py-2 font-semibold">
                      Préstamo
                    </th>
                    <th scope="col" className="px-3 py-2 font-semibold">
                      Devolución
                    </th>
                    <th scope="col" className="px-3 py-2 font-semibold">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/60">
                  {registros.map((registro) => (
                    <tr key={registro.id} className="align-top hover:bg-surface-container-low/60">
                      <td className="whitespace-nowrap px-3 py-3 font-mono font-bold text-on-surface">
                        {numeroExpedienteVisible(registro)}
                      </td>
                      <td className="px-3 py-3 font-medium text-on-surface">
                        {registro.personaRetira}
                      </td>
                      <td className="px-3 py-3 text-on-surface-variant">{registro.motivo}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-on-surface">
                        {formatearFechaHoraGuatemala(registro.fechaSalida)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-on-surface">
                        {fechaDevolucionVisible(registro)}
                      </td>
                      <td className="px-3 py-3">
                        <EstadoMovimiento
                          registro={registro}
                          mostrarAnterior={mostrarAnterior}
                          hoy={hoy}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="space-y-2 md:hidden" aria-label="Movimientos de expedientes">
              {registros.map((registro) => (
                <li key={registro.id}>
                  <article className="rounded-xl border border-outline-variant bg-surface-container-low p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="font-mono text-title-md font-bold text-on-surface">
                        {numeroExpedienteVisible(registro)}
                      </p>
                      <EstadoMovimiento
                        registro={registro}
                        mostrarAnterior={mostrarAnterior}
                        hoy={hoy}
                      />
                    </div>

                    <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-label-sm">
                      <div className="col-span-2">
                        <dt className="text-on-surface-variant">Persona</dt>
                        <dd className="font-semibold text-on-surface">{registro.personaRetira}</dd>
                      </div>
                      <div className="col-span-2">
                        <dt className="text-on-surface-variant">Motivo</dt>
                        <dd className="text-on-surface">{registro.motivo}</dd>
                      </div>
                      <div>
                        <dt className="text-on-surface-variant">Préstamo</dt>
                        <dd className="font-semibold text-on-surface">
                          {formatearFechaHoraGuatemala(registro.fechaSalida)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-on-surface-variant">Devolución</dt>
                        <dd className="font-semibold text-on-surface">
                          {fechaDevolucionVisible(registro)}
                        </dd>
                      </div>
                    </dl>
                  </article>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </section>
  )
}
