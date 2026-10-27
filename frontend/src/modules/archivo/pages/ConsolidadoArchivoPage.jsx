import { useEffect, useState } from 'react'
import { Alert, Button, Icon, Input, ModalGenerandoPdf, Spinner } from '@/shared/components/ui'
import { useToast } from '@/shared/context/ToastContext.jsx'
import { obtenerCuadernoRojo } from '../api/archivoApi'
import { obtenerEstadisticasJefe } from '../api/dashboardArchivoApi'
import { descargarArchivadosPdf } from '../api/consolidadoArchivoApi'
import { descargarBlob } from '../utils/descargarBlob'
import ArchivoLayout from '../components/ArchivoLayout.jsx'
import ConsolidadoDiario from '../components/consolidado/ConsolidadoDiario.jsx'
import TablaInformeEstadistico from '../components/consolidado/TablaInformeEstadistico.jsx'
import TablaDetalleConsulta from '../components/consolidado/TablaDetalleConsulta.jsx'
import BloqueTotalesMes from '../components/consolidado/BloqueTotalesMes.jsx'
import { useConsolidadoArchivo } from '../hooks/useConsolidadoArchivo'

const VISTAS = [
  { clave: 'diario', etiqueta: 'Diario', icono: 'today' },
  { clave: 'mensual', etiqueta: 'Mensual', icono: 'calendar_month' },
]

function mesValor(periodo) {
  return `${periodo.anio}-${String(periodo.mes).padStart(2, '0')}`
}

