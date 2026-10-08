import { Fragment, useEffect, useMemo, useState } from 'react'
import { Alert, Button, EmptyState, Icon, Modal, Spinner } from '@/shared/components/ui'
import {
  ETIQUETAS_ESTADO_CARNET,
  actualizarConfiguracionArchivo,
  obtenerConfiguracionArchivo,
} from '@/modules/carnets/api/carnetsApi'
import { useCarnetsRealtime } from '@/modules/carnets/hooks/useCarnetsRealtime'
import { useCarnetsArchivo, compararPorExpediente } from '../hooks/useCarnetsArchivo'
import ModalObservacion from './ModalObservacion.jsx'

// Orden lineal del circuito. `no_localizado` es una rama, no entra en el orden.
const ORDEN = {
  registrado: 0,
  encontrado: 1,
  despachado: 2,
  recibido_estacion: 3,
  devuelto_estacion: 4,
  recibido_archivo: 5,
}

// Estado siguiente del circuito (para saber cuál es el checkbox accionable).
const SIGUIENTE = {
  registrado: 'encontrado',
  no_localizado: 'encontrado',
  encontrado: 'despachado',
  despachado: 'recibido_estacion',
  recibido_estacion: 'devuelto_estacion',
  devuelto_estacion: 'recibido_archivo',
}

// Estados que ejecuta ARCHIVO en esta vista (el resto son de enfermería: solo lectura).
const ACCION_ARCHIVO = new Set(['encontrado', 'despachado', 'recibido_archivo'])

const COLUMNAS_ESTADO = [
  { key: 'encontrado', label: 'Encontré' },
  { key: 'despachado', label: 'Despachado' },
  { key: 'recibido_estacion', label: 'Recibido (enf.)' },
  { key: 'devuelto_estacion', label: 'Devuelto (enf.)' },
  { key: 'recibido_archivo', label: 'Recibido (archivo)' },
]

const ESTADOS_ENCONTRADOS = new Set([
  'encontrado',
  'despachado',
  'recibido_estacion',
  'devuelto_estacion',
  'recibido_archivo',
])

function horaDe(instante) {
  if (!instante) return ''
  return new Date(instante).toLocaleTimeString('es-GT', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
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
          {` · ${m.usuarioNombre ?? 'Usuario'} · `}
          <span className="font-mono">{horaDe(m.fechaMovimiento)}</span>
          {m.observacion ? ` · ${m.observacion}` : ''}
        </li>
      ))}
    </ol>
  )
}

function CheckboxEstado({ alcanzado, accionable, etiqueta, onMarcar, ocupado }) {
  return (
    <input
      type="checkbox"
      checked={alcanzado}
      disabled={!accionable || ocupado}
      onChange={() => onMarcar?.()}
      aria-label={etiqueta}
      className="h-6 w-6 cursor-pointer accent-hro-blue disabled:cursor-default disabled:opacity-60"
    />
  )
}

function FilaHistorial({ carnet, columnas }) {
  return (
    <tr className="bg-surface-container-low">
      <td colSpan={columnas} className="px-3 py-3">
        <Historial movimientos={carnet.movimientos} />
      </td>
    </tr>
  )
}

