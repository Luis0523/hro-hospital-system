import { useEffect, useMemo, useState } from 'react'
import Alert from '@/shared/components/ui/Alert.jsx'
import Button from '@/shared/components/ui/Button.jsx'
import Icon from '@/shared/components/ui/Icon.jsx'
import ModalGenerandoPdf from '@/shared/components/ui/ModalGenerandoPdf.jsx'
import Select from '@/shared/components/ui/Select.jsx'
import Spinner from '@/shared/components/ui/Spinner.jsx'
import { useToast } from '@/shared/context/ToastContext.jsx'
import { descargarBlob } from '@/modules/archivo/utils/descargarBlob'
import {
  descargarSalidasEnfermeriaArchivoPdf,
  listarSalidasEnfermeriaArchivo,
} from '@/modules/enfermeria/api/salidaEnfermeriaArchivoApi'
import { listarClinicas, obtenerLibro } from '@/modules/enfermeria/api/seguimientoApi'
import { hoyIso } from '@/shared/utils/fecha'
import { listarEstaciones } from '../api/jefeEnfermeriaApi'
import {
  calcularEstadisticasEnfermeria,
  construirPdfConsolidadoEnfermeria,
  htmlConsolidadoEnfermeria,
} from '../utils/estadisticasEnfermeria'

const claseCampo =
  'h-10 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-body-md text-on-surface outline-none focus:border-primary-container focus:ring-2 focus:ring-secondary-fixed-dim'

const COLORES = [
  '#1f3a5f',
  '#0f766e',
  '#7c3aed',
  '#b45309',
  '#be123c',
  '#0369a1',
  '#4d7c0f',
  '#9333ea',
  '#c2410c',
  '#0891b2',
]

function Metrica({ etiqueta, valor, icono, tono = 'text-primary' }) {
  return (
    <article className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <p className="text-label-sm uppercase tracking-wide text-on-surface-variant">{etiqueta}</p>
        <Icon name={icono} className={`text-[22px] ${tono}`} />
      </div>
      <p className="mt-2 text-headline-lg font-black tabular-nums text-on-surface">{valor}</p>
    </article>
  )
}

