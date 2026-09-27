import { useCallback, useEffect, useMemo, useState } from 'react'
import Alert from '@/shared/components/ui/Alert.jsx'
import Button from '@/shared/components/ui/Button.jsx'
import Spinner from '@/shared/components/ui/Spinner.jsx'
import Modal from '@/shared/components/ui/Modal.jsx'
import Icon from '@/shared/components/ui/Icon.jsx'
import { useToast } from '@/shared/context/ToastContext.jsx'
import { hoyIso } from '@/shared/utils/fecha'
import {
  cerrarDia,
  duplicarAsignacion,
  eliminarAsignacion,
  guardarAsignacion,
  listarSubespecialidades,
  listarVistaAsignacion,
  obtenerCobertura,
  reasignarEnCaliente,
} from '../api/jefeEnfermeriaApi'
import TarjetaSala from '../components/TarjetaSala.jsx'

const NIVELES = [1, 2, 3, 4]

export default function CroquisPage() {
  const { mostrarToast } = useToast()

  const [fecha, setFecha] = useState(hoyIso())
  const [nivel, setNivel] = useState('')
  const [items, setItems] = useState([])
  const [cobertura, setCobertura] = useState([])
  const [subespecialidades, setSubespecialidades] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const [seleccion, setSeleccion] = useState(null)
  const [subElegida, setSubElegida] = useState('')
  const [moverAsignacionId, setMoverAsignacionId] = useState('')
  const [destinoReasignar, setDestinoReasignar] = useState('')
  const [motivoReasignar, setMotivoReasignar] = useState('')
  const [guardando, setGuardando] = useState(false)

  const [confirmarCierre, setConfirmarCierre] = useState(false)
  const [duplicarAbierto, setDuplicarAbierto] = useState(false)
  const [fechaOrigen, setFechaOrigen] = useState('')
  const [procesando, setProcesando] = useState(false)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const [data, faltantes] = await Promise.all([
        listarVistaAsignacion({ fecha, nivel: nivel || undefined }),
        obtenerCobertura(fecha),
      ])
      const lista = Array.isArray(data) ? data : []
      setItems(lista)
      setCobertura(Array.isArray(faltantes) ? faltantes : [])
      return lista
    } catch (fallo) {
      setError(fallo?.message || 'No se pudo cargar la asignación del día.')
      setItems([])
      setCobertura([])
      return []
    } finally {
      setCargando(false)
    }
  }, [fecha, nivel])

  useEffect(() => {
    cargar()
  }, [cargar])

  useEffect(() => {
    listarSubespecialidades()
      .then((lista) => setSubespecialidades(Array.isArray(lista) ? lista : []))
      .catch(() => setSubespecialidades([]))
  }, [])

  const resumen = useMemo(() => {
    const total = items.length
    const asignadas = items.filter((item) => (item.asignaciones?.length ?? 0) > 0).length
    return { total, asignadas, sinAsignar: total - asignadas }
  }, [items])

  async function recargarSeleccion(espacioFisicoId) {
    const lista = await cargar()
    setSeleccion((actual) => {
      const id = espacioFisicoId ?? actual?.espacioFisicoId
      return lista.find((item) => item.espacioFisicoId === id) ?? null
    })
  }

  function abrir(item) {
    setSeleccion(item)
    setSubElegida('')
    setMoverAsignacionId('')
    setDestinoReasignar('')
    setMotivoReasignar('')
  }

  function cerrar() {
    setSeleccion(null)
  }

  async function agregar() {
    if (!seleccion || !subElegida) return
    setGuardando(true)
    try {
      await guardarAsignacion({
        espacioFisicoId: seleccion.espacioFisicoId,
        subespecialidadId: Number(subElegida),
        fecha,
      })
      setSubElegida('')
      await recargarSeleccion(seleccion.espacioFisicoId)
      mostrarToast({ tone: 'success', title: 'Subespecialidad agregada' })
    } catch (fallo) {
      setError(fallo?.message || 'No se pudo agregar la subespecialidad.')
    } finally {
      setGuardando(false)
    }
  }

  async function quitar(asignacionId) {
    setGuardando(true)
    try {
      await eliminarAsignacion(asignacionId)
      await recargarSeleccion(seleccion?.espacioFisicoId)
      mostrarToast({ tone: 'info', title: 'Asignación eliminada' })
    } catch (fallo) {
      setError(fallo?.message || 'No se pudo quitar la asignación.')
    } finally {
      setGuardando(false)
    }
  }

  async function reasignar() {
    if (!moverAsignacionId || !destinoReasignar) return
    setGuardando(true)
    try {
      await reasignarEnCaliente(moverAsignacionId, destinoReasignar, motivoReasignar || undefined)
      cerrar()
      await cargar()
      mostrarToast({ tone: 'success', title: 'Reasignación en caliente aplicada' })
    } catch (fallo) {
      setError(fallo?.message || 'No se pudo reasignar.')
    } finally {
      setGuardando(false)
    }
  }

  async function confirmarCerrarDia() {
    setProcesando(true)
    try {
      await cerrarDia(fecha)
      setConfirmarCierre(false)
      await cargar()
      mostrarToast({ tone: 'success', title: 'Asignación del día cerrada' })
    } catch (fallo) {
      setError(fallo?.message || 'No se pudo cerrar el día (verifique la cobertura).')
      setConfirmarCierre(false)
    } finally {
      setProcesando(false)
    }
  }

  async function confirmarDuplicar() {
    if (!fechaOrigen) return
    setProcesando(true)
    try {
      const copiadas = await duplicarAsignacion(fechaOrigen, fecha)
      setDuplicarAbierto(false)
      setFechaOrigen('')
      await cargar()
      mostrarToast({ tone: 'success', title: `Asignaciones duplicadas: ${copiadas ?? 0}` })
    } catch (fallo) {
      setError(fallo?.message || 'No se pudo duplicar la asignación.')
      setDuplicarAbierto(false)
    } finally {
      setProcesando(false)
    }
  }

  const asignaciones = seleccion?.asignaciones ?? []
  const otrasSalas = useMemo(
    () => items.filter((item) => item.espacioFisicoId !== seleccion?.espacioFisicoId),
    [items, seleccion],
  )

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-headline-lg text-on-surface">Croquis del Día</h2>
          <p className="text-body-md text-on-surface-variant">
            Asignación de subespecialidad por espacio físico para la fecha seleccionada.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={() => setDuplicarAbierto(true)}>
            <Icon name="content_copy" className="text-[18px]" />
            Duplicar de otra fecha
          </Button>
          <Button variant="secondary" onClick={() => setConfirmarCierre(true)}>
            <Icon name="lock" className="text-[18px]" />
            Cerrar día
          </Button>
        </div>
      </header>

      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest p-3 shadow-card">
        <label className="flex flex-col gap-1">
          <span className="text-label-sm uppercase tracking-wide text-on-surface-variant">Fecha</span>
          <input
            type="date"
            value={fecha}
            onChange={(evento) => setFecha(evento.target.value)}
            className="h-10 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-body-md text-on-surface outline-none focus:border-primary-container focus:ring-2 focus:ring-secondary-fixed-dim"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-label-sm uppercase tracking-wide text-on-surface-variant">Nivel</span>
          <select
            value={nivel}
            onChange={(evento) => setNivel(evento.target.value)}
            className="h-10 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-body-md text-on-surface outline-none focus:border-primary-container focus:ring-2 focus:ring-secondary-fixed-dim"
          >
            <option value="">Todos</option>
            {NIVELES.map((numero) => (
              <option key={numero} value={numero}>
                Nivel {numero}
              </option>
            ))}
          </select>
        </label>

        <Button variant="secondary" onClick={() => setFecha(hoyIso())}>
          <Icon name="today" className="text-[18px]" />
          Hoy
        </Button>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Contador etiqueta="Salas" valor={resumen.total} />
          <Contador etiqueta="Con asignación" valor={resumen.asignadas} tono="ok" />
          <Contador etiqueta="Sin asignar" valor={resumen.sinAsignar} tono="warn" />
        </div>
      </div>

      {cobertura.length > 0 && (
        <Alert tone="warning" title={`Cobertura incompleta (${cobertura.length})`}>
          <p className="mb-1 text-body-sm">
            Estas subespecialidades tienen programación ese día pero aún no tienen sala asignada:
          </p>
          <p className="text-body-sm text-on-surface">
            {cobertura.map((c) => c.subespecialidadNombre).join(' · ')}
          </p>
        </Alert>
      )}

      {error && (
        <Alert tone="error" title="Atención">
          {error}
        </Alert>
      )}

      {cargando ? (
        <div className="flex justify-center py-16">
          <Spinner label="Cargando asignación del día…" />
        </div>
      ) : items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-outline-variant bg-surface-container-low px-3 py-8 text-center text-body-md text-on-surface-variant">
          No hay espacios físicos para esta fecha/nivel.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {items.map((item) => (
            <TarjetaSala key={item.espacioFisicoId} item={item} onClick={abrir} />
          ))}
        </div>
      )}

      {/* Modal de la sala */}
      <Modal
        open={Boolean(seleccion)}
        onClose={cerrar}
        title={seleccion ? `Sala ${seleccion.numero}` : ''}
        footer={
          <Button variant="secondary" onClick={cerrar}>
            Cerrar
          </Button>
        }
      >
        {seleccion && (
          <div className="space-y-4">
            <p className="text-body-sm text-on-surface-variant">
              Nivel {seleccion.nivel} · {fecha}
            </p>

            <div>
              <p className="mb-1 text-label-sm uppercase tracking-wide text-on-surface-variant">
                Subespecialidades asignadas
              </p>
              {asignaciones.length === 0 ? (
                <p className="text-body-sm text-on-surface-variant">Ninguna todavía.</p>
              ) : (
                <ul className="divide-y divide-outline-variant overflow-hidden rounded-lg border border-outline-variant">
                  {asignaciones.map((sub) => (
                    <li
                      key={sub.asignacionId}
                      className="flex items-center justify-between gap-2 px-3 py-2"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-title-sm text-on-surface">
                          {sub.subespecialidadNombre}
                        </span>
                        <span className="block truncate text-label-sm text-on-surface-variant">
                          {sub.especialidadNombre}
                        </span>
                      </span>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => quitar(sub.asignacionId)}
                        disabled={guardando}
                      >
                        <Icon name="close" className="text-[16px]" />
                        Quitar
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <p className="mb-1 text-label-sm uppercase tracking-wide text-on-surface-variant">
                Agregar subespecialidad
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <select
                  value={subElegida}
                  onChange={(evento) => setSubElegida(evento.target.value)}
                  className="h-10 min-w-0 flex-1 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-body-sm text-on-surface outline-none focus:border-primary-container"
                >
                  <option value="">Seleccione una subespecialidad…</option>
                  {subespecialidades.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.nombre} — {sub.especialidadNombre}
                    </option>
                  ))}
                </select>
                <Button size="sm" onClick={agregar} disabled={guardando || !subElegida}>
                  <Icon name="add" className="text-[16px]" />
                  Agregar
                </Button>
              </div>
            </div>

            {asignaciones.length > 0 && (
              <div className="rounded-lg border border-outline-variant bg-surface-container-low p-3">
                <p className="mb-2 flex items-center gap-1 text-label-sm uppercase tracking-wide text-on-surface-variant">
                  <Icon name="swap_horiz" className="text-[16px] text-primary" />
                  Reasignar en caliente a otra sala
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <select
                    value={moverAsignacionId}
                    onChange={(evento) => setMoverAsignacionId(evento.target.value)}
                    className="h-10 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-body-sm text-on-surface outline-none focus:border-primary-container"
                  >
                    <option value="">Subespecialidad a mover…</option>
                    {asignaciones.map((sub) => (
                      <option key={sub.asignacionId} value={sub.asignacionId}>
                        {sub.subespecialidadNombre}
                      </option>
                    ))}
                  </select>
                  <select
                    value={destinoReasignar}
                    onChange={(evento) => setDestinoReasignar(evento.target.value)}
                    className="h-10 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-body-sm text-on-surface outline-none focus:border-primary-container"
                  >
                    <option value="">Sala destino…</option>
                    {otrasSalas.map((sala) => (
                      <option key={sala.espacioFisicoId} value={sala.espacioFisicoId}>
                        Sala {sala.numero}
                      </option>
                    ))}
                  </select>
                  <input
                    value={motivoReasignar}
                    onChange={(evento) => setMotivoReasignar(evento.target.value)}
                    placeholder="Motivo (opcional)"
                    className="h-10 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-body-sm text-on-surface outline-none focus:border-primary-container"
                  />
                  <Button
                    size="sm"
                    onClick={reasignar}
                    disabled={guardando || !moverAsignacionId || !destinoReasignar}
                  >
                    Reasignar
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Confirmar cierre del día */}
      <Modal
        open={confirmarCierre}
        onClose={() => setConfirmarCierre(false)}
        title="Cerrar asignación del día"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmarCierre(false)} disabled={procesando}>
              Cancelar
            </Button>
            <Button onClick={confirmarCerrarDia} disabled={procesando}>
              {procesando ? 'Cerrando…' : 'Sí, cerrar día'}
            </Button>
          </>
        }
      >
        <p className="text-body-md text-on-surface-variant">
          Se bloqueará la edición libre de la asignación del <b>{fecha}</b>. Después solo se podrán
          hacer <b>reasignaciones en caliente</b>. El backend exige cobertura completa.
        </p>
      </Modal>

      {/* Duplicar de otra fecha */}
      <Modal
        open={duplicarAbierto}
        onClose={() => setDuplicarAbierto(false)}
        title="Duplicar asignación de otra fecha"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDuplicarAbierto(false)} disabled={procesando}>
              Cancelar
            </Button>
            <Button onClick={confirmarDuplicar} disabled={procesando || !fechaOrigen}>
              {procesando ? 'Duplicando…' : 'Duplicar'}
            </Button>
          </>
        }
      >
        <label className="flex flex-col gap-1">
          <span className="text-label-sm uppercase tracking-wide text-on-surface-variant">
            Fecha origen
          </span>
          <input
            type="date"
            value={fechaOrigen}
            onChange={(evento) => setFechaOrigen(evento.target.value)}
            className="h-11 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-body-md text-on-surface outline-none focus:border-primary-container"
          />
        </label>
        <p className="mt-2 text-body-sm text-on-surface-variant">
          Se copiarán las asignaciones de la fecha origen hacia <b>{fecha}</b> (quedan editables).
        </p>
      </Modal>
    </section>
  )
}

function Contador({ etiqueta, valor, tono = 'neutral' }) {
  const estilos = {
    neutral: 'bg-surface-container text-on-surface-variant',
    ok: 'bg-secondary-fixed text-on-secondary-container',
    warn: 'bg-tertiary-container text-on-tertiary-container',
  }
  return (
    <span
      className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-label-sm uppercase tracking-wide ${estilos[tono]}`}
    >
      {etiqueta}
      <b className="text-title-md">{valor}</b>
    </span>
  )
}