// Sección de seguimiento de carnets: tablas de estados. La fecha y la estación
// llegan desde el único filtro de la página. Se actualiza en tiempo real.
export default function SeccionCarnetsArchivo({ fecha, estacionId, recargaKey }) {
  const [clasificacion, setClasificacion] = useState('')
  const {
    carnets,
    cargando,
    error,
    enProceso,
    recargar,
    marcarEncontrado,
    despachar,
    recibirDevolucion,
    marcarNoLocalizado,
  } = useCarnetsArchivo({ fecha, estacionId, recargaKey, clasificacion })

  const [expandido, setExpandido] = useState(null)
  const [observacionPara, setObservacionPara] = useState(null)
  const [observacion, setObservacion] = useState('')

  // Configuración del umbral activo/pasivo.
  const [configAbierta, setConfigAbierta] = useState(false)
  const [umbral, setUmbral] = useState(null)
  const [umbralInput, setUmbralInput] = useState('')
  const [guardandoConfig, setGuardandoConfig] = useState(false)

  useEffect(() => {
    obtenerConfiguracionArchivo()
      .then((cfg) => {
        setUmbral(cfg?.umbralActivo ?? null)
        setUmbralInput(cfg?.umbralActivo != null ? String(cfg.umbralActivo) : '')
      })
      .catch(() => {
        // Sin configuración disponible: se ignora.
      })
  }, [])

  async function guardarConfig() {
    const valor = umbralInput.trim()
    setGuardandoConfig(true)
    try {
      const cfg = await actualizarConfiguracionArchivo({
        umbralActivo: valor ? Number(valor) : null,
      })
      setUmbral(cfg?.umbralActivo ?? null)
      setConfigAbierta(false)
      recargar()
    } catch {
      // Se ignora: el usuario puede reintentar.
    } finally {
      setGuardandoConfig(false)
    }
  }

  useCarnetsRealtime({ topics: ['/topic/archivo'], onEvento: () => recargar() })

  const { pendientes, encontrados } = useMemo(() => {
    const ordenados = [...carnets].sort(compararPorExpediente)
    return {
      pendientes: ordenados.filter((c) => !ESTADOS_ENCONTRADOS.has(c.estado)),
      encontrados: ordenados.filter((c) => ESTADOS_ENCONTRADOS.has(c.estado)),
    }
  }, [carnets])

  function alternarHistorial(id) {
    setExpandido((actual) => (actual === id ? null : id))
  }

  function accionDe(key, carnet) {
    if (key === 'encontrado') return () => marcarEncontrado(carnet)
    if (key === 'despachado') return () => despachar(carnet)
    if (key === 'recibido_archivo') return () => recibirDevolucion(carnet)
    return undefined
  }

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
    <section
      aria-label="Seguimiento de carnets"
      aria-busy={cargando}
      className="space-y-3 rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="flex items-center gap-1 text-title-md text-on-surface">
            <Icon name="badge" className="text-[20px] text-primary" />
            Seguimiento de carnets
          </h2>
          <p className="text-body-sm text-on-surface-variant">
            Marque <strong>Encontré</strong> a medida que ubica los expedientes; se moverán a
            &laquo;Encontrados&raquo;.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-secondary-container/30 px-3 py-1 text-label-sm font-semibold text-primary">
            <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
            En vivo
          </span>
          <label className="flex items-center gap-1 text-label-sm text-on-surface-variant">
            Archivo
            <select
              value={clasificacion}
              onChange={(evento) => setClasificacion(evento.target.value)}
              className="h-9 rounded-lg border border-outline-variant bg-surface-container-low px-2 text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Todo</option>
              <option value="activo">Activo</option>
              <option value="pasivo">Pasivo</option>
            </select>
          </label>
          <Button size="sm" variant="secondary" onClick={recargar}>
            <Icon name="refresh" className="text-[18px]" />
            Actualizar
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setConfigAbierta(true)}
            aria-label="Configurar umbral de archivo"
            title={umbral != null ? `Umbral activo: ${umbral}` : 'Configurar umbral activo/pasivo'}
          >
            <Icon name="settings" className="text-[18px]" />
          </Button>
        </div>
      </div>

      {cargando ? (
        <Spinner label="Cargando carnets..." />
      ) : error ? (
        <Alert tone="error" title="No se pudieron cargar los carnets">
          {error.message}
        </Alert>
      ) : carnets.length === 0 ? (
        <EmptyState
          title="Sin carnets para los filtros seleccionados"
          description="Aparecerán aquí en cuanto enfermería registre carnets."
        />
      ) : (
        <>
          <div>
            <h3 className="mb-2 text-title-sm font-semibold text-on-surface">
              Por encontrar ({pendientes.length})
            </h3>
            {pendientes.length === 0 ? (
              <p className="text-body-sm text-on-surface-variant">No hay carnets pendientes.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-outline-variant">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="bg-surface-container-low text-label-sm uppercase text-on-surface-variant">
                    <tr>
                      <th className="px-3 py-2">Correlativo</th>
                      <th className="px-3 py-2">Expediente</th>
                      <th className="px-3 py-2">Paciente</th>
                      <th className="px-3 py-2 text-center">Encontré</th>
                      <th className="px-3 py-2 text-center">No localizado</th>
                      <th className="px-3 py-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/60">
                    {pendientes.map((carnet) => (
                      <Fragment key={carnet.id}>
                        <tr className="bg-surface-container-lowest">
                          <td className="px-3 py-2">
                            <span className="inline-flex min-w-[3rem] items-center justify-center rounded-lg bg-primary px-3 py-1 font-mono text-[24px] font-black leading-none text-on-primary">
                              {carnet.correlativo}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <span className="font-mono text-[26px] font-black tracking-tight text-primary">
                              {carnet.numeroExpediente}
                            </span>
                            {carnet.archivo && (
                              <span
                                className={`ml-2 inline-flex items-center rounded px-1.5 py-0.5 align-middle text-label-sm font-semibold ${
                                  carnet.archivo === 'activo'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-slate-200 text-slate-700'
                                }`}
                              >
                                {carnet.archivo === 'activo' ? 'Activo' : 'Pasivo'}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <p className="font-semibold text-on-surface">{carnet.pacienteNombre}</p>
                            <p className="text-label-sm text-on-surface-variant">
                              {carnet.especialidadNombre}
                              {carnet.estacionNombre ? ` · ${carnet.estacionNombre}` : ''}
                            </p>
                          </td>
                          <td className="px-3 py-2 text-center">
                            <CheckboxEstado
                              alcanzado={false}
                              accionable
                              ocupado={enProceso === carnet.id}
                              etiqueta={`Encontré ${carnet.numeroExpediente}`}
                              onMarcar={() => marcarEncontrado(carnet)}
                            />
                          </td>
                          <td className="px-3 py-2 text-center">
                            <CheckboxEstado
                              alcanzado={carnet.estado === 'no_localizado'}
                              accionable={carnet.estado === 'registrado'}
                              ocupado={enProceso === carnet.id}
                              etiqueta={`No localizado ${carnet.numeroExpediente}`}
                              onMarcar={() => {
                                setObservacionPara(carnet)
                                setObservacion('')
                              }}
                            />
                          </td>
                          <td className="px-3 py-2 text-right">
                            <Button size="sm" variant="ghost" onClick={() => alternarHistorial(carnet.id)}>
                              <Icon name="history" className="text-[18px]" />
                            </Button>
                          </td>
                        </tr>
                        {expandido === carnet.id && (
                          <FilaHistorial carnet={carnet} columnas={6} />
                        )}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div>
            <h3 className="mb-2 text-title-sm font-semibold text-on-surface">
              Encontrados ({encontrados.length})
            </h3>
            {encontrados.length === 0 ? (
              <p className="text-body-sm text-on-surface-variant">
                Aún no hay carpetas marcadas como encontradas.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-outline-variant">
                <table className="w-full min-w-[820px] text-left text-sm">
                  <thead className="bg-surface-container-low text-label-sm uppercase text-on-surface-variant">
                    <tr>
                      <th className="px-3 py-2">Correlativo</th>
                      <th className="px-3 py-2">Expediente</th>
                      <th className="px-3 py-2">Paciente</th>
                      {COLUMNAS_ESTADO.map((columna) => (
                        <th key={columna.key} className="px-3 py-2 text-center">
                          {columna.label}
                        </th>
                      ))}
                      <th className="px-3 py-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/60">
                    {encontrados.map((carnet) => (
                      <Fragment key={carnet.id}>
                        <tr className="bg-surface-container-lowest">
                          <td className="px-3 py-2">
                            <span className="inline-flex min-w-[3rem] items-center justify-center rounded-lg bg-primary px-3 py-1 font-mono text-[24px] font-black leading-none text-on-primary">
                              {carnet.correlativo}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <span className="font-mono text-[26px] font-black tracking-tight text-primary">
                              {carnet.numeroExpediente}
                            </span>
                            {carnet.archivo && (
                              <span
                                className={`ml-2 inline-flex items-center rounded px-1.5 py-0.5 align-middle text-label-sm font-semibold ${
                                  carnet.archivo === 'activo'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-slate-200 text-slate-700'
                                }`}
                              >
                                {carnet.archivo === 'activo' ? 'Activo' : 'Pasivo'}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <p className="font-semibold text-on-surface">{carnet.pacienteNombre}</p>
                            <p className="text-label-sm text-on-surface-variant">
                              {carnet.especialidadNombre}
                              {carnet.estacionNombre ? ` · ${carnet.estacionNombre}` : ''}
                            </p>
                          </td>
                          {COLUMNAS_ESTADO.map((columna) => {
                            const alcanzado = ORDEN[carnet.estado] >= ORDEN[columna.key]
                            const accionable =
                              SIGUIENTE[carnet.estado] === columna.key &&
                              ACCION_ARCHIVO.has(columna.key)
                            return (
                              <td key={columna.key} className="px-3 py-2 text-center">
                                <CheckboxEstado
                                  alcanzado={alcanzado}
                                  accionable={accionable}
                                  ocupado={enProceso === carnet.id}
                                  etiqueta={`${columna.label} ${carnet.numeroExpediente}`}
                                  onMarcar={accionDe(columna.key, carnet)}
                                />
                              </td>
                            )
                          })}
                          <td className="px-3 py-2 text-right">
                            <Button size="sm" variant="ghost" onClick={() => alternarHistorial(carnet.id)}>
                              <Icon name="history" className="text-[18px]" />
                            </Button>
                          </td>
                        </tr>
                        {expandido === carnet.id && (
                          <FilaHistorial carnet={carnet} columnas={9} />
                        )}
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

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
      <Modal
        open={configAbierta}
        onClose={() => setConfigAbierta(false)}
        title="Configuración de archivo"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setConfigAbierta(false)}
              disabled={guardandoConfig}
            >
              Cancelar
            </Button>
            <Button onClick={guardarConfig} disabled={guardandoConfig}>
              {guardandoConfig ? 'Guardando…' : 'Guardar'}
            </Button>
          </>
        }
      >
        <p className="mb-3">
          Número de expediente <strong>umbral</strong>: los expedientes con número{' '}
          <strong>mayor</strong> al umbral son <strong>archivo activo</strong>; los{' '}
          <strong>menores o iguales</strong> son <strong>archivo pasivo</strong>.
        </p>
        <label className="block space-y-1">
          <span className="text-sm font-medium text-on-surface">Umbral</span>
          <input
            type="text"
            inputMode="numeric"
            value={umbralInput}
            onChange={(evento) => setUmbralInput(evento.target.value)}
            placeholder="Ej. 939819"
            className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2.5 text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-secondary-fixed-dim"
          />
        </label>
      </Modal>
    </section>
  )
}