function Barras({ items, color = '#1f3a5f', vacio = 'Sin datos para mostrar.' }) {
  const maximo = Math.max(0, ...items.map((item) => item.valor ?? 0))
  if (items.length === 0) {
    return <p className="text-body-sm text-on-surface-variant">{vacio}</p>
  }
  return (
    <ul className="space-y-2">
      {items.map((item, indice) => (
        <li key={item.id ?? item.nombre ?? indice}>
          <div className="flex items-center justify-between gap-2 text-body-sm text-on-surface">
            <span className="min-w-0 truncate" title={item.nombre}>
              {item.nombre}
            </span>
            <span className="shrink-0 font-semibold tabular-nums">{item.valor ?? 0}</span>
          </div>
          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-surface-container">
            <div
              className="h-full rounded-full"
              style={{
                width: `${maximo > 0 ? Math.round(((item.valor ?? 0) / maximo) * 100) : 0}%`,
                backgroundColor: item.color ?? color,
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}

function Donut({ titulo, partes, centro }) {
  const total = partes.reduce((suma, parte) => suma + (parte.valor ?? 0), 0)
  const circunferencia = 2 * Math.PI * 46
  let acumulado = 0

  return (
    <div className="flex items-center gap-4">
      <svg
        viewBox="0 0 120 120"
        className="h-28 w-28 shrink-0 -rotate-90"
        role="img"
        aria-label={titulo}
      >
        <circle
          cx="60"
          cy="60"
          r="46"
          fill="none"
          stroke="currentColor"
          className="text-surface-container-high"
          strokeWidth="14"
        />
        {total > 0 &&
          partes.map((parte) => {
            const fraccion = (parte.valor ?? 0) / total
            const trazo = fraccion * circunferencia
            const offset = -acumulado * circunferencia
            acumulado += fraccion
            return (
              <circle
                key={parte.id ?? parte.nombre}
                cx="60"
                cy="60"
                r="46"
                fill="none"
                stroke={parte.color}
                strokeWidth="14"
                strokeDasharray={`${trazo} ${circunferencia - trazo}`}
                strokeDashoffset={offset}
                strokeLinecap="butt"
              />
            )
          })}
      </svg>
      <div className="min-w-0">
        <p className="text-label-md font-semibold text-on-surface">{titulo}</p>
        <p className="text-headline-md font-black tabular-nums text-on-surface">
          {centro ?? total}
        </p>
        <ul className="mt-1 space-y-0.5">
          {partes.map((parte) => (
            <li
              key={parte.id ?? parte.nombre}
              className="flex items-center gap-1.5 text-label-sm text-on-surface-variant"
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: parte.color }} />
              {parte.nombre}: <strong className="text-on-surface">{parte.valor ?? 0}</strong>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function TablaEspecialidades({ filas }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-body-sm">
        <thead>
          <tr className="text-left text-label-sm uppercase tracking-wide text-on-surface-variant">
            <th className="py-2 pr-3">Especialidad</th>
            <th className="py-2 pr-3 text-right">Pacientes</th>
            <th className="py-2 pr-3 text-right">Presentaciones</th>
            <th className="py-2 text-right">Privados</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant">
          {filas.map((fila) => (
            <tr key={fila.id} className="text-on-surface">
              <td className="py-2 pr-3">{fila.nombre}</td>
              <td className="py-2 pr-3 text-right tabular-nums">{fila.total}</td>
              <td className="py-2 pr-3 text-right tabular-nums">{fila.presentaciones}</td>
              <td className="py-2 text-right tabular-nums">{fila.privadosLibertad}</td>
            </tr>
          ))}
          {filas.length === 0 && (
            <tr>
              <td colSpan={4} className="py-3 text-on-surface-variant">
                Sin datos para la fecha.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

function TablaClinicas({ filas }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-body-sm">
        <thead>
          <tr className="text-left text-label-sm uppercase tracking-wide text-on-surface-variant">
            <th className="py-2 pr-3">Clínica</th>
            <th className="py-2 pr-3 text-right">Pacientes</th>
            <th className="py-2 pr-3 text-right">Presentaciones</th>
            <th className="py-2 text-right">Pendientes</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant">
          {filas.map((fila) => (
            <tr key={fila.id} className="text-on-surface">
              <td className="py-2 pr-3">{fila.nombre}</td>
              <td className="py-2 pr-3 text-right tabular-nums">{fila.pacientes}</td>
              <td className="py-2 pr-3 text-right tabular-nums">{fila.presentaciones}</td>
              <td className="py-2 text-right tabular-nums">{fila.pendientes}</td>
            </tr>
          ))}
          {filas.length === 0 && (
            <tr>
              <td colSpan={4} className="py-3 text-on-surface-variant">
                Sin datos para la fecha.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

function ListaMovil({ filas, tipo }) {
  return (
    <div className="space-y-2 xl:hidden">
      {filas.map((fila) => (
        <article
          key={fila.id}
          className="rounded-xl border border-outline-variant bg-surface-container-low p-3"
        >
          <p className="font-semibold text-on-surface">{fila.nombre}</p>
          {tipo === 'especialidad' ? (
            <dl className="mt-1 grid grid-cols-3 gap-2 text-label-sm">
              <div>
                <dt className="text-on-surface-variant">Pacientes</dt>
                <dd className="font-semibold tabular-nums text-on-surface">{fila.total}</dd>
              </div>
              <div>
                <dt className="text-on-surface-variant">Present.</dt>
                <dd className="font-semibold tabular-nums text-on-surface">
                  {fila.presentaciones}
                </dd>
              </div>
              <div>
                <dt className="text-on-surface-variant">Privados</dt>
                <dd className="font-semibold tabular-nums text-on-surface">
                  {fila.privadosLibertad}
                </dd>
              </div>
            </dl>
          ) : (
            <dl className="mt-1 grid grid-cols-3 gap-2 text-label-sm">
              <div>
                <dt className="text-on-surface-variant">Pacientes</dt>
                <dd className="font-semibold tabular-nums text-on-surface">{fila.pacientes}</dd>
              </div>
              <div>
                <dt className="text-on-surface-variant">Present.</dt>
                <dd className="font-semibold tabular-nums text-on-surface">
                  {fila.presentaciones}
                </dd>
              </div>
              <div>
                <dt className="text-on-surface-variant">Pendientes</dt>
                <dd className="font-semibold tabular-nums text-on-surface">{fila.pendientes}</dd>
              </div>
            </dl>
          )}
        </article>
      ))}
      {filas.length === 0 && (
        <p className="rounded-xl border border-dashed border-outline-variant p-6 text-center text-body-sm text-on-surface-variant">
          Sin datos para la fecha.
        </p>
      )}
    </div>
  )
}

export default function ReportesPage() {
  const { mostrarToast } = useToast()
  const [fecha, setFecha] = useState(() => hoyIso())
  const [estaciones, setEstaciones] = useState([])
  const [estacionId, setEstacionId] = useState('')
  const [libro, setLibro] = useState(null)
  const [clinicas, setClinicas] = useState([])
  const [salidas, setSalidas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [generando, setGenerando] = useState(null)
  const [progreso, setProgreso] = useState(0)

  useEffect(() => {
    let activo = true
    listarEstaciones()
      .then((lista) => {
        if (!activo) return
        const normalizadas = Array.isArray(lista) ? lista : []
        setEstaciones(normalizadas)
        setEstacionId(
          (actual) => actual || (normalizadas[0]?.id != null ? String(normalizadas[0].id) : ''),
        )
      })
      .catch(() => {
        if (activo) setEstaciones([])
      })
    return () => {
      activo = false
    }
  }, [])

  useEffect(() => {
    if (!estacionId) {
      setCargando(false)
      return undefined
    }
    let activo = true
    setCargando(true)
    setError(null)

    Promise.all([
      obtenerLibro(estacionId, fecha),
      listarClinicas({ estacionId, fecha }),
      listarSalidasEnfermeriaArchivo({ fecha, estacionId }),
    ])
      .then(([libroCargado, clinicasCargadas, salidasCargadas]) => {
        if (!activo) return
        setLibro(libroCargado)
        setClinicas(Array.isArray(clinicasCargadas) ? clinicasCargadas : [])
        setSalidas(Array.isArray(salidasCargadas) ? salidasCargadas : [])
      })
      .catch((fallo) => {
        if (!activo) return
        setError(fallo?.message ?? 'No se pudieron calcular las estadísticas.')
        setLibro(null)
        setClinicas([])
        setSalidas([])
      })
      .finally(() => {
        if (activo) setCargando(false)
      })

    return () => {
      activo = false
    }
  }, [estacionId, fecha])

  const estacion = useMemo(
    () => estaciones.find((item) => String(item.id) === String(estacionId)) ?? null,
    [estaciones, estacionId],
  )

  const estadisticas = useMemo(
    () => calcularEstadisticasEnfermeria({ libro, clinicas, salidas }),
    [libro, clinicas, salidas],
  )

  const opcionesEstacion = useMemo(
    () =>
      estaciones.map((item) => ({
        value: String(item.id),
        label: `${item.codigo ?? item.id} · ${item.nombre ?? ''}`,
      })),
    [estaciones],
  )

  const clinicasGrafica = useMemo(
    () =>
      estadisticas.porClinica.slice(0, 10).map((clinica, indice) => ({
        ...clinica,
        nombre: clinica.nombre,
        color: COLORES[indice % COLORES.length],
      })),
    [estadisticas],
  )

  function simularProgreso(duracionMs = 1800) {
    const inicio = Date.now()
    setProgreso(0)
    return setInterval(() => {
      const avance = Math.min(92, Math.round(((Date.now() - inicio) / duracionMs) * 92))
      setProgreso((actual) => Math.max(actual, avance))
    }, 50)
  }

  async function descargarConsolidado() {
    if (generando) return
    setGenerando('consolidado')
    const timer = simularProgreso(1200)
    try {
      const blob = construirPdfConsolidadoEnfermeria({ estacion, fecha, estadisticas })
      setProgreso(100)
      descargarBlob(blob, `consolidado-enfermeria-${fecha}.pdf`)
      await new Promise((resolver) => setTimeout(resolver, 300))
    } catch (fallo) {
      mostrarToast({
        tone: 'error',
        title: 'No se pudo generar el consolidado',
        message: fallo?.message,
      })
    } finally {
      clearInterval(timer)
      setGenerando(null)
      setProgreso(0)
    }
  }

  async function descargarPdfArchivo() {
    if (generando || !estacionId) return
    setGenerando('archivo')
    const timer = simularProgreso(2200)
    try {
      const blob = await descargarSalidasEnfermeriaArchivoPdf({ fecha, estacionId })
      setProgreso(100)
      if (blob) descargarBlob(blob, `salida-enfermeria-archivo-${fecha}.pdf`)
      await new Promise((resolver) => setTimeout(resolver, 350))
    } catch (fallo) {
      mostrarToast({
        tone: 'error',
        title: 'No se pudo descargar el reporte de Archivo',
        message: fallo?.message,
      })
    } finally {
      clearInterval(timer)
      setGenerando(null)
      setProgreso(0)
    }
  }

  function imprimirConsolidado() {
    const ventana = window.open('', '_blank')
    if (!ventana) {
      mostrarToast({
        tone: 'warning',
        title: 'Permita las ventanas emergentes para imprimir',
      })
      return
    }
    ventana.document.write(htmlConsolidadoEnfermeria({ estacion, fecha, estadisticas }))
    ventana.document.close()
  }

  const mostrarCarga = cargando || (Boolean(estacionId) && !libro && !error)

  const especialidadesGrafica = estadisticas.porEspecialidad
    .filter((especialidad) => especialidad.total > 0)
    .slice(0, 12)
    .map((especialidad, indice) => ({
      id: especialidad.id,
      nombre: especialidad.nombre,
      valor: especialidad.total,
      color: COLORES[indice % COLORES.length],
    }))

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-headline-lg text-on-surface">Estadísticas y reportes</h2>
          <p className="text-body-md text-on-surface-variant">
            Pacientes, etiquetas y reparto del día en la estación de enfermería, con consolidado
            descargable.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={imprimirConsolidado}
            disabled={mostrarCarga || Boolean(generando)}
          >
            <Icon name="print" className="text-[18px]" />
            Imprimir
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={descargarConsolidado}
            disabled={mostrarCarga || Boolean(generando)}
          >
            <Icon name="picture_as_pdf" className="text-[18px]" />
            Consolidado PDF
          </Button>
          <Button
            size="sm"
            onClick={descargarPdfArchivo}
            disabled={mostrarCarga || !estacionId || Boolean(generando)}
          >
            <Icon name="picture_as_pdf" className="text-[18px]" />
            PDF de Archivo
          </Button>
        </div>
      </header>

      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest p-3 shadow-card">
        <label className="flex flex-col gap-1">
          <span className="text-label-sm uppercase tracking-wide text-on-surface-variant">
            Fecha
          </span>
          <input
            type="date"
            value={fecha}
            onChange={(evento) => setFecha(evento.target.value)}
            className={claseCampo}
          />
        </label>
        <Select
          label="Estación"
          ariaLabel="Estación de enfermería"
          value={estacionId}
          onChange={setEstacionId}
          options={opcionesEstacion}
          placeholder={estaciones.length === 0 ? 'Cargando estaciones…' : 'Seleccione estación'}
          className="w-64 sm:w-80"
        />
        <p className="ml-auto max-w-md text-label-sm text-on-surface-variant">
          <strong className="text-on-surface">PDF de Archivo</strong> es el mismo reporte que se
          genera en Seguimiento de turnos → Archivo.
        </p>
      </div>

      {error && (
        <Alert tone="error" title="Atención">
          {error}
        </Alert>
      )}

      {mostrarCarga ? (
        <div className="flex justify-center py-16">
          <Spinner label="Calculando estadísticas…" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
            <Metrica
              etiqueta="Pacientes del día"
              valor={estadisticas.totalPacientes}
              icono="groups"
            />
            <Metrica
              etiqueta="Presentaciones"
              valor={estadisticas.presentaciones}
              icono="gavel"
              tono="text-cyan-600 dark:text-cyan-300"
            />
            <Metrica
              etiqueta="Privados de libertad"
              valor={estadisticas.privadosLibertad}
              icono="lock"
              tono="text-rose-600 dark:text-rose-300"
            />
            <Metrica
              etiqueta="Personal"
              valor={estadisticas.personal}
              icono="badge"
              tono="text-amber-600 dark:text-amber-300"
            />
            <Metrica
              etiqueta="Primera vez"
              valor={estadisticas.primeraVez}
              icono="new_releases"
              tono="text-violet-600 dark:text-violet-300"
            />
            <Metrica
              etiqueta="Clínica de la Mujer"
              valor={estadisticas.clinicaMujer}
              icono="pregnant_woman"
              tono="text-fuchsia-600 dark:text-fuchsia-300"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-card">
              <h3 className="mb-3 flex items-center gap-2 text-title-md uppercase text-on-surface">
                <Icon name="monitoring" className="text-[20px] text-primary" />
                Comparación por especialidad
              </h3>
              <Barras
                items={especialidadesGrafica}
                vacio="No hay turnos registrados para la fecha."
              />
            </section>

            <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-card">
              <h3 className="mb-3 flex items-center gap-2 text-title-md uppercase text-on-surface">
                <Icon name="donut_large" className="text-[20px] text-primary" />
                Reparto por clínica
              </h3>
              <Donut
                titulo="Pacientes asignados"
                partes={clinicasGrafica}
                centro={estadisticas.porClinica.reduce(
                  (total, clinica) => total + clinica.pacientes,
                  0,
                )}
              />
            </section>

            <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-card">
              <h3 className="mb-3 flex items-center gap-2 text-title-md uppercase text-on-surface">
                <Icon name="account_tree" className="text-[20px] text-primary" />
                Etapas del flujo
              </h3>
              <Barras
                items={estadisticas.etapas.map((etapa, indice) => ({
                  id: etapa.id,
                  nombre: etapa.nombre,
                  valor: etapa.valor,
                  color: COLORES[indice % COLORES.length],
                }))}
              />
            </section>

            <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-card">
              <h3 className="mb-3 flex items-center gap-2 text-title-md uppercase text-on-surface">
                <Icon name="label" className="text-[20px] text-primary" />
                Salidas a Archivo por etiqueta
              </h3>
              <Barras
                items={estadisticas.salidasPorTipo.map((tipo, indice) => ({
                  id: tipo.id,
                  nombre: tipo.nombre,
                  valor: tipo.valor,
                  color: COLORES[(indice + 2) % COLORES.length],
                }))}
                vacio="Aún no hay salidas de Enfermería a Archivo."
              />
              <p className="mt-3 text-label-sm text-on-surface-variant">
                Total de salidas:{' '}
                <strong className="text-on-surface">{estadisticas.totalSalidas}</strong>
              </p>
            </section>
          </div>

          <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-card">
            <h3 className="mb-3 flex items-center gap-2 text-title-md uppercase text-on-surface">
              <Icon name="table_chart" className="text-[20px] text-primary" />
              Detalle por especialidad
            </h3>
            <ListaMovil filas={estadisticas.porEspecialidad} tipo="especialidad" />
            <div className="hidden xl:block">
              <TablaEspecialidades filas={estadisticas.porEspecialidad} />
            </div>
          </section>

          <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-card">
            <h3 className="mb-3 flex items-center gap-2 text-title-md uppercase text-on-surface">
              <Icon name="meeting_room" className="text-[20px] text-primary" />
              Detalle del reparto en clínicas
            </h3>
            <ListaMovil filas={estadisticas.porClinica} tipo="clinica" />
            <div className="hidden xl:block">
              <TablaClinicas filas={estadisticas.porClinica} />
            </div>
          </section>

          <p className="text-label-sm text-on-surface-variant">
            Estación: {estacion?.nombre ?? 'Sin estación'} · Fecha: {fecha}
          </p>
        </>
      )}

      <ModalGenerandoPdf abierto={Boolean(generando)} progreso={progreso} />
    </section>
  )
}
