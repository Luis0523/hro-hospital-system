import { useEffect, useState } from 'react'
import { Alert, Button, Icon, ModalGenerandoPdf, Spinner } from '@/shared/components/ui'
import { useToast } from '@/shared/context/ToastContext.jsx'
import {
  ETIQUETAS_ESTADO_CARNET,
  buscarCarnetPorExpediente,
  descargarTrazabilidadCarnetPdf,
  obtenerConfiguracionArchivo,
} from '@/modules/carnets/api/carnetsApi'
import { formatearExpediente } from '@/shared/utils/expediente'
import { descargarSalidasHospitalPdf } from '../api/salidaArchivoHospitalApi'
import { descargarBlob } from '../utils/descargarBlob'
import { useDashboardJefeArchivo } from '../hooks/useDashboardJefeArchivo'

function Donut({ titulo, partes, centro }) {
  const total = partes.reduce((suma, parte) => suma + (parte.valor ?? 0), 0)
  const circunferencia = 2 * Math.PI * 46
  let acumulado = 0

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 shadow-card">
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
                key={parte.etiqueta}
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
              key={parte.etiqueta}
              className="flex items-center gap-1.5 text-label-sm text-on-surface-variant"
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: parte.color }} />
              {parte.etiqueta}: <strong className="text-on-surface">{parte.valor ?? 0}</strong>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
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

