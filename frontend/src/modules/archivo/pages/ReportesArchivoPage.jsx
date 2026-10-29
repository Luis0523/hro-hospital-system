import { useEffect, useState } from 'react'
import { Alert, Button, Icon, Spinner } from '@/shared/components/ui'
import { useToast } from '@/shared/context/ToastContext.jsx'
import { useTema } from '@/shared/context/ThemeContext.jsx'
import { hoyIso } from '@/shared/utils/fecha'
import { formatearExpediente } from '@/shared/utils/expediente'
import { obtenerEstadisticasJefe } from '../api/dashboardArchivoApi'
import { descargarSalidasHospitalPdf, listarSalidasHospital } from '../api/salidaArchivoHospitalApi'
import { descargarBlob } from '../utils/descargarBlob'
import { clasesEtiqueta, fondoEtiqueta } from '../utils/coloresEtiqueta'
import {
  agruparEtiquetasPorEstacion,
  contarEtiquetasSalidas,
  etiquetaDeSalida,
} from '../utils/etiquetasSalida'
import ArchivoLayout from '../components/ArchivoLayout.jsx'

const ESTILO_OPCION = {
  backgroundColor: 'rgb(var(--hro-surface-container-lowest))',
  color: 'rgb(var(--hro-on-surface))',
}

