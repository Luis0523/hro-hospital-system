import { useEffect, useState } from 'react'
import { Alert, Button, Icon, Modal } from '@/shared/components/ui'
import { useToast } from '@/shared/context/ToastContext.jsx'
import {
  listarEstaciones,
  buscarCarnetPorExpediente,
  marcarNoLocalizado,
  resguardarCarnet,
  salidaArchivoCarnet,
} from '@/modules/carnets/api/carnetsApi'
import { ETIQUETAS_ESTADO_CARNET } from '@/modules/carnets/api/carnetsApi'
import { codigoCarnet } from '@/modules/carnets/utils/codigoCarnet'
import { formatearExpediente } from '@/shared/utils/expediente'
import { hoyIso } from '@/shared/utils/fecha'
import ArchivoLayout from '../components/ArchivoLayout.jsx'
import FiltrosArchivo from '../components/FiltrosArchivo.jsx'
import ResumenEstados from '../components/ResumenEstados.jsx'
import ScannerExpediente from '../components/ScannerExpediente.jsx'
import ModalObservacion from '../components/ModalObservacion.jsx'
import SeccionCarnetsArchivo from '../components/SeccionCarnetsArchivo.jsx'

function horaDe(instante) {
  if (!instante) return ''
  return new Date(instante).toLocaleTimeString('es-GT', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

// Siguiente paso del circuito que ejecuta Archivo desde la trazabilidad.
function siguienteAccionArchivo(estado) {
  if (estado === 'registrado' || estado === 'no_localizado') {
    return { tipo: 'salida_archivo', etiqueta: 'Registrar salida de archivo' }
  }
  if (estado === 'salida_enfermeria') {
    return { tipo: 'resguardado', etiqueta: 'Resguardar en estantería' }
  }
  return null
}

const ACCIONES = {
  salida_archivo: (id) => salidaArchivoCarnet(id),
  resguardado: (id) => resguardarCarnet(id),
}

export default function ArchivoPage() {
  const { mostrarToast } = useToast()

  const [fecha, setFecha] = useState(hoyIso)
  const [estacionId, setEstacionId] = useState('')
  const [estaciones, setEstaciones] = useState([])
  const [recargaCarnetsKey, setRecargaCarnetsKey] = useState(0)
  const [resumen, setResumen] = useState({ total: 0, pendientes: 0, conSalida: 0 })

  // Buscador por código: consulta la trazabilidad del carnet en el backend.
  const [codigo, setCodigo] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [trazabilidad, setTrazabilidad] = useState(null)
  const [ocupado, setOcupado] = useState(false)
  const [observacionPara, setObservacionPara] = useState(false)
  const [observacion, setObservacion] = useState('')

  useEffect(() => {
    listarEstaciones()
      .then(setEstaciones)
      .catch(() => setEstaciones([]))
  }, [])

  async function buscarTrazabilidad(valor) {
    const numero = String(valor ?? '').trim()
    if (!numero || buscando) return
    setBuscando(true)
    try {
      const carnet = await buscarCarnetPorExpediente(numero, { fecha })
      setTrazabilidad(carnet)
      setCodigo('')
    } catch (fallo) {
      if (fallo?.status === 404) {
        mostrarToast({
          tone: 'warning',
          title: 'Sin carnet hoy',
          message: `El expediente ${formatearExpediente(numero)} no está registrado hoy.`,
        })
      } else {
        mostrarToast({
          tone: 'error',
          title: 'No se pudo buscar',
          message: fallo?.message,
        })
      }
    } finally {
      setBuscando(false)
    }
  }

  function manejarBusqueda(event) {
    event.preventDefault()
    buscarTrazabilidad(codigo)
  }

  function manejarCodigoEscaneado(valor) {
    setCodigo(valor)
    buscarTrazabilidad(valor)
  }

  async function actualizarTrazabilidad(carnet) {
    setTrazabilidad(carnet)
    setRecargaCarnetsKey((clave) => clave + 1)
  }

  async function ejecutarAvance(tipo) {
    if (!trazabilidad || ocupado) return
    const accion = ACCIONES[tipo]
    if (!accion) return
    setOcupado(true)
    try {
      const actualizado = await accion(trazabilidad.id)
      await actualizarTrazabilidad(actualizado)
      mostrarToast({
        tone: 'success',
        title: 'Estado actualizado',
        message: `${codigoCarnet(actualizado)} · ${
          ETIQUETAS_ESTADO_CARNET[actualizado.estado] ?? actualizado.estado
        }`,
      })
    } catch (fallo) {
      mostrarToast({
        tone: 'error',
        title: 'No se pudo actualizar',
        message: fallo?.message,
      })
    } finally {
      setOcupado(false)
    }
  }

  async function confirmarNoLocalizado() {
    const texto = observacion.trim()
    if (!texto || !trazabilidad) return
    setOcupado(true)
    try {
      const actualizado = await marcarNoLocalizado(trazabilidad.id, texto)
      await actualizarTrazabilidad(actualizado)
      setObservacionPara(false)
      setObservacion('')
      mostrarToast({ tone: 'success', title: 'Marcado como no localizado' })
    } catch (fallo) {
      mostrarToast({ tone: 'error', title: 'No se pudo actualizar', message: fallo?.message })
    } finally {
      setOcupado(false)
    }
  }

  const accionSiguiente = trazabilidad ? siguienteAccionArchivo(trazabilidad.estado) : null
  const puedeNoLocalizado = trazabilidad?.estado === 'registrado'

  return (
    <ArchivoLayout>
      <main className="mx-auto max-w-7xl space-y-4 px-4 py-4">
        <ScannerExpediente
          value={codigo}
          onChange={setCodigo}
          onSubmit={manejarBusqueda}
          onCodigoEscaneado={manejarCodigoEscaneado}
        />

        <FiltrosArchivo
          fecha={fecha}
          onFecha={setFecha}
          estacionId={estacionId}
          onEstacion={setEstacionId}
          estaciones={estaciones}
        />

        <ResumenEstados
          total={resumen.total}
          pendientes={resumen.pendientes}
          conSalida={resumen.conSalida}
        />

        <SeccionCarnetsArchivo
          fecha={fecha}
          estacionId={estacionId}
          recargaKey={recargaCarnetsKey}
          onResumen={setResumen}
        />
      </main>

      <Modal
        open={Boolean(trazabilidad)}
        onClose={() => setTrazabilidad(null)}
        title="Trazabilidad del expediente"
        footer={
          <Button variant="secondary" onClick={() => setTrazabilidad(null)}>
            Cerrar
          </Button>
        }
      >
        {trazabilidad && (
          <div className="space-y-4">
            <div className="rounded-lg bg-surface-container-low p-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center rounded bg-primary px-2 py-0.5 font-mono text-[15px] font-bold text-on-primary">
                  {codigoCarnet(trazabilidad)}
                </span>
                <span className="font-mono text-title-md font-bold text-primary">
                  {formatearExpediente(trazabilidad.numeroExpediente)}
                </span>
                <span className="ml-auto rounded bg-secondary-container/40 px-2 py-0.5 text-label-sm font-semibold text-primary">
                  {ETIQUETAS_ESTADO_CARNET[trazabilidad.estado] ?? trazabilidad.estado}
                </span>
              </div>
              <p className="mt-1 font-semibold text-on-surface">{trazabilidad.pacienteNombre}</p>
              <p className="text-label-sm text-on-surface-variant">
                {trazabilidad.especialidadNombre}
                {trazabilidad.estacionNombre ? ` · ${trazabilidad.estacionNombre}` : ''}
              </p>
            </div>

            <div>
              <h3 className="mb-1 text-label-md font-bold uppercase tracking-wider text-on-surface-variant">
                Historial
              </h3>
              {!trazabilidad.movimientos || trazabilidad.movimientos.length === 0 ? (
                <p className="text-label-sm text-on-surface-variant">Sin movimientos.</p>
              ) : (
                <ol className="space-y-1 border-l-2 border-outline-variant pl-3">
                  {trazabilidad.movimientos.map((m) => (
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
              )}
            </div>

            {trazabilidad.estado === 'salida_archivo' && (
              <Alert tone="info" title="En enfermería">
                El expediente salió de archivo. La salida de enfermería la marca Mesa COEX.
              </Alert>
            )}

            <div className="flex flex-wrap gap-2">
              {accionSiguiente && (
                <Button onClick={() => ejecutarAvance(accionSiguiente.tipo)} disabled={ocupado}>
                  <Icon name="check_circle" className="text-[18px]" />
                  {accionSiguiente.etiqueta}
                </Button>
              )}
              {puedeNoLocalizado && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setObservacion('')
                    setObservacionPara(true)
                  }}
                  disabled={ocupado}
                >
                  <Icon name="search_off" className="text-[18px]" />
                  No localizado
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      <ModalObservacion
        abierto={observacionPara}
        observacion={observacion}
        onObservacion={setObservacion}
        onConfirmar={confirmarNoLocalizado}
        onCancelar={() => {
          setObservacionPara(false)
          setObservacion('')
        }}
        procesando={ocupado}
      />
    </ArchivoLayout>
  )
}