// Dashboard administrativo del Jefe de Archivo (solo administración).
export default function DashboardArchivoPage() {
  const { fecha, setFecha, estadisticas, cargando, error, refrescar } = useDashboardJefeArchivo()
  const { mostrarToast } = useToast()
  const [generando, setGenerando] = useState(false)
  const [progreso, setProgreso] = useState(0)
  const [codigo, setCodigo] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [carnet, setCarnet] = useState(null)
  const [umbral, setUmbral] = useState(null)
  const [generandoTrazabilidad, setGenerandoTrazabilidad] = useState(false)
  const [progresoTrazabilidad, setProgresoTrazabilidad] = useState(0)

  useEffect(() => {
    obtenerConfiguracionArchivo()
      .then((config) => setUmbral(config?.umbralActivo ?? null))
      .catch(() => setUmbral(null))
  }, [])

  async function buscarExpediente(evento) {
    evento.preventDefault()
    const numero = String(codigo ?? '').trim()
    if (!numero || buscando) return
    setBuscando(true)
    try {
      const encontrado = await buscarCarnetPorExpediente(numero, { fecha })
      setCarnet(encontrado)
    } catch (fallo) {
      setCarnet(null)
      mostrarToast({
        tone: fallo?.status === 404 ? 'warning' : 'error',
        title: fallo?.status === 404 ? 'Expediente sin carnet hoy' : 'No se pudo buscar',
        message:
          fallo?.status === 404
            ? `No hay registro del expediente ${formatearExpediente(numero)} para esta fecha.`
            : fallo?.message,
      })
    } finally {
      setBuscando(false)
    }
  }

  function abrirImpresionTrazabilidad(valor) {
    const escapar = (dato) =>
      String(dato ?? '—').replace(/[&<>"']/g, (caracter) => {
        const mapa = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
        return mapa[caracter]
      })
    const filas = (valor.movimientos ?? [])
      .map(
        (movimiento) => `<tr>
          <td>${movimiento.fechaMovimiento ? escapar(new Date(movimiento.fechaMovimiento).toLocaleString('es-GT')) : '—'}</td>
          <td>${escapar(ETIQUETAS_ESTADO_CARNET[movimiento.estadoNuevo] ?? movimiento.estadoNuevo)}</td>
          <td>${escapar(movimiento.usuarioNombre)}</td>
          <td>${escapar(movimiento.observacion)}</td>
        </tr>`,
      )
      .join('')
    const clasificacion = clasificacionDeCarnet(valor)
    const ventana = window.open('', '_blank')
    if (!ventana) return false
    ventana.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8" />
      <title>Trazabilidad ${escapar(valor.numeroExpediente)}</title>
      <style>
        body { font-family: Arial, sans-serif; color: #1a1a1a; margin: 32px; }
        h1 { font-size: 18px; margin: 0; }
        h2 { font-size: 14px; margin: 4px 0 16px; color: #5b6572; }
        .datos { margin-bottom: 14px; font-size: 12px; line-height: 1.6; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        th { background: #1f3a5f; color: #fff; padding: 6px; text-align: left; }
        td { border: 1px solid #9aa5b1; padding: 5px; }
        .firmas { margin-top: 48px; display: flex; justify-content: space-between; font-size: 11px; }
        .firma { width: 40%; border-top: 1px solid #1a1a1a; padding-top: 4px; text-align: center; }
      </style></head><body>
      <h1>HOSPITAL REGIONAL DE OCCIDENTE</h1>
      <h1>TRAZABILIDAD DE EXPEDIENTE</h1>
      <h2>Expediente ${escapar(formatearExpediente(valor.numeroExpediente))} · ${escapar(valor.pacienteNombre)}</h2>
      <div class="datos">
        <div><strong>Estado actual:</strong> ${escapar(ETIQUETAS_ESTADO_CARNET[valor.estado] ?? valor.estado)}</div>
        <div><strong>Clasificación:</strong> ${escapar(clasificacion ?? 'Sin clasificar')}</div>
        <div><strong>Especialidad:</strong> ${escapar(valor.especialidadNombre)}</div>
        <div><strong>Estación:</strong> ${escapar(valor.estacionNombre)}</div>
      </div>
      <table><thead><tr><th>Fecha y hora</th><th>Estado</th><th>Encargado</th><th>Observación</th></tr></thead>
      <tbody>${filas || '<tr><td colspan="4">Sin movimientos registrados.</td></tr>'}</tbody></table>
      <div class="firmas"><div class="firma">Archivo / Registro Médico</div><div class="firma">Jefe de Archivo</div></div>
      <script>window.onload = () => window.print()</script>
      </body></html>`)
    ventana.document.close()
    return true
  }

  async function descargarTrazabilidad() {
    if (!carnet || generandoTrazabilidad) return
    setGenerandoTrazabilidad(true)
    setProgresoTrazabilidad(0)
    const inicio = Date.now()
    const simulacionMs = 1800
    const timer = setInterval(() => {
      const avance = Math.min(92, Math.round(((Date.now() - inicio) / simulacionMs) * 92))
      setProgresoTrazabilidad((actual) => Math.max(actual, avance))
    }, 50)
    try {
      const [blob] = await Promise.all([
        descargarTrazabilidadCarnetPdf(carnet.id),
        new Promise((resolver) => setTimeout(resolver, simulacionMs)),
      ])
      clearInterval(timer)
      setProgresoTrazabilidad(100)
      if (blob) {
        descargarBlob(blob, `trazabilidad-${carnet.numeroExpediente}.pdf`)
      }
      await new Promise((resolver) => setTimeout(resolver, 350))
    } catch (fallo) {
      clearInterval(timer)
      if (fallo?.status === 404 && abrirImpresionTrazabilidad(carnet)) {
        mostrarToast({
          tone: 'info',
          title: 'Vista de impresión abierta',
          message: 'El backend aún no genera este PDF; guarde la impresión como PDF.',
        })
      } else {
        mostrarToast({
          tone: 'error',
          title: 'No se pudo generar el PDF',
          message: fallo?.message,
        })
      }
    } finally {
      clearInterval(timer)
      setGenerandoTrazabilidad(false)
      setProgresoTrazabilidad(0)
    }
  }

  function clasificacionDeCarnet(valor) {
    if (valor?.archivo) return valor.archivo
    if (umbral == null || valor?.numeroExpediente == null) return null
    const numero = Number.parseInt(valor.numeroExpediente, 10)
    if (Number.isNaN(numero)) return null
    return numero > umbral ? 'activo' : 'pasivo'
  }

  async function descargarReporte(estacionId = null) {
    if (generando) return
    setGenerando(true)
    setProgreso(0)

    const inicio = Date.now()
    const simulacionMs = 2200
    const timer = setInterval(() => {
      const avance = Math.min(92, Math.round(((Date.now() - inicio) / simulacionMs) * 92))
      setProgreso((actual) => Math.max(actual, avance))
    }, 50)

    try {
      const [blob] = await Promise.all([
        descargarSalidasHospitalPdf({ fecha, estacionId }),
        new Promise((resolver) => setTimeout(resolver, simulacionMs)),
      ])
      clearInterval(timer)
      setProgreso(100)
      if (blob) {
        const sufijo = estacionId ? `estacion-${estacionId}` : 'general'
        descargarBlob(blob, `salidas-archivo-${sufijo}-${fecha}.pdf`)
      }
      await new Promise((resolver) => setTimeout(resolver, 400))
    } catch (fallo) {
      clearInterval(timer)
      mostrarToast({
        tone: 'error',
        title: 'No se pudo generar el reporte',
        message: fallo?.message,
      })
    } finally {
      clearInterval(timer)
      setGenerando(false)
      setProgreso(0)
    }
  }

  const porEstacion = estadisticas?.porEstacion ?? []
  const porEstado = estadisticas?.porEstado ?? []
  const cuaderno = estadisticas?.cuadernoRojo

  return (
    <main className="mx-auto w-full max-w-7xl space-y-5 px-4 py-6">
      <header className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h2 className="text-headline-md text-primary">Dashboard administrativo de Archivo</h2>
          <p className="text-body-sm text-on-surface-variant">
            Salidas por estación, estados actuales y Cuaderno Rojo del día.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="inline-flex items-center gap-1 rounded-lg border border-outline-variant bg-surface-container-lowest px-2 py-1">
            <Icon name="calendar_today" className="text-[18px] text-primary" />
            <input
              type="date"
              value={fecha}
              onChange={(evento) => setFecha(evento.target.value)}
              aria-label="Fecha del dashboard"
              className="h-8 rounded-md bg-transparent text-label-sm font-semibold outline-none"
            />
          </label>
          <Button variant="secondary" onClick={refrescar} disabled={cargando}>
            <Icon name="refresh" className="text-[18px]" />
            Actualizar
          </Button>
          <Button
            onClick={() => descargarReporte(null)}
            disabled={generando || porEstacion.length === 0}
          >
            <Icon name="picture_as_pdf" className="text-[18px]" />
            Reporte general
          </Button>
        </div>
      </header>

      <section
        aria-label="Buscar expediente"
        className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 shadow-card"
      >
        <h3 className="mb-2 text-title-md text-on-surface">Buscar expediente y ver trazabilidad</h3>
        <form onSubmit={buscarExpediente} className="flex flex-col gap-2 sm:flex-row">
          <input
            value={codigo}
            onChange={(evento) => setCodigo(evento.target.value)}
            inputMode="numeric"
            placeholder="Número de expediente"
            aria-label="Número de expediente a buscar"
            className="h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 font-mono text-title-md font-bold tracking-wide text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 sm:max-w-xs"
          />
          <Button type="submit" disabled={buscando || !codigo.trim()}>
            <Icon name="search" className="text-[18px]" />
            {buscando ? 'Buscando…' : 'Buscar'}
          </Button>
        </form>

        {carnet && (
          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap items-center gap-2 rounded-lg bg-surface-container-low p-3">
              <span className="font-mono text-title-md font-black text-primary">
                {formatearExpediente(carnet.numeroExpediente)}
              </span>
              <span className="font-semibold text-on-surface">{carnet.pacienteNombre}</span>
              <span className="rounded bg-secondary-container/40 px-2 py-0.5 text-label-sm font-semibold text-primary">
                {ETIQUETAS_ESTADO_CARNET[carnet.estado] ?? carnet.estado}
              </span>
              {clasificacionDeCarnet(carnet) && (
                <span
                  className={`rounded px-2 py-0.5 text-label-sm font-bold ${
                    clasificacionDeCarnet(carnet) === 'activo'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {clasificacionDeCarnet(carnet) === 'activo' ? 'Activo' : 'Pasivo'}
                </span>
              )}
              <span className="text-label-sm text-on-surface-variant">
                {carnet.especialidadNombre}
                {carnet.estacionNombre ? ` · ${carnet.estacionNombre}` : ''}
              </span>
              <div className="ml-auto">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={descargarTrazabilidad}
                  disabled={generandoTrazabilidad}
                >
                  <Icon name="picture_as_pdf" className="text-[16px]" />
                  {generandoTrazabilidad ? 'Generando…' : 'PDF de trazabilidad'}
                </Button>
              </div>
            </div>

            {!carnet.movimientos || carnet.movimientos.length === 0 ? (
              <p className="text-body-sm text-on-surface-variant">Sin movimientos registrados.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="bg-surface-container-low text-label-sm uppercase text-on-surface-variant">
                    <tr>
                      <th className="px-3 py-2">Fecha y hora</th>
                      <th className="px-3 py-2">Estado</th>
                      <th className="px-3 py-2">Encargado</th>
                      <th className="px-3 py-2">Observación</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/60">
                    {carnet.movimientos.map((movimiento) => (
                      <tr key={movimiento.id}>
                        <td className="px-3 py-2 font-mono text-on-surface-variant">
                          {movimiento.fechaMovimiento
                            ? new Date(movimiento.fechaMovimiento).toLocaleString('es-GT', {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })
                            : '—'}
                        </td>
                        <td className="px-3 py-2 font-semibold text-on-surface">
                          {ETIQUETAS_ESTADO_CARNET[movimiento.estadoNuevo] ??
                            movimiento.estadoNuevo}
                        </td>
                        <td className="px-3 py-2 text-on-surface-variant">
                          {movimiento.usuarioNombre ?? '—'}
                        </td>
                        <td className="px-3 py-2 text-on-surface-variant">
                          {movimiento.observacion ?? '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </section>

      {cargando && <Spinner label="Cargando estadísticas…" />}

      {!cargando && error && (
        <Alert tone="error" title="No se pudieron cargar las estadísticas">
          <p className="mt-1">{error}</p>
          <div className="mt-3">
            <Button size="sm" variant="secondary" onClick={refrescar}>
              Reintentar
            </Button>
          </div>
        </Alert>
      )}

      {!cargando && !error && estadisticas && (
        <div className="space-y-5">
          <section aria-label="Resumen de salidas">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Metrica
                etiqueta="Salidas del día"
                valor={estadisticas.totalSalidas ?? 0}
                icono="outbound"
              />
              <Metrica
                etiqueta="Clínica de la Mujer"
                valor={estadisticas.totalClinicaMujer ?? 0}
                icono="female"
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

          <section aria-label="Gráficas del día" className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Donut
              titulo="Clínica de la Mujer"
              centro={estadisticas.totalSalidas ?? 0}
              partes={[
                {
                  etiqueta: 'Clínica de la Mujer',
                  valor: estadisticas.totalClinicaMujer ?? 0,
                  color: '#e11d48',
                },
                {
                  etiqueta: 'Otras estaciones',
                  valor: Math.max(
                    0,
                    (estadisticas.totalSalidas ?? 0) - (estadisticas.totalClinicaMujer ?? 0),
                  ),
                  color: '#3b82f6',
                },
              ]}
            />
            <Donut
              titulo="Activo vs pasivo"
              centro={estadisticas.totalSalidas ?? 0}
              partes={[
                { etiqueta: 'Activo', valor: estadisticas.totalActivos ?? 0, color: '#10b981' },
                { etiqueta: 'Pasivo', valor: estadisticas.totalPasivos ?? 0, color: '#f59e0b' },
              ]}
            />
          </section>

          <section
            aria-label="Salidas por estación"
            className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 shadow-card"
          >
            <h3 className="mb-3 text-title-md text-on-surface">
              Expedientes que salen por estación
            </h3>
            {porEstacion.length === 0 ? (
              <p className="text-body-sm text-on-surface-variant">
                No hay salidas registradas para la fecha seleccionada.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="bg-surface-container-low text-label-sm uppercase text-on-surface-variant">
                    <tr>
                      <th className="px-3 py-2">Estación</th>
                      <th className="px-3 py-2 text-center">Total</th>
                      <th className="px-3 py-2 text-center">Mujer</th>
                      <th className="px-3 py-2 text-center">Activos</th>
                      <th className="px-3 py-2 text-center">Pasivos</th>
                      <th className="px-3 py-2 text-right">Reporte</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/60">
                    {porEstacion.map((fila) => (
                      <tr key={fila.estacionId ?? 'sin-estacion'}>
                        <td className="px-3 py-2 font-semibold text-on-surface">
                          {fila.estacionNombre ?? 'Sin estación'}
                        </td>
                        <td className="px-3 py-2 text-center font-bold tabular-nums">
                          {fila.total ?? 0}
                        </td>
                        <td className="px-3 py-2 text-center tabular-nums text-rose-600">
                          {fila.clinicaMujer ?? 0}
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
                            onClick={() => descargarReporte(fila.estacionId)}
                            disabled={generando || fila.estacionId == null}
                          >
                            <Icon name="picture_as_pdf" className="text-[16px]" />
                            PDF
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section
            aria-label="Expedientes por estado actual"
            className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 shadow-card"
          >
            <h3 className="mb-3 text-title-md text-on-surface">Expedientes por estado actual</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
              {porEstado.map((item) => {
                const maximo = Math.max(1, ...porEstado.map((fila) => fila.total ?? 0))
                return (
                  <div
                    key={item.estado}
                    className="rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2"
                  >
                    <p className="text-label-sm font-semibold text-on-surface-variant">
                      {ETIQUETAS_ESTADO_CARNET[item.estado] ?? item.estado}
                    </p>
                    <p className="text-title-lg font-black tabular-nums text-on-surface">
                      {item.total ?? 0}
                    </p>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-container-high">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-hro-blue to-hro-celeste"
                        style={{ width: `${Math.round(((item.total ?? 0) / maximo) * 100)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          <section
            aria-label="Cuaderno Rojo del día"
            className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 shadow-card"
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-title-md text-on-surface">Cuaderno Rojo del día</h3>
              <span className="text-label-sm text-on-surface-variant">
                {cuaderno?.registrado ? 'Registro capturado' : 'Sin registro para la fecha'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Metrica
                etiqueta="Egresos hospitalarios"
                valor={cuaderno?.egresosHospitalarios ?? 0}
                icono="logout"
              />
              <Metrica
                etiqueta="Sobres emergencia"
                valor={cuaderno?.sobresEmergencia ?? 0}
                icono="emergency"
              />
              <Metrica
                etiqueta="Sobres sellados"
                valor={cuaderno?.sobresSellados ?? 0}
                icono="mark_email_read"
              />
              <Metrica etiqueta="TIA" valor={cuaderno?.tia ?? 0} icono="badge" />
            </div>
          </section>
        </div>
      )}

      <ModalGenerandoPdf abierto={generando} progreso={progreso} />
      <ModalGenerandoPdf abierto={generandoTrazabilidad} progreso={progresoTrazabilidad} />
    </main>
  )
}