function horaDe(instante) {
  if (!instante) return '—'
  return new Date(instante).toLocaleTimeString('es-GT', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function Metrica({ etiqueta, valor, icono, tono = 'text-primary' }) {
  return (
    <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <p className="text-label-md uppercase tracking-wide text-on-surface-variant">{etiqueta}</p>
        <Icon name={icono} className={`text-[22px] ${tono}`} />
      </div>
      <p className="mt-2 text-headline-lg font-black tabular-nums text-on-surface">{valor}</p>
    </div>
  )
}

function ResumenEtiquetas({ etiquetas, total }) {
  return (
    <section
      aria-label="Totales por etiqueta"
      className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 shadow-card"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-title-md text-on-surface">Totales por etiqueta</h3>
        <span className="text-label-sm text-on-surface-variant">
          {etiquetas.length} etiqueta{etiquetas.length === 1 ? '' : 's'}
        </span>
      </div>
      {etiquetas.length === 0 ? (
        <p className="text-body-sm text-on-surface-variant">Sin salidas para la fecha.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {etiquetas.map((etiqueta) => {
            const porcentaje = total > 0 ? Math.round((etiqueta.total / total) * 100) : 0
            return (
              <li
                key={etiqueta.codigo ?? etiqueta.etiqueta}
                className="rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-1.5 text-label-md font-semibold text-on-surface">
                    <span
                      className={`h-2.5 w-2.5 shrink-0 rounded-full ${fondoEtiqueta(etiqueta.color)}`}
                    />
                    <span className="truncate">{etiqueta.etiqueta}</span>
                  </span>
                  <span className="shrink-0 text-title-md font-black tabular-nums text-on-surface">
                    {etiqueta.total}
                  </span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-container-high">
                  <div
                    className={`h-full rounded-full ${fondoEtiqueta(etiqueta.color)}`}
                    style={{ width: `${porcentaje}%` }}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

// Mini reporte diario para el personal de Archivo: totales por etiqueta,
// salidas por estación y el detalle consultable del día.
export default function ReportesArchivoPage() {
  const { mostrarToast } = useToast()
  const { tema } = useTema()
  const esOscuro = tema === 'oscuro'
  const [fecha, setFecha] = useState(hoyIso)
  const [recarga, setRecarga] = useState(0)
  const [estadisticas, setEstadisticas] = useState(null)
  const [salidas, setSalidas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [estacionFiltro, setEstacionFiltro] = useState('')
  const [texto, setTexto] = useState('')
  const [descargando, setDescargando] = useState(null)

  useEffect(() => {
    let cancelado = false
    setCargando(true)
    setError(null)
    Promise.all([obtenerEstadisticasJefe({ fecha }), listarSalidasHospital({ fecha })])
      .then(([datos, lista]) => {
        if (cancelado) return
        setEstadisticas(datos)
        setSalidas(Array.isArray(lista) ? lista : [])
      })
      .catch((fallo) => {
        if (cancelado) return
        setEstadisticas(null)
        setSalidas([])
        setError(fallo?.message || 'No se pudieron cargar los reportes del día')
      })
      .finally(() => {
        if (!cancelado) setCargando(false)
      })
    return () => {
      cancelado = true
    }
  }, [fecha, recarga])

  async function descargarPdf(estacionId = null) {
    const clave = estacionId ?? 'general'
    setDescargando(clave)
    try {
      const blob = await descargarSalidasHospitalPdf({ fecha, estacionId })
      if (blob) {
        descargarBlob(
          blob,
          estacionId
            ? `salida-archivo-estacion-${estacionId}-${fecha}.pdf`
            : `salida-archivo-hospital-${fecha}.pdf`,
        )
      }
    } catch (fallo) {
      mostrarToast({
        tone: 'error',
        title: 'No se pudo generar el PDF',
        message: fallo?.message,
      })
    } finally {
      setDescargando(null)
    }
  }

  const porEstacion = estadisticas?.porEstacion ?? []
  const porEtiqueta =
    salidas.length > 0 ? contarEtiquetasSalidas(salidas) : (estadisticas?.porEtiqueta ?? [])
  const etiquetasPorEstacion = agruparEtiquetasPorEstacion(salidas)
  const totalSalidas = estadisticas?.totalSalidas ?? salidas.length
  const sinEtiqueta = porEtiqueta.find((etiqueta) => !etiqueta.codigo)?.total ?? 0
  const totalConEtiqueta = Math.max(0, totalSalidas - sinEtiqueta)

  const filtro = texto.trim().toLowerCase()
  const filtradas = salidas.filter((salida) => {
    if (estacionFiltro && String(salida.estacionId) !== String(estacionFiltro)) return false
    if (!filtro) return true
    return (
      String(salida.numeroExpediente ?? '')
        .toLowerCase()
        .includes(filtro) ||
      String(salida.pacienteNombre ?? '')
        .toLowerCase()
        .includes(filtro)
    )
  })

  return (
    <ArchivoLayout
      acciones={
        <>
          <label className="inline-flex items-center gap-1 rounded-lg border border-outline-variant bg-surface-container-lowest px-2 py-1">
            <Icon name="calendar_today" className="text-[18px] text-primary" />
            <input
              type="date"
              value={fecha}
              onChange={(evento) => setFecha(evento.target.value)}
              aria-label="Fecha del reporte"
              className="h-8 rounded-md bg-transparent text-label-sm font-semibold outline-none"
            />
          </label>
          <Button size="sm" variant="secondary" onClick={() => setRecarga((n) => n + 1)}>
            <Icon name="refresh" className="text-[16px]" />
            Actualizar
          </Button>
          <Button
            size="sm"
            onClick={() => descargarPdf(null)}
            disabled={descargando != null || totalSalidas === 0}
          >
            <Icon name="picture_as_pdf" className="text-[16px]" />
            {descargando === 'general' ? 'Generando…' : 'PDF general'}
          </Button>
        </>
      }
    >
      <main className="mx-auto w-full max-w-6xl space-y-5 px-4 py-6">
        <header className="min-w-0">
          <h2 className="text-headline-md text-primary">Reportes diarios de Archivo</h2>
          <p className="text-body-sm text-on-surface-variant">
            Totales por etiqueta y consulta inmediata de las salidas del día.
          </p>
        </header>

        {cargando && <Spinner label="Cargando reportes…" />}

        {!cargando && error && (
          <Alert tone="error" title="No se pudieron cargar los reportes">
            <p className="mt-1">{error}</p>
            <div className="mt-3">
              <Button size="sm" variant="secondary" onClick={() => setRecarga((n) => n + 1)}>
                Reintentar
              </Button>
            </div>
          </Alert>
        )}

        {!cargando && !error && estadisticas && (
          <>
            <section aria-label="Resumen del día">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Metrica etiqueta="Salidas del día" valor={totalSalidas} icono="outbound" />
                <Metrica
                  etiqueta="Con etiqueta"
                  valor={totalConEtiqueta}
                  icono="label"
                  tono="text-rose-600"
                />
                <Metrica
                  etiqueta="Archivo activo"
                  valor={estadisticas.totalActivos ?? 0}
                  icono="bolt"
                  tono="text-emerald-600"
                />
                <Metrica
                  etiqueta="Archivo pasivo"
                  valor={estadisticas.totalPasivos ?? 0}
                  icono="inventory"
                  tono="text-amber-600"
                />
              </div>
            </section>

            <ResumenEtiquetas etiquetas={porEtiqueta} total={totalSalidas} />

            <section
              aria-label="Salidas por estación"
              className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 shadow-card"
            >
              <h3 className="mb-3 text-title-md text-on-surface">Salidas por estación</h3>
              {porEstacion.length === 0 ? (
                <p className="text-body-sm text-on-surface-variant">
                  No hay salidas registradas para la fecha seleccionada.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead className="bg-surface-container-low text-label-sm uppercase text-on-surface-variant">
                      <tr>
                        <th className="px-3 py-2">Estación</th>
                        <th className="px-3 py-2 text-center">Total</th>
                        <th className="px-3 py-2">Etiquetas</th>
                        <th className="px-3 py-2 text-center">Activos</th>
                        <th className="px-3 py-2 text-center">Pasivos</th>
                        <th className="px-3 py-2 text-right">Reporte</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/60">
                      {porEstacion.map((fila) => {
                        const etiquetasFila = fila.porEtiqueta?.length
                          ? fila.porEtiqueta
                          : (etiquetasPorEstacion.get(fila.estacionId ?? 'sin-estacion') ?? [])
                        return (
                          <tr key={fila.estacionId ?? 'sin-estacion'}>
                            <td className="px-3 py-2 font-semibold text-on-surface">
                              {fila.estacionNombre ?? 'Sin estación'}
                            </td>
                            <td className="px-3 py-2 text-center font-bold tabular-nums">
                              {fila.total ?? 0}
                            </td>
                            <td className="px-3 py-2">
                              {etiquetasFila.length ? (
                                <div className="flex flex-wrap gap-1">
                                  {etiquetasFila.map((etiqueta) => (
                                    <span
                                      key={etiqueta.codigo ?? etiqueta.etiqueta}
                                      className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-label-sm font-semibold ${clasesEtiqueta(etiqueta.color)}`}
                                    >
                                      {etiqueta.etiqueta}
                                      <span className="tabular-nums">{etiqueta.total}</span>
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-on-surface-variant">—</span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-center tabular-nums text-emerald-700">
                              {fila.activos ?? 0}
                            </td>
                            <td className="px-3 py-2 text-center tabular-nums text-amber-700">
                              {fila.pasivos ?? 0}
                            </td>
                            <td className="px-3 py-2 text-right">
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => descargarPdf(fila.estacionId)}
                                disabled={descargando != null || fila.estacionId == null}
                              >
                                <Icon name="picture_as_pdf" className="text-[16px]" />
                                PDF
                              </Button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section
              aria-label="Detalle de salidas del día"
              className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 shadow-card"
            >
              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <h3 className="text-title-md text-on-surface">Detalle de salidas del día</h3>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <label className="space-y-1">
                    <span className="sr-only">Filtrar por estación</span>
                    <select
                      value={estacionFiltro}
                      onChange={(evento) => setEstacionFiltro(evento.target.value)}
                      style={{ colorScheme: esOscuro ? 'dark' : 'light' }}
                      className="h-10 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 sm:w-52"
                    >
                      <option value="" style={ESTILO_OPCION}>
                        Todas las estaciones
                      </option>
                      {porEstacion.map((fila) => (
                        <option
                          key={fila.estacionId ?? 'sin'}
                          value={fila.estacionId ?? ''}
                          style={ESTILO_OPCION}
                        >
                          {fila.estacionNombre ?? 'Sin estación'}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-1">
                    <span className="sr-only">Buscar expediente o paciente</span>
                    <input
                      value={texto}
                      onChange={(evento) => setTexto(evento.target.value)}
                      placeholder="Expediente o paciente"
                      className="h-10 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 sm:w-56"
                    />
                  </label>
                </div>
              </div>

              {filtradas.length === 0 ? (
                <p className="text-body-sm text-on-surface-variant">
                  No hay salidas que coincidan con el filtro.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead className="bg-surface-container-low text-label-sm uppercase text-on-surface-variant">
                      <tr>
                        <th className="px-3 py-2">Expediente</th>
                        <th className="px-3 py-2">Paciente</th>
                        <th className="px-3 py-2">Etiqueta</th>
                        <th className="px-3 py-2 text-center">Clasificación</th>
                        <th className="px-3 py-2 text-center">Hora</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/60">
                      {filtradas.map((salida) => {
                        const etiqueta = etiquetaDeSalida(salida)
                        return (
                          <tr key={salida.id}>
                            <td className="px-3 py-2 font-mono font-bold text-primary">
                              {formatearExpediente(salida.numeroExpediente)}
                            </td>
                            <td className="px-3 py-2 font-semibold text-on-surface">
                              {salida.pacienteNombre}
                            </td>
                            <td className="px-3 py-2">
                              {etiqueta ? (
                                <span
                                  className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-label-sm font-semibold ${clasesEtiqueta(etiqueta.color)}`}
                                >
                                  <Icon name={etiqueta.icono || 'label'} className="text-[14px]" />
                                  {etiqueta.nombre}
                                </span>
                              ) : (
                                <span className="text-on-surface-variant">Normal</span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-center">
                              {salida.clasificacion ? (
                                <span
                                  className={`rounded px-2 py-0.5 text-label-sm font-bold ${
                                    salida.clasificacion === 'activo'
                                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-200'
                                      : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-200'
                                  }`}
                                >
                                  {salida.clasificacion === 'activo' ? 'Activo' : 'Pasivo'}
                                </span>
                              ) : (
                                <span className="text-on-surface-variant">—</span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-center font-mono text-on-surface-variant">
                              {horaDe(salida.registradoEn)}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </ArchivoLayout>
  )
}
