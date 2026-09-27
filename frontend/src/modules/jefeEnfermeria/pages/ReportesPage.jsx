import { useCallback, useEffect, useState } from 'react'
import Alert from '@/shared/components/ui/Alert.jsx'
import Spinner from '@/shared/components/ui/Spinner.jsx'
import Icon from '@/shared/components/ui/Icon.jsx'
import { hoyIso } from '@/shared/utils/fecha'
import {
  reporteCitasPorEstado,
  reporteDemandaPorEspecialidad,
  reporteUtilizacionCupos,
} from '../api/jefeEnfermeriaApi'

const claseCampo =
  'h-10 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-body-md text-on-surface outline-none focus:border-primary-container focus:ring-2 focus:ring-secondary-fixed-dim'

function isoHaceDias(dias) {
  const fecha = new Date()
  fecha.setDate(fecha.getDate() - dias)
  return fecha.toISOString().slice(0, 10)
}

function etiquetaEstado(estado) {
  const texto = String(estado).replace(/_/g, ' ')
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

export default function ReportesPage() {
  const [fechaInicio, setFechaInicio] = useState(() => isoHaceDias(30))
  const [fechaFin, setFechaFin] = useState(hoyIso())
  const [citas, setCitas] = useState(null)
  const [demanda, setDemanda] = useState(null)
  const [cupos, setCupos] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const params = { fechaInicio, fechaFin }
      const [porEstado, porEspecialidad, utilizacion] = await Promise.all([
        reporteCitasPorEstado(params),
        reporteDemandaPorEspecialidad(params),
        reporteUtilizacionCupos(params),
      ])
      setCitas(porEstado)
      setDemanda(porEspecialidad)
      setCupos(utilizacion)
    } catch (fallo) {
      setError(fallo?.message || 'No se pudieron cargar los reportes.')
      setCitas(null)
      setDemanda(null)
      setCupos(null)
    } finally {
      setCargando(false)
    }
  }, [fechaInicio, fechaFin])

  useEffect(() => {
    cargar()
  }, [cargar])

  const estados = citas ? Object.entries(citas.porEstado ?? {}) : []
  const maxEstado = estados.reduce((max, [, valor]) => Math.max(max, valor), 0) || 1

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-headline-lg text-on-surface">Estadísticas y métricas</h2>
          <p className="text-body-md text-on-surface-variant">
            Citas por estado, demanda por especialidad y utilización de cupos (calculado por el
            backend).
          </p>
        </div>
      </header>

      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest p-3 shadow-card">
        <label className="flex flex-col gap-1">
          <span className="text-label-sm uppercase tracking-wide text-on-surface-variant">
            Desde
          </span>
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            className={claseCampo}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-label-sm uppercase tracking-wide text-on-surface-variant">
            Hasta
          </span>
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            className={claseCampo}
          />
        </label>
      </div>

      {error && (
        <Alert tone="error" title="Atención">
          {error}
        </Alert>
      )}

      {cargando ? (
        <div className="flex justify-center py-16">
          <Spinner label="Calculando reportes…" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metrica etiqueta="Citas totales" valor={citas?.total ?? 0} icono="event_note" />
            <Metrica
              etiqueta="Utilización de cupos"
              valor={`${cupos?.utilizacionPorcentaje ?? 0}%`}
              icono="donut_large"
            />
            <Metrica
              etiqueta="Cupos ocupados"
              valor={cupos?.cuposOcupados ?? 0}
              icono="event_available"
            />
            <Metrica
              etiqueta="Cupos disponibles"
              valor={cupos?.cuposDisponibles ?? 0}
              icono="event_busy"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-card">
              <h3 className="mb-3 flex items-center gap-2 text-title-md uppercase text-on-surface">
                <Icon name="pie_chart" className="text-[20px] text-primary" />
                Citas por estado
              </h3>
              <ul className="space-y-2">
                {estados.map(([estado, valor]) => (
                  <li key={estado}>
                    <div className="flex items-center justify-between text-body-sm text-on-surface">
                      <span>{etiquetaEstado(estado)}</span>
                      <span className="tabular-nums">{valor}</span>
                    </div>
                    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-surface-container">
                      <div
                        className="h-full rounded-full bg-primary-container"
                        style={{ width: `${Math.round((valor / maxEstado) * 100)}%` }}
                      />
                    </div>
                  </li>
                ))}
                {estados.length === 0 && (
                  <li className="text-body-sm text-on-surface-variant">Sin datos en el rango.</li>
                )}
              </ul>
            </section>

            <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-card">
              <h3 className="mb-3 flex items-center gap-2 text-title-md uppercase text-on-surface">
                <Icon name="monitoring" className="text-[20px] text-primary" />
                Demanda por especialidad
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-body-sm">
                  <thead>
                    <tr className="text-left text-label-sm uppercase tracking-wide text-on-surface-variant">
                      <th className="py-2 pr-3">Especialidad</th>
                      <th className="py-2 pr-3 text-right">Citas</th>
                      <th className="py-2 pr-3 text-right">Atendidas</th>
                      <th className="py-2 text-right">Inasist.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {(demanda?.items ?? []).map((item) => (
                      <tr key={item.especialidadId} className="text-on-surface">
                        <td className="py-2 pr-3">{item.especialidadNombre}</td>
                        <td className="py-2 pr-3 text-right tabular-nums">{item.totalCitas}</td>
                        <td className="py-2 pr-3 text-right tabular-nums">{item.atendidas}</td>
                        <td className="py-2 text-right tabular-nums">{item.inasistencias}</td>
                      </tr>
                    ))}
                    {(demanda?.items ?? []).length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-3 text-on-surface-variant">
                          Sin datos en el rango.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <p className="text-label-sm text-on-surface-variant">
            Rango: {citas?.fechaInicio ?? fechaInicio} → {citas?.fechaFin ?? fechaFin}
          </p>
        </>
      )}
    </section>
  )
}

function Metrica({ etiqueta, valor, icono }) {
  return (
    <article className="flex items-center gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-card">
      <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary-container text-on-primary">
        <Icon name={icono} className="text-[22px]" />
      </span>
      <span>
        <span className="block text-label-sm uppercase tracking-wide text-on-surface-variant">
          {etiqueta}
        </span>
        <span className="block text-metric-sub text-on-surface tabular-nums">{valor}</span>
      </span>
    </article>
  )
}
