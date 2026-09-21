import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Alert from '@/shared/components/ui/Alert.jsx'
import Button from '@/shared/components/ui/Button.jsx'
import Icon from '@/shared/components/ui/Icon.jsx'
import Spinner from '@/shared/components/ui/Spinner.jsx'
import { listarDiasNoLaborablesFuturos } from '../api/administracionApi.js'
import { formatearFechaLarga } from '../utils/fechas.js'
import TarjetaIndicador from '../components/TarjetaIndicador.jsx'

const MAX_PROXIMOS_DIAS = 3

// Indicadores operativos sin contrato agregado confirmado en el backend vigente.
// Se muestran como pendientes y no realizan HTTP ni presentan cifras.
const INDICADORES_PENDIENTES = [
  {
    titulo: 'Citas del día',
    icono: 'event',
    descripcion: 'Resumen de las citas programadas para la jornada.',
  },
  {
    titulo: 'Cupos disponibles',
    icono: 'event_available',
    descripcion: 'Disponibilidad de cupos por clínica.',
  },
  {
    titulo: 'Inasistencias',
    icono: 'person_off',
    descripcion: 'Pacientes que no asistieron a su cita.',
  },
  {
    titulo: 'Alertas administrativas',
    icono: 'notifications',
    descripcion: 'Avisos pendientes de revisión por administración.',
  },
]

export default function DashboardPage() {
  const [dias, setDias] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const lista = await listarDiasNoLaborablesFuturos()
      setDias(Array.isArray(lista) ? lista : [])
    } catch (fallo) {
      setDias([])
      setError(fallo?.message || 'No se pudieron cargar los días no laborables')
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  // Orden de presentación por fecha ISO (comparación lexicográfica, sin `new Date`).
  const proximosDias = [...dias]
    .sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)))
    .slice(0, MAX_PROXIMOS_DIAS)

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h2 className="text-headline-lg text-hro-blue">Dashboard</h2>
        <p className="text-sm text-slate-500">Resumen general del Panel de Administración.</p>
      </header>

      <Alert tone="info" title="Indicadores operativos en espera de contrato backend">
        Los indicadores de citas, cupos e inasistencias aún no cuentan con un endpoint agregado en
        el backend. Se muestran sin cifras para no presentar datos que el servidor no expone. La
        información institucional sí se consulta en tiempo real.
      </Alert>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {INDICADORES_PENDIENTES.map((indicador) => (
          <TarjetaIndicador
            key={indicador.titulo}
            testId="tarjeta-pendiente"
            titulo={indicador.titulo}
            icono={indicador.icono}
            descripcion={indicador.descripcion}
          >
            <p className="inline-flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500">
              <Icon name="hourglass_empty" className="text-[16px]" />
              Pendiente de contrato backend
            </p>
          </TarjetaIndicador>
        ))}

        <TarjetaIndicador
          testId="tarjeta-dias-no-laborables"
          titulo="Próximos días no laborables"
          icono="calendar_month"
          descripcion="Feriados y asuetos institucionales registrados por administración."
          accion={
            <Link
              to="/administracion/calendario"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-hro-blue transition hover:bg-cyan-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hro-blue"
            >
              <Icon name="calendar_month" className="text-[16px]" />
              Ver calendario
            </Link>
          }
        >
          {cargando && <Spinner label="Cargando próximos días no laborables..." />}

          {!cargando && error && (
            <Alert tone="error" title="No se pudieron cargar los días no laborables">
              <p className="mt-1">{error}</p>
              <div className="mt-3">
                <Button size="sm" variant="secondary" onClick={cargar}>
                  Reintentar
                </Button>
              </div>
            </Alert>
          )}

          {!cargando && !error && proximosDias.length === 0 && (
            <p className="text-sm text-slate-500">
              No hay próximos días no laborables registrados.
            </p>
          )}

          {!cargando && !error && proximosDias.length > 0 && (
            <ul className="space-y-2">
              {proximosDias.map((dia) => (
                <li key={dia.id} className="rounded-lg bg-slate-50 px-3 py-2">
                  <p className="text-sm font-semibold text-slate-700">
                    {formatearFechaLarga(dia.fecha)}
                  </p>
                  <p className="text-xs text-slate-500">{dia.motivo}</p>
                </li>
              ))}
            </ul>
          )}
        </TarjetaIndicador>
      </div>
    </section>
  )
}
