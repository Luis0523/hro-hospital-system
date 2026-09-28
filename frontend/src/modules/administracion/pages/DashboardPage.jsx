import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Alert from '@/shared/components/ui/Alert.jsx'
import Button from '@/shared/components/ui/Button.jsx'
import Icon from '@/shared/components/ui/Icon.jsx'
import Spinner from '@/shared/components/ui/Spinner.jsx'
import {
  listarDiasNoLaborablesFuturos,
  obtenerResumenDashboard,
} from '../api/administracionApi.js'
import { formatearFechaLarga, hoyISO } from '../utils/fechas.js'
import TarjetaIndicador from '../components/TarjetaIndicador.jsx'

const MAX_PROXIMOS_DIAS = 3

// Mapeo visual de la severidad real del backend (no se muestra `codigo`).
const TONO_SEVERIDAD = { CRITICA: 'error', ADVERTENCIA: 'warning', INFO: 'info' }
const ETIQUETA_SEVERIDAD = { CRITICA: 'Crítica', ADVERTENCIA: 'Advertencia', INFO: 'Información' }

function formatearPorcentaje(valor) {
  return `${valor}%`
}

export default function DashboardPage() {
  // Resumen administrativo (endpoint agregado) para una fecha seleccionable.
  const [fecha, setFecha] = useState(() => hoyISO())
  const [resumen, setResumen] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  // Tarjeta independiente de próximos días no laborables.
  const [dias, setDias] = useState([])
  const [cargandoDias, setCargandoDias] = useState(true)
  const [errorDias, setErrorDias] = useState(null)

  const hoy = hoyISO()
  const fechaFutura = Boolean(fecha && fecha > hoy)

  const cargarResumen = useCallback(async () => {
    if (!fecha || fecha > hoyISO()) {
      setResumen(null)
      setCargando(false)
      setError(null)
      return
    }
    setCargando(true)
    setError(null)
    try {
      const datos = await obtenerResumenDashboard(fecha)
      setResumen(datos)
    } catch (fallo) {
      setResumen(null)
      setError(fallo?.message || 'No se pudo cargar el resumen administrativo')
    } finally {
      setCargando(false)
    }
  }, [fecha])

  const cargarDias = useCallback(async () => {
    setCargandoDias(true)
    setErrorDias(null)
    try {
      const lista = await listarDiasNoLaborablesFuturos()
      setDias(Array.isArray(lista) ? lista : [])
    } catch (fallo) {
      setDias([])
      setErrorDias(fallo?.message || 'No se pudieron cargar los días no laborables')
    } finally {
      setCargandoDias(false)
    }
  }, [])

  useEffect(() => {
    cargarResumen()
  }, [cargarResumen])

  useEffect(() => {
    cargarDias()
  }, [cargarDias])

  const proximosDias = [...dias]
    .sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)))
    .slice(0, MAX_PROXIMOS_DIAS)

  const estados = resumen
    ? [
        { etiqueta: 'Pendientes', valor: resumen.citasPendientes },
        { etiqueta: 'Confirmadas', valor: resumen.citasConfirmadas },
        { etiqueta: 'Atendidas', valor: resumen.citasAtendidas },
        { etiqueta: 'Canceladas', valor: resumen.citasCanceladas },
        { etiqueta: 'Reprogramadas', valor: resumen.citasReprogramadas },
      ]
    : []

  const ocupacionPorcentaje =
    resumen && resumen.capacidadTotal > 0
      ? Math.round((resumen.cuposOcupados / resumen.capacidadTotal) * 100)
      : 0

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h2 className="text-headline-md text-primary">Dashboard</h2>
        <p className="text-sm text-outline">Resumen general del Panel de Administración.</p>
        {resumen?.fecha && (
          <p className="text-sm font-medium text-on-surface-variant">
            Resumen del {formatearFechaLarga(resumen.fecha)}
          </p>
        )}
      </header>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label
            htmlFor="dashboard-fecha"
            className="block text-label-sm uppercase tracking-wider text-on-surface-variant"
          >
            Fecha
          </label>
          <input
            id="dashboard-fecha"
            type="date"
            value={fecha}
            max={hoy}
            onChange={(evento) => setFecha(evento.target.value)}
            className="rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <Button variant="secondary" onClick={() => setFecha(hoy)} disabled={fecha === hoy}>
          Hoy
        </Button>
        {fechaFutura && (
          <p role="alert" className="text-sm font-medium text-error">
            No se pueden consultar fechas futuras.
          </p>
        )}
      </div>

      {cargando && <Spinner label="Cargando resumen administrativo..." />}

      {!cargando && error && (
        <Alert tone="error" title="No se pudo cargar el resumen administrativo">
          <p className="mt-1">{error}</p>
          <div className="mt-3">
            <Button size="sm" variant="secondary" onClick={cargarResumen}>
              Reintentar
            </Button>
          </div>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {!cargando && !error && resumen && (
          <>
            <TarjetaIndicador
              testId="tarjeta-citas"
              titulo="Citas del día"
              icono="event"
              descripcion="Total de citas registradas para la jornada."
            >
              <p className="text-metric-display font-bold text-primary">{resumen.totalCitas}</p>
            </TarjetaIndicador>

            <TarjetaIndicador
              testId="tarjeta-capacidad"
              titulo="Capacidad y cupos"
              icono="event_available"
              descripcion="Cupos del día según la programación."
            >
              <dl className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-on-surface-variant">Capacidad total</dt>
                  <dd className="font-semibold text-on-surface">{resumen.capacidadTotal}</dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-on-surface-variant">Ocupados</dt>
                  <dd className="font-semibold text-on-surface">{resumen.cuposOcupados}</dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-on-surface-variant">Disponibles</dt>
                  <dd className="font-semibold text-primary">{resumen.cuposDisponibles}</dd>
                </div>
              </dl>
              {resumen.capacidadTotal > 0 && (
                <div className="mt-3">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container-high">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${ocupacionPorcentaje}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-outline">Ocupación: {ocupacionPorcentaje}%</p>
                </div>
              )}
            </TarjetaIndicador>

            <TarjetaIndicador
              testId="tarjeta-inasistencias"
              titulo="Inasistencias"
              icono="person_off"
              descripcion="Pacientes que no asistieron a su cita."
            >
              <p className="text-metric-sub font-bold text-on-surface">{resumen.inasistencias}</p>
              <p className="mt-1 text-sm text-on-surface-variant">
                Tasa de inasistencia: {formatearPorcentaje(resumen.tasaInasistencia)}
              </p>
            </TarjetaIndicador>

            <TarjetaIndicador
              testId="tarjeta-estados"
              titulo="Estados de cita"
              icono="fact_check"
              descripcion="Distribución de las citas del día."
            >
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1">
                {estados.map((estado) => (
                  <div key={estado.etiqueta} className="flex items-center justify-between gap-2">
                    <dt className="text-on-surface-variant">{estado.etiqueta}</dt>
                    <dd className="font-semibold text-on-surface">{estado.valor}</dd>
                  </div>
                ))}
              </dl>
            </TarjetaIndicador>

            <TarjetaIndicador
              testId="tarjeta-alertas"
              titulo="Alertas administrativas"
              icono="notifications"
              descripcion="Avisos generados por el sistema para la jornada."
            >
              {resumen.alertas.length === 0 ? (
                <p className="text-sm text-on-surface-variant">Sin alertas administrativas</p>
              ) : (
                <ul className="space-y-2">
                  {resumen.alertas.map((alerta, indice) => (
                    <li key={alerta.codigo ?? indice}>
                      <Alert
                        tone={TONO_SEVERIDAD[alerta.severidad] ?? 'info'}
                        title={ETIQUETA_SEVERIDAD[alerta.severidad] ?? alerta.severidad}
                      >
                        <p>{alerta.mensaje}</p>
                      </Alert>
                    </li>
                  ))}
                </ul>
              )}
            </TarjetaIndicador>
          </>
        )}

        <TarjetaIndicador
          testId="tarjeta-dias-no-laborables"
          titulo="Próximos días no laborables"
          icono="calendar_month"
          descripcion="Feriados y asuetos institucionales registrados por administración."
          accion={
            <Link
              to="/administracion/calendario"
              className="inline-flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-surface-container-low focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <Icon name="calendar_month" className="text-[16px]" />
              Ver calendario
            </Link>
          }
        >
          {cargandoDias && <Spinner label="Cargando próximos días no laborables..." />}

          {!cargandoDias && errorDias && (
            <Alert tone="error" title="No se pudieron cargar los días no laborables">
              <p className="mt-1">{errorDias}</p>
              <div className="mt-3">
                <Button size="sm" variant="secondary" onClick={cargarDias}>
                  Reintentar
                </Button>
              </div>
            </Alert>
          )}

          {!cargandoDias && !errorDias && proximosDias.length === 0 && (
            <p className="text-sm text-on-surface-variant">
              No hay próximos días no laborables registrados.
            </p>
          )}

          {!cargandoDias && !errorDias && proximosDias.length > 0 && (
            <ul className="space-y-2">
              {proximosDias.map((dia) => (
                <li key={dia.id} className="rounded-lg bg-surface-container-low px-3 py-2">
                  <p className="text-sm font-semibold text-on-surface">
                    {formatearFechaLarga(dia.fecha)}
                  </p>
                  <p className="break-words text-xs text-on-surface-variant">{dia.motivo}</p>
                </li>
              ))}
            </ul>
          )}
        </TarjetaIndicador>
      </div>
    </section>
  )
}
