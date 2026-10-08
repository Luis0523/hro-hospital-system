import { useEffect, useState } from 'react'
import Alert from '@/shared/components/ui/Alert.jsx'
import Button from '@/shared/components/ui/Button.jsx'
import Icon from '@/shared/components/ui/Icon.jsx'
import Spinner from '@/shared/components/ui/Spinner.jsx'
import { formatearFechaLarga } from '@/shared/utils/fecha'
import ArchivoLayout from '../components/ArchivoLayout.jsx'
import BloqueExcepciones from '../components/dashboard/BloqueExcepciones.jsx'
import FeedTiempoReal from '../components/dashboard/FeedTiempoReal.jsx'
import FiltroDashboard from '../components/dashboard/FiltroDashboard.jsx'
import FlujoCiclo from '../components/dashboard/FlujoCiclo.jsx'
import GraficaEstados from '../components/dashboard/GraficaEstados.jsx'
import IndicadorConexion from '../components/dashboard/IndicadorConexion.jsx'
import PanelIndicadores from '../components/dashboard/PanelIndicadores.jsx'
import TablaMovimientos from '../components/dashboard/TablaMovimientos.jsx'
import { listarSubespecialidades } from '../api/archivoApi'
import { USANDO_DATOS_MOCK } from '../api/dashboardArchivoApi'
import { useDashboardArchivo } from '../hooks/useDashboardArchivo'
import { useMovimientosArchivoStream } from '../hooks/useMovimientosArchivoStream'

// Página del Dashboard de Archivo: orquesta la carga de datos y compone las
// secciones. Los subcomponentes son presentacionales y no conocen la API.
export default function DashboardArchivoPage() {
  const {
    estadisticas,
    movimientos,
    cargando,
    cargandoMovimientos,
    error,
    filtros,
    setFiltros,
    refrescar,
    cargarMas,
    hayMas,
  } = useDashboardArchivo()
  const { eventos, estado: estadoConexion, reconectar } = useMovimientosArchivoStream()
  const [subespecialidades, setSubespecialidades] = useState([])

  useEffect(() => {
    let activo = true
    listarSubespecialidades()
      .then((lista) => {
        if (activo) setSubespecialidades(Array.isArray(lista) ? lista : [])
      })
      .catch(() => {
        if (activo) setSubespecialidades([])
      })
    return () => {
      activo = false
    }
  }, [])

  const rango = estadisticas?.rango
  const subtitulo = rango?.desde
    ? `Del ${formatearFechaLarga(rango.desde)} al ${formatearFechaLarga(rango.hasta)}`
    : 'Resumen operativo de la Estación de Archivo'

  return (
    <ArchivoLayout>
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-headline-md text-primary">Dashboard de Archivo</h2>
            <p className="text-body-sm text-on-surface-variant">{subtitulo}</p>
          </div>

          <Button variant="secondary" onClick={refrescar} disabled={cargando}>
            <Icon name="refresh" className="text-[18px]" />
            Actualizar
          </Button>
        </header>

        <Alert tone="info" title="Origen de los datos">
          {USANDO_DATOS_MOCK
            ? 'Mostrando datos simulados (VITE_USE_MOCK). El backend de estadísticas ya está disponible para el modo real.'
            : 'Datos en vivo del backend de Archivo (GET /archivo/estadisticas y /archivo/movimientos).'}
        </Alert>

        <FiltroDashboard
          filtros={filtros}
          onChange={setFiltros}
          subespecialidades={subespecialidades}
        />

        {cargando && <Spinner label="Cargando datos del dashboard…" />}

        {!cargando && error && (
          <Alert tone="error" title="No se pudieron cargar los datos">
            <p className="mt-1">{error}</p>
            <div className="mt-3">
              <Button size="sm" variant="secondary" onClick={refrescar}>
                Reintentar
              </Button>
            </div>
          </Alert>
        )}

        {!cargando && !error && (
          <>
            <PanelIndicadores estadisticas={estadisticas} />
            <FlujoCiclo porEstado={estadisticas?.porEstado ?? []} />
            <GraficaEstados porEstado={estadisticas?.porEstado ?? []} />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <TablaMovimientos
                movimientos={movimientos}
                hayMas={hayMas}
                cargandoMas={cargandoMovimientos}
                onCargarMas={cargarMas}
              />

              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-title-md text-on-surface">Tiempo real</h3>
                  <IndicadorConexion estado={estadoConexion} onReconectar={reconectar} />
                </div>
                <FeedTiempoReal eventos={eventos} />
              </div>
            </div>

            <BloqueExcepciones porEstado={estadisticas?.porEstado ?? []} />
          </>
        )}
      </main>
    </ArchivoLayout>
  )
}
