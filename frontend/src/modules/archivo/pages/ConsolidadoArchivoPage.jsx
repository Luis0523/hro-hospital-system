import { useState } from 'react'
import { Alert, Button, Icon, Input, Spinner } from '@/shared/components/ui'
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
                <Button variant="secondary" onClick={refrescar} disabled={cargando}>
                  <Icon name="refresh" className="text-[18px]" />
                  Actualizar
                </Button>
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
    </ArchivoLayout>
  )
}
