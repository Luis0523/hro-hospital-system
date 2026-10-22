import { Button, EmptyState, Icon } from '@/shared/components/ui'

function conteo(valor) {
  return String(Math.max(0, Number(valor) || 0)).padStart(2, '0')
}

function horaDevolucion(valor) {
  if (!valor) return null
  const fecha = new Date(valor)
  if (Number.isNaN(fecha.getTime())) return null
  return fecha.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })
}

// En la etapa Devuelto no se identifica el turno: solo se descuenta el
// pendiente de cada clínica. Cada resta queda auditada y se puede deshacer.
export default function DevolucionesClinicas({
  clinicas = [],
  onDevolver,
  onDeshacer,
  procesandoId = null,
}) {
  return (
    <section className="h-fit rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 shadow-card">
      <div className="space-y-1">
        <h2 className="text-headline-sm text-on-surface">Devoluciones por clínica</h2>
        <p className="text-body-sm text-on-surface-variant">
          El expediente regresa sin carnet: registre la devolución desde la clínica correspondiente.
          Puede deshacer si se restó por error.
        </p>
      </div>

      {clinicas.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title="Sin clínicas disponibles"
            description="No hay clínicas activas para la fecha seleccionada."
          />
        </div>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {clinicas.map((clinica) => {
            const asignados = Number(clinica.asignados ?? 0)
            const devueltos = Number(clinica.devueltos ?? 0)
            const pendientes = Number(
              clinica.expedientesEnClinica ?? Math.max(0, asignados - devueltos),
            )
            const presentaciones = Number(clinica.presentaciones ?? 0)
            const ocupada = String(procesandoId) === String(clinica.id)
            return (
              <article
                key={clinica.id}
                className="rounded-xl border-2 border-outline-variant bg-surface-container-low p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-headline-md font-bold leading-tight text-on-surface">
                    {clinica.nombre}
                  </h3>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-container-high text-primary">
                    <Icon name="local_hospital" className="text-[18px]" />
                  </span>
                </div>

                <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-surface-container-lowest px-2 py-2">
                    <dt className="text-label-sm uppercase tracking-wide text-on-surface-variant">
                      Asignados
                    </dt>
                    <dd className="mt-0.5 text-title-md font-bold text-on-surface">
                      {conteo(asignados)}
                    </dd>
                  </div>
                  <div className="rounded-lg bg-rose-500/10 px-2 py-2">
                    <dt className="text-label-sm uppercase tracking-wide text-rose-700 dark:text-rose-300">
                      Devueltos
                    </dt>
                    <dd className="mt-0.5 text-title-md font-bold text-rose-700 dark:text-rose-300">
                      {conteo(devueltos)}
                    </dd>
                  </div>
                  <div className="rounded-lg bg-amber-400/15 px-2 py-2">
                    <dt className="text-label-sm uppercase tracking-wide text-amber-700 dark:text-amber-300">
                      Pendientes
                    </dt>
                    <dd className="mt-0.5 text-title-md font-bold text-amber-700 dark:text-amber-300">
                      {conteo(pendientes)}
                    </dd>
                  </div>
                </dl>

                <p className="mt-2 flex items-center justify-between rounded-lg bg-cyan-500/10 px-2.5 py-1.5 text-label-sm text-cyan-800 dark:text-cyan-200">
                  <span>Presentaciones asignadas</span>
                  <strong className="text-title-sm font-bold">{conteo(presentaciones)}</strong>
                </p>

                {horaDevolucion(clinica.ultimaDevolucionEn) && (
                  <p className="mt-2 text-label-sm text-on-surface-variant">
                    Última devolución: {horaDevolucion(clinica.ultimaDevolucionEn)}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() => onDevolver?.(clinica)}
                    disabled={pendientes <= 0 || ocupada}
                  >
                    <Icon name="remove_circle" className="text-[16px]" />
                    Devolver 1
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onDeshacer?.(clinica)}
                    disabled={devueltos <= 0 || ocupada}
                  >
                    <Icon name="undo" className="text-[16px]" />
                    Deshacer
                  </Button>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
