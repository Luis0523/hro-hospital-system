import { useState } from 'react'
import { Button, EmptyState, Icon } from '@/shared/components/ui'
import { ordenarClinicas } from './ordenClinicas'

function conteo(valor) {
  return String(Math.max(0, Number(valor) || 0)).padStart(2, '0')
}

function horaDevolucion(valor) {
  if (!valor) return null
  const fecha = new Date(valor)
  if (Number.isNaN(fecha.getTime())) return null
  return fecha.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })
}

function especialidadesDe(clinica) {
  return clinica.especialidadesDelDia?.length
    ? clinica.especialidadesDelDia
    : (clinica.especialidadesFijas ?? [])
}

// En la etapa Devuelto no se identifica el turno: solo se descuenta el
// pendiente de cada clínica. El orden es el configurado por la estación.
export default function DevolucionesClinicas({
  clinicas = [],
  onDevolver,
  onDeshacer,
  procesandoId = null,
}) {
  const ordenadas = ordenarClinicas(clinicas)
  const [cantidades, setCantidades] = useState({})

  function pendientesDe(clinica) {
    return Math.max(
      0,
      Number(
        clinica.expedientesEnClinica ??
          Math.max(0, Number(clinica.asignados ?? 0) - Number(clinica.devueltos ?? 0)),
      ),
    )
  }

  function cantidadDe(clinica) {
    const pendientes = pendientesDe(clinica)
    const solicitada = Number(cantidades[clinica.id] ?? 1)
    if (pendientes <= 0) return 0
    return Math.min(Math.max(1, solicitada), pendientes)
  }

  function ajustar(clinica, delta) {
    const pendientes = pendientesDe(clinica)
    if (pendientes <= 0) return
    setCantidades((actual) => {
      const base = Number(actual[clinica.id] ?? 1)
      const siguiente = Math.min(Math.max(1, base + delta), pendientes)
      return { ...actual, [clinica.id]: siguiente }
    })
  }

  return (
    <section className="h-fit rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 shadow-card">
      <div className="space-y-1">
        <h2 className="text-headline-sm text-on-surface">Devoluciones por clínica</h2>
        <p className="text-body-sm text-on-surface-variant">
          El expediente regresa sin carnet: elija cuántos restar y regístrelo de una vez. Puede
          deshacer si se restó por error.
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
        <div className="mt-4 overflow-x-auto rounded-xl border border-outline-variant">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead className="bg-surface-container-low text-label-sm uppercase text-on-surface-variant">
              <tr>
                <th className="px-3 py-2">Clínica</th>
                <th className="px-3 py-2 text-center">Asignados</th>
                <th className="px-3 py-2 text-center">Devueltos</th>
                <th className="px-3 py-2 text-center">Pendientes</th>
                <th className="px-3 py-2 text-center">Present.</th>
                <th className="px-3 py-2 text-center">Restar</th>
                <th className="px-3 py-2 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/60">
              {ordenadas.map((clinica) => {
                const asignados = Number(clinica.asignados ?? 0)
                const devueltos = Number(clinica.devueltos ?? 0)
                const pendientes = pendientesDe(clinica)
                const presentaciones = Number(clinica.presentaciones ?? 0)
                const ocupada = String(procesandoId) === String(clinica.id)
                const cantidad = cantidadDe(clinica)
                const especialidades = especialidadesDe(clinica)
                const ultima = horaDevolucion(clinica.ultimaDevolucionEn)
                return (
                  <tr key={clinica.id} className="align-middle">
                    <td className="px-3 py-2">
                      <p className="font-semibold text-on-surface">{clinica.nombre}</p>
                      {especialidades.length > 0 && (
                        <p
                          className="mt-0.5 text-label-sm font-semibold text-primary"
                          title={especialidades
                            .map((especialidad) => especialidad.nombre)
                            .join(' · ')}
                        >
                          {especialidades.map((especialidad) => especialidad.nombre).join(' · ')}
                        </p>
                      )}
                      {ultima && (
                        <p className="mt-0.5 text-label-sm text-on-surface-variant">
                          Última devolución: {ultima}
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center font-semibold tabular-nums text-on-surface">
                      {conteo(asignados)}
                    </td>
                    <td className="px-3 py-2 text-center font-semibold tabular-nums text-rose-700 dark:text-rose-300">
                      {conteo(devueltos)}
                    </td>
                    <td className="px-3 py-2 text-center font-semibold tabular-nums text-amber-700 dark:text-amber-300">
                      {conteo(pendientes)}
                    </td>
                    <td className="px-3 py-2 text-center font-semibold tabular-nums text-cyan-800 dark:text-cyan-200">
                      {conteo(presentaciones)}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          aria-label={`Quitar uno a ${clinica.nombre}`}
                          onClick={() => ajustar(clinica, -1)}
                          disabled={ocupada || pendientes <= 0 || cantidad <= 1}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface transition hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Icon name="remove" className="text-[18px]" />
                        </button>
                        <span
                          aria-live="polite"
                          className="inline-flex h-8 min-w-10 items-center justify-center rounded-lg bg-surface-container px-2 font-bold tabular-nums text-on-surface"
                        >
                          {conteo(cantidad)}
                        </span>
                        <button
                          type="button"
                          aria-label={`Agregar uno a ${clinica.nombre}`}
                          onClick={() => ajustar(clinica, 1)}
                          disabled={ocupada || pendientes <= 0 || cantidad >= pendientes}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-outline-variant bg-surface-container-lowest text-on-surface transition hover:bg-surface-container disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Icon name="add" className="text-[18px]" />
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          size="sm"
                          onClick={() => onDevolver?.(clinica, cantidad)}
                          disabled={ocupada || pendientes <= 0 || cantidad <= 0}
                        >
                          <Icon name="remove_circle" className="text-[16px]" />
                          {ocupada ? 'Restando…' : `Restar ${cantidad}`}
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => onDeshacer?.(clinica)}
                          disabled={ocupada || devueltos <= 0}
                        >
                          <Icon name="undo" className="text-[16px]" />
                          Deshacer
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
