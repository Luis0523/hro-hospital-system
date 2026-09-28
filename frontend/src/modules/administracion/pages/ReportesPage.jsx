import { useCallback, useEffect, useRef, useState } from 'react'
import Alert from '@/shared/components/ui/Alert.jsx'
import Button from '@/shared/components/ui/Button.jsx'
import Icon from '@/shared/components/ui/Icon.jsx'
import Spinner from '@/shared/components/ui/Spinner.jsx'
import {
  listarSubespecialidades,
  obtenerReporteCitasPorEstado,
  obtenerReporteDemandaPorEspecialidad,
  obtenerReporteUtilizacionCupos,
} from '../api/administracionApi.js'
import { hoyISO, restarDiasISO } from '../utils/fechas.js'
import FiltroRangoFechas from '../components/FiltroRangoFechas.jsx'
import ReporteCitasPorEstado from '../components/ReporteCitasPorEstado.jsx'
import ReporteDemandaEspecialidad from '../components/ReporteDemandaEspecialidad.jsx'
import ReporteUtilizacionCupos from '../components/ReporteUtilizacionCupos.jsx'

const PESTANAS = [
  { id: 'citas', etiqueta: 'Citas por estado', icono: 'event_note' },
  { id: 'demanda', etiqueta: 'Demanda', icono: 'insights' },
  { id: 'utilizacion', etiqueta: 'Utilización', icono: 'event_available' },
]

const MENSAJE_RANGO = 'La fecha final no puede ser anterior a la fecha inicial.'

export default function ReportesPage() {
  const [pestana, setPestana] = useState('citas')
  const tabsRef = useRef([])

  const [fechaInicio, setFechaInicio] = useState(() => restarDiasISO(hoyISO(), 30))
  const [fechaFin, setFechaFin] = useState(() => hoyISO())
  const [subespecialidadId, setSubespecialidadId] = useState('')
  const [subespecialidades, setSubespecialidades] = useState([])

  const [datos, setDatos] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [recarga, setRecarga] = useState(0)

  const rangoInvalido = Boolean(fechaInicio && fechaFin && fechaFin < fechaInicio)

  useEffect(() => {
    let vigente = true
    listarSubespecialidades(undefined, 'activos')
      .then((lista) => {
        if (vigente) setSubespecialidades(Array.isArray(lista) ? lista : [])
      })
      .catch(() => {
        if (vigente) setSubespecialidades([])
      })
    return () => {
      vigente = false
    }
  }, [])

  useEffect(() => {
    if (rangoInvalido) {
      setDatos(null)
      setCargando(false)
      setError(MENSAJE_RANGO)
      return undefined
    }

    let vigente = true
    setCargando(true)
    setError(null)

    const cargar = async () => {
      try {
        let resultado
        if (pestana === 'citas') {
          resultado = await obtenerReporteCitasPorEstado({ fechaInicio, fechaFin })
        } else if (pestana === 'demanda') {
          resultado = await obtenerReporteDemandaPorEspecialidad({ fechaInicio, fechaFin })
        } else {
          resultado = await obtenerReporteUtilizacionCupos({
            fechaInicio,
            fechaFin,
            subespecialidadId: subespecialidadId ? Number(subespecialidadId) : undefined,
          })
        }
        if (vigente) setDatos(resultado)
      } catch (fallo) {
        if (vigente) {
          setDatos(null)
          setError(fallo?.message || 'No se pudo cargar el reporte')
        }
      } finally {
        if (vigente) setCargando(false)
      }
    }

    cargar()
    return () => {
      vigente = false
    }
  }, [pestana, fechaInicio, fechaFin, subespecialidadId, rangoInvalido, recarga])

  const manejarTeclado = (evento) => {
    const indiceActual = PESTANAS.findIndex((item) => item.id === pestana)
    let siguiente = null

    if (evento.key === 'ArrowRight') siguiente = (indiceActual + 1) % PESTANAS.length
    else if (evento.key === 'ArrowLeft')
      siguiente = (indiceActual - 1 + PESTANAS.length) % PESTANAS.length
    else if (evento.key === 'Home') siguiente = 0
    else if (evento.key === 'End') siguiente = PESTANAS.length - 1

    if (siguiente === null) return
    evento.preventDefault()
    setPestana(PESTANAS[siguiente].id)
    tabsRef.current[siguiente]?.focus()
  }

  const reintentar = useCallback(() => setRecarga((valor) => valor + 1), [])

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h2 className="text-headline-md text-primary">Reportes</h2>
        <p className="text-sm text-outline">
          Consulta de información administrativa sobre citas, demanda y capacidad.
        </p>
      </header>

      <FiltroRangoFechas
        fechaInicio={fechaInicio}
        fechaFin={fechaFin}
        onCambiarInicio={setFechaInicio}
        onCambiarFin={setFechaFin}
        error={rangoInvalido ? MENSAJE_RANGO : null}
      />

      <div
        role="tablist"
        aria-label="Reportes administrativos"
        onKeyDown={manejarTeclado}
        className="flex w-fit max-w-full gap-1 overflow-x-auto rounded-lg bg-surface-container-low p-0.5"
      >
        {PESTANAS.map((item, indice) => {
          const activa = item.id === pestana
          return (
            <button
              key={item.id}
              ref={(nodo) => {
                tabsRef.current[indice] = nodo
              }}
              type="button"
              role="tab"
              id={`tab-${item.id}`}
              aria-selected={activa}
              aria-controls="panel-reportes"
              tabIndex={activa ? 0 : -1}
              onClick={() => setPestana(item.id)}
              className={`inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-title-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                activa
                  ? 'bg-surface-container-lowest text-primary shadow-sm'
                  : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
              }`}
            >
              <Icon name={item.icono} className="text-[18px]" />
              {item.etiqueta}
            </button>
          )
        })}
      </div>

      <div role="tabpanel" id="panel-reportes" aria-labelledby={`tab-${pestana}`} className="space-y-4">
        {pestana === 'utilizacion' && (
          <div className="w-full space-y-1 sm:w-64">
            <label
              htmlFor="reporte-subespecialidad"
              className="block text-label-sm uppercase tracking-wider text-on-surface-variant"
            >
              Subespecialidad
            </label>
            <select
              id="reporte-subespecialidad"
              value={subespecialidadId}
              onChange={(evento) => setSubespecialidadId(evento.target.value)}
              className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-2 py-2 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Todas</option>
              {subespecialidades.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.nombre}
                </option>
              ))}
            </select>
          </div>
        )}

        {cargando && <Spinner label="Cargando reporte..." />}

        {!cargando && error && !rangoInvalido && (
          <Alert tone="error" title="No se pudo cargar el reporte">
            <p>{error}</p>
            <div className="mt-3">
              <Button size="sm" variant="secondary" onClick={reintentar}>
                Reintentar
              </Button>
            </div>
          </Alert>
        )}

        {!cargando && !rangoInvalido && !error && pestana === 'citas' && (
          <ReporteCitasPorEstado datos={datos} />
        )}
        {!cargando && !rangoInvalido && !error && pestana === 'demanda' && (
          <ReporteDemandaEspecialidad items={datos?.items ?? []} />
        )}
        {!cargando && !rangoInvalido && !error && pestana === 'utilizacion' && (
          <ReporteUtilizacionCupos datos={datos} />
        )}
      </div>
    </section>
  )
}