// Consolidado de Archivo: diario por especialidad y mensual (Informe Estadístico).
export default function ConsolidadoArchivoPage() {
  const [vista, setVista] = useState('diario')
  const {
    fecha,
    setFecha,
    diario,
    cargando,
    error,
    refrescar,
    periodo,
    setPeriodo,
    mensual,
    cargandoMensual,
    errorMensual,
    refrescarMensual,
  } = useConsolidadoArchivo()

  const { mostrarToast } = useToast()
  const [descargandoArchivados, setDescargandoArchivados] = useState(false)
  const [progresoPdf, setProgresoPdf] = useState(0)
  const [cuaderno, setCuaderno] = useState(null)
  const [resumenSalidas, setResumenSalidas] = useState(null)

  useEffect(() => {
    let activo = true
    Promise.all([obtenerCuadernoRojo(fecha), obtenerEstadisticasJefe({ fecha })])
      .then(([registro, resumen]) => {
        if (!activo) return
        setCuaderno(registro)
        setResumenSalidas(resumen)
      })
      .catch(() => {
        if (!activo) return
        setCuaderno(null)
        setResumenSalidas(null)
      })
    return () => {
      activo = false
    }
  }, [fecha])

  async function descargarArchivados() {
    setDescargandoArchivados(true)
    setProgresoPdf(0)
    const inicio = Date.now()
    const simulacionMs = 2200
    const timer = setInterval(() => {
      const avance = Math.min(92, Math.round(((Date.now() - inicio) / simulacionMs) * 92))
      setProgresoPdf((actual) => Math.max(actual, avance))
    }, 50)
    try {
      const [blob] = await Promise.all([
        descargarArchivadosPdf({ fecha }),
        new Promise((resolver) => setTimeout(resolver, simulacionMs)),
      ])
      clearInterval(timer)
      setProgresoPdf(100)
      if (blob) descargarBlob(blob, `expedientes-archivados-${fecha}.pdf`)
      await new Promise((resolver) => setTimeout(resolver, 400))
    } catch (fallo) {
      clearInterval(timer)
      mostrarToast({
        tone: 'error',
        title: 'No se pudo generar el PDF',
        message: fallo?.message,
      })
    } finally {
      clearInterval(timer)
      setDescargandoArchivados(false)
      setProgresoPdf(0)
    }
  }

  return (
    <ArchivoLayout>
      <main className="mx-auto max-w-5xl space-y-5 px-4 py-6">
        <header className="space-y-3">
          <div className="space-y-1">
            <h2 className="text-headline-md text-primary">Consolidado de Archivo</h2>
            <p className="text-body-sm text-on-surface-variant">
              Estadísticas de trabajo de la Estación de Archivo.
            </p>
          </div>

          <div role="tablist" aria-label="Tipo de consolidado" className="flex gap-2">
            {VISTAS.map((item) => {
              const activa = vista === item.clave
              return (
                <button
                  key={item.clave}
                  type="button"
                  role="tab"
                  aria-selected={activa}
                  onClick={() => setVista(item.clave)}
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hro-blue ${
                    activa
                      ? 'bg-hro-blue text-white'
                      : 'border border-outline-variant text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  <Icon name={item.icono} className="text-[18px]" />
                  {item.etiqueta}
                </button>
              )
            })}
          </div>
        </header>

        {vista === 'diario' && (
          <>
            <section
              aria-label="Filtros del consolidado diario"
              className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 shadow-card"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <Input
                  label="Fecha"
                  name="fecha-consolidado"
                  type="date"
                  value={fecha}
                  onChange={(evento) => setFecha(evento.target.value)}
                  className="sm:max-w-xs"
                />
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" onClick={refrescar} disabled={cargando}>
                    <Icon name="refresh" className="text-[18px]" />
                    Actualizar
                  </Button>
                  <Button
                    onClick={descargarArchivados}
                    disabled={descargandoArchivados || (resumenSalidas?.totalSalidas ?? 0) === 0}
                    title={
                      (resumenSalidas?.totalSalidas ?? 0) === 0
                        ? 'Registre salidas en Salida al Registro Médico para clasificar activos y pasivos'
                        : undefined
                    }
                  >
                    <Icon name="picture_as_pdf" className="text-[18px]" />
                    {descargandoArchivados ? 'Generando…' : 'Expedientes archivados (PDF)'}
                  </Button>
                </div>
              </div>
            </section>

            {cargando && <Spinner label="Cargando consolidado…" />}

            {!cargando && error && (
              <Alert tone="error" title="No se pudo cargar el consolidado diario">
                <p className="mt-1">{error}</p>
                <div className="mt-3">
                  <Button size="sm" variant="secondary" onClick={refrescar}>
                    Reintentar
                  </Button>
                </div>
              </Alert>
            )}

            {!cargando && !error && <ConsolidadoDiario consolidado={diario} />}

            <section
              aria-label="Clasificación de salidas del día"
              className="grid grid-cols-1 gap-3 sm:grid-cols-3"
            >
              <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 shadow-card">
                <p className="text-label-md uppercase tracking-wide text-on-surface-variant">
                  Clínica de la Mujer
                </p>
                <p className="text-metric-sub text-rose-600">
                  {resumenSalidas?.totalClinicaMujer ?? 0}
                </p>
              </div>
              <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 shadow-card">
                <p className="text-label-md uppercase tracking-wide text-on-surface-variant">
                  Archivo activo
                </p>
                <p className="text-metric-sub text-emerald-700">
                  {resumenSalidas?.totalActivos ?? 0}
                </p>
              </div>
              <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 shadow-card">
                <p className="text-label-md uppercase tracking-wide text-on-surface-variant">
                  Archivo pasivo
                </p>
                <p className="text-metric-sub text-amber-700">
                  {resumenSalidas?.totalPasivos ?? 0}
                </p>
              </div>
            </section>

            <section
              aria-label="Cuaderno Rojo del día"
              className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 shadow-card"
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-title-md text-on-surface">Cuaderno Rojo del día</h3>
                <span className="text-label-sm text-on-surface-variant">
                  {cuaderno ? 'Registro capturado' : 'Sin registro para la fecha'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  ['Egresos hospitalarios', cuaderno?.egresosHospitalarios],
                  ['Sobres emergencia', cuaderno?.sobresEmergencia],
                  ['Sobres sellados', cuaderno?.sobresSellados],
                  ['TIA', cuaderno?.tia],
                ].map(([etiqueta, valor]) => (
                  <div
                    key={etiqueta}
                    className="rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2"
                  >
                    <p className="text-label-sm font-semibold text-on-surface-variant">
                      {etiqueta}
                    </p>
                    <p className="text-title-lg font-black tabular-nums text-on-surface">
                      {valor ?? 0}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {vista === 'mensual' && (
          <>
            <section
              aria-label="Filtros del consolidado mensual"
              className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 shadow-card"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <Input
                  label="Mes"
                  name="mes-consolidado"
                  type="month"
                  value={mesValor(periodo)}
                  onChange={(evento) => {
                    const [anio, mes] = evento.target.value.split('-').map(Number)
                    if (anio && mes) setPeriodo({ anio, mes })
                  }}
                  className="sm:max-w-xs"
                />
                <Button variant="secondary" onClick={refrescarMensual} disabled={cargandoMensual}>
                  <Icon name="refresh" className="text-[18px]" />
                  Actualizar
                </Button>
              </div>
            </section>

            {cargandoMensual && <Spinner label="Cargando informe mensual…" />}

            {!cargandoMensual && errorMensual && (
              <Alert tone="error" title="No se pudo cargar el consolidado mensual">
                <p className="mt-1">{errorMensual}</p>
                <div className="mt-3">
                  <Button size="sm" variant="secondary" onClick={refrescarMensual}>
                    Reintentar
                  </Button>
                </div>
              </Alert>
            )}

            {!cargandoMensual && !errorMensual && mensual && (
              <div className="space-y-6">
                <TablaInformeEstadistico informe={mensual.informe ?? []} />
                <TablaDetalleConsulta detalle={mensual.detalle ?? []} />
                <BloqueTotalesMes totales={mensual.totales ?? {}} informe={mensual.informe ?? []} />
              </div>
            )}
          </>
        )}
      </main>

      <ModalGenerandoPdf abierto={descargandoArchivados} progreso={progresoPdf} />
    </ArchivoLayout>
  )
}
