import { useState } from 'react'
import { Alert, Button, EmptyState, Icon, Spinner } from '@/shared/components/ui'
import { ETIQUETAS_ESTADO_CARNET } from '@/modules/carnets/api/carnetsApi'
import { useCarnetsRealtime } from '@/modules/carnets/hooks/useCarnetsRealtime'
import ArchivoLayout from '../components/ArchivoLayout.jsx'
import ModalObservacion from '../components/ModalObservacion.jsx'
import { useCarnetsArchivo } from '../hooks/useCarnetsArchivo'

const COLORES_ESTADO = {
  registrado: 'bg-amber-100 text-amber-800',
  encontrado: 'bg-emerald-100 text-emerald-800',
  no_localizado: 'bg-red-100 text-red-700',
  despachado: 'bg-blue-100 text-blue-800',
  recibido_estacion: 'bg-cyan-100 text-cyan-800',
  devuelto_estacion: 'bg-violet-100 text-violet-800',
  recibido_archivo: 'bg-emerald-600 text-white',
}

function horaDe(instante) {
  if (!instante) return ''
  return new Date(instante).toLocaleTimeString('es-GT', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function EtiquetaEstado({ estado }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-label-sm font-semibold ${
        COLORES_ESTADO[estado] ?? 'bg-surface-container text-on-surface-variant'
      }`}
    >
      {ETIQUETAS_ESTADO_CARNET[estado] ?? estado}
    </span>
  )
}

function Historial({ movimientos }) {
  if (!movimientos || movimientos.length === 0) {
    return <p className="text-label-sm text-on-surface-variant">Sin movimientos.</p>
  }
  return (
    <ol className="space-y-1 border-l-2 border-outline-variant pl-3">
      {movimientos.map((m) => (
        <li key={m.id} className="text-label-sm text-on-surface-variant">
          <span className="font-semibold text-on-surface">
            {ETIQUETAS_ESTADO_CARNET[m.estadoNuevo] ?? m.estadoNuevo}
          </span>
          {' · '}
          {m.usuarioNombre ?? 'Usuario'}
          {' · '}
          <span className="font-mono">{horaDe(m.fechaMovimiento)}</span>
          {m.observacion ? ` · ${m.observacion}` : ''}
        </li>
      ))}
    </ol>
  )
}

// Seguimiento de carnets del día para el operador de Archivo.
export default function CarnetsArchivoPage() {
  const {
    fecha,
    setFecha,
    estacionId,
    setEstacionId,
    especialidadId,
    setEspecialidadId,
    estaciones,
    especialidades,
    carnets,
    cargando,
    error,
    enProceso,
    recargar,
    marcarEncontrado,
    despachar,
    recibirDevolucion,
    marcarNoLocalizado,
  } = useCarnetsArchivo()

  const [expandido, setExpandido] = useState(null)
  const [observacionPara, setObservacionPara] = useState(null)
  const [observacion, setObservacion] = useState('')

  // Tiempo real: recarga cuando enfermería registra o cambia un carnet.
  useCarnetsRealtime({ topics: ['/topic/archivo'], onEvento: () => recargar() })

  async function confirmarNoLocalizado() {
    const texto = observacion.trim()
    if (!texto || !observacionPara) return
    const ok = await marcarNoLocalizado(observacionPara, texto)
    if (ok) {
      setObservacionPara(null)
      setObservacion('')
    }
  }

  return (
    <ArchivoLayout>
      <main className="mx-auto max-w-5xl space-y-4 px-4 py-4">
        <header>
          <h2 className="text-headline-sm text-on-surface">Seguimiento de carnets</h2>
          <p className="mt-1 text-body-md text-on-surface-variant">
            Carnets recibidos por enfermería. Filtre por estación y marque los expedientes.
          </p>
        </header>

        <section className="grid grid-cols-1 gap-3 rounded-xl bg-surface-container-lowest p-4 shadow-sm sm:grid-cols-3">
          <label className="space-y-1 text-label-md text-on-surface-variant">
            Fecha
            <input
              type="date"
              value={fecha}
              onChange={(event) => setFecha(event.target.value)}
              className="h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>
          <label className="space-y-1 text-label-md text-on-surface-variant">
            Estación
            <select
              value={estacionId}
              onChange={(event) => setEstacionId(event.target.value)}
              className="h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Todas las estaciones</option>
              {estaciones.map((estacion) => (
                <option key={estacion.id} value={estacion.id}>
                  {estacion.nombre ?? estacion.codigo}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-label-md text-on-surface-variant">
            Especialidad
            <select
              value={especialidadId}
              onChange={(event) => setEspecialidadId(event.target.value)}
              className="h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Todas las especialidades</option>
              {especialidades.map((especialidad) => (
                <option key={especialidad.id} value={especialidad.id}>
                  {especialidad.nombre}
                </option>
              ))}
            </select>
          </label>
          <div className="sm:col-span-3">
            <Button variant="ghost" onClick={() => recargar()}>
              <Icon name="refresh" className="text-[18px]" />
              Actualizar
            </Button>
          </div>
        </section>

        {cargando ? (
          <Spinner label="Cargando carnets..." />
        ) : error ? (
          <Alert tone="error" title="No se pudieron cargar los carnets">
            {error.message}
          </Alert>
        ) : carnets.length === 0 ? (
          <EmptyState
            title="Sin carnets para los filtros seleccionados"
            description="Ajuste la fecha, estación o especialidad."
          />
        ) : (
          <ul className="space-y-2">
            {carnets.map((carnet) => (
              <li
                key={carnet.id}
                className="rounded-xl border border-outline-variant bg-surface-container-lowest p-3 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="inline-flex items-center justify-center rounded bg-primary px-2 py-0.5 font-mono text-[13px] font-bold text-on-primary">
                      {carnet.correlativo}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-on-surface">
                        {carnet.pacienteNombre}
                      </p>
                      <p className="truncate text-label-sm text-on-surface-variant">
                        {carnet.especialidadNombre}
                        {carnet.estacionNombre ? ` · ${carnet.estacionNombre}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-label-md text-primary">
                      {carnet.numeroExpediente}
                    </span>
                    <EtiquetaEstado estado={carnet.estado} />
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {(carnet.estado === 'registrado' || carnet.estado === 'no_localizado') && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => marcarEncontrado(carnet)}
                        disabled={enProceso === carnet.id}
                      >
                        <Icon name="inventory_2" className="text-[18px]" />
                        Encontré
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => {
                          setObservacionPara(carnet)
                          setObservacion('')
                        }}
                        disabled={enProceso === carnet.id}
                      >
                        <Icon name="report" className="text-[18px]" />
                        No localizado
                      </Button>
                    </>
                  )}
                  {carnet.estado === 'encontrado' && (
                    <Button
                      size="sm"
                      onClick={() => despachar(carnet)}
                      disabled={enProceso === carnet.id}
                    >
                      <Icon name="local_shipping" className="text-[18px]" />
                      Despachar
                    </Button>
                  )}
                  {carnet.estado === 'devuelto_estacion' && (
                    <Button
                      size="sm"
                      onClick={() => recibirDevolucion(carnet)}
                      disabled={enProceso === carnet.id}
                    >
                      <Icon name="assignment_turned_in" className="text-[18px]" />
                      Recibir devolución
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setExpandido(expandido === carnet.id ? null : carnet.id)}
                  >
                    <Icon name="history" className="text-[18px]" />
                    Historial
                  </Button>
                  {(carnet.estado === 'despachado' ||
                    carnet.estado === 'recibido_estacion' ||
                    carnet.estado === 'devuelto_estacion') && (
                    <span className="text-label-sm text-on-surface-variant">
                      {carnet.recibidoPor ? `Recibió: ${carnet.recibidoPor}` : ''}
                    </span>
                  )}
                </div>

                {expandido === carnet.id && (
                  <div className="mt-3 rounded-lg bg-surface-container-low p-3">
                    <Historial movimientos={carnet.movimientos} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>

      <ModalObservacion
        abierto={Boolean(observacionPara)}
        observacion={observacion}
        onObservacion={setObservacion}
        onConfirmar={confirmarNoLocalizado}
        onCancelar={() => {
          setObservacionPara(null)
          setObservacion('')
        }}
      />
    </ArchivoLayout>
  )
}
