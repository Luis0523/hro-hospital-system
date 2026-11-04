import { useEffect, useRef, useState } from 'react'
import { Button, Icon, Modal } from '@/shared/components/ui'
import {
  ETAPAS_SEGUIMIENTO,
  nombreEstadoBackend,
  obtenerHistorialTurno,
} from '../../api/seguimientoApi'
import EditorTipoRegistro from './EditorTipoRegistro'
import { estiloDeEtapa } from './estilosEtapas'

function formatearFechaHora(valor) {
  if (!valor) return ''
  return new Date(valor).toLocaleString('es-GT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function puedeRevertirTurno(turno) {
  if (!turno) return false
  const estado = turno.estadoBackend ?? turno.etapa
  return ['recibido', 'en_clinica', 'llamado', 'no_asistio'].includes(estado)
}

// Resumen compacto del turno asignado, su historial y la reversión de estado.
export default function DetalleTurno({
  seleccion,
  especialidadNombre,
  onRevertir,
  onCambiarClinica,
  onCambiarTipoRegistro,
  onEliminar,
  menuSecundario = false,
}) {
  const [historialAbierto, setHistorialAbierto] = useState(false)
  const [historial, setHistorial] = useState(null)
  const [cargandoHistorial, setCargandoHistorial] = useState(false)
  const [errorHistorial, setErrorHistorial] = useState(null)
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false)
  const [menuAbierto, setMenuAbierto] = useState(false)
  const historialTimerRef = useRef(null)
  const [motivoEliminar, setMotivoEliminar] = useState('')
  const [eliminando, setEliminando] = useState(false)

  const turno = seleccion?.turno ?? null
  const turnoId = turno?.id ?? null

  useEffect(() => {
    setHistorialAbierto(false)
    setHistorial(null)
    setErrorHistorial(null)
  }, [turnoId])

  useEffect(() => {
    setConfirmandoEliminar(false)
    setMenuAbierto(false)
    setMotivoEliminar('')
  }, [turnoId])

  // El historial es informativo: se cierra solo si deja de usarse.
  useEffect(() => {
    if (!historialAbierto) return undefined
    historialTimerRef.current = setTimeout(() => setHistorialAbierto(false), 8000)
    return () => {
      if (historialTimerRef.current) clearTimeout(historialTimerRef.current)
    }
  }, [historialAbierto])

  function renovarCierreHistorial() {
    if (!historialAbierto) return
    if (historialTimerRef.current) clearTimeout(historialTimerRef.current)
    historialTimerRef.current = setTimeout(() => setHistorialAbierto(false), 8000)
  }

  async function confirmarEliminar() {
    if (!turno || eliminando) return
    setEliminando(true)
    try {
      await onEliminar?.(turno.id, motivoEliminar.trim() || undefined)
      setConfirmandoEliminar(false)
      setMotivoEliminar('')
    } catch {
      // El contenedor muestra el error; se mantiene el modal abierto.
    } finally {
      setEliminando(false)
    }
  }

  async function alternarHistorial() {
    if (!turno) return
    if (historialAbierto) {
      setHistorialAbierto(false)
      return
    }

    setHistorialAbierto(true)
    if (historial) return

    setCargandoHistorial(true)
    setErrorHistorial(null)
    try {
      setHistorial(await obtenerHistorialTurno(turno.id))
    } catch (fallo) {
      setErrorHistorial(fallo?.message ?? 'No se pudo cargar el historial.')
      setHistorial([])
    } finally {
      setCargandoHistorial(false)
    }
  }

  if (!seleccion) {
    return (
      <div
        aria-live="polite"
        data-testid="detalle-turno"
        className="rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2"
      >
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-label-sm font-semibold text-on-surface-variant">Turno asignado:</h2>
          <p className="text-label-sm text-on-surface-variant">
            Presione Enter sobre una especialidad o toque un turno para seleccionarlo.
          </p>
        </div>
      </div>
    )
  }

  const { codigo, numero } = seleccion
  const id = `${codigo}-${String(numero).padStart(2, '0')}`
  const indice = turno ? ETAPAS_SEGUIMIENTO.findIndex((etapa) => etapa.id === turno.etapa) : -1
  const estilo = estiloDeEtapa(turno?.etapa)
  const nombreEtapa = turno ? ETAPAS_SEGUIMIENTO[indice]?.nombre : null
  const clinicaAsignada =
    turno?.clinicaNombre ??
    (turno?.clinicaNumero ? `Clínica ${turno.clinicaNumero}` : null) ??
    'sin asignar'
  const mostrarRevertir = puedeRevertirTurno(turno) && Boolean(onRevertir)
  const estadoTurno = turno?.estadoBackend ?? turno?.etapa
  const mostrarCambiarClinica =
    Boolean(onCambiarClinica) && ['registrado', 'recibido'].includes(estadoTurno)
  const mostrarEditorTipo = Boolean(onCambiarTipoRegistro) && turno?.etapa === 'registrado'
  const puedeEliminar = Boolean(onEliminar) && turno?.etapa === 'registrado'

  return (
    <div
      aria-live="polite"
      data-testid="detalle-turno"
      className="rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2"
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <h2 className="text-label-sm font-semibold text-on-surface-variant">Turno asignado:</h2>
        <strong className="text-label-md font-bold text-on-surface">{id}</strong>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-label-sm font-bold ${estilo.fondo} ${estilo.texto}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${estilo.punto}`} aria-hidden="true" />
          {nombreEtapa ?? 'Sin registrar'}
        </span>
        <span className="text-label-sm text-on-surface-variant">{especialidadNombre}</span>
        <span className="text-label-sm text-on-surface-variant">· {clinicaAsignada}</span>
        <span className="text-label-sm text-on-surface-variant">
          · Etapa {turno ? `${indice + 1} de ${ETAPAS_SEGUIMIENTO.length}` : 'sin iniciar'}
        </span>

        <div className="ml-auto flex items-center gap-1">
          {mostrarCambiarClinica && (
            <Button variant="secondary" size="sm" onClick={onCambiarClinica}>
              <Icon name="swap_horiz" className="text-[16px]" />
              Cambiar clínica
            </Button>
          )}
          {mostrarRevertir && (
            <Button variant="secondary" size="sm" onClick={onRevertir}>
              <Icon name="undo" className="text-[16px]" />
              Revertir
            </Button>
          )}
          {puedeEliminar && !menuSecundario && (
            <Button variant="danger" size="sm" onClick={() => setConfirmandoEliminar(true)}>
              <Icon name="delete" className="text-[16px]" />
              Eliminar registro
            </Button>
          )}
          {puedeEliminar && menuSecundario && (
            <div className="relative">
              <button
                type="button"
                aria-label="Más acciones del turno"
                aria-expanded={menuAbierto}
                onClick={() => setMenuAbierto((valor) => !valor)}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-outline-variant text-on-surface-variant transition hover:bg-surface-container focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hro-blue"
              >
                <Icon name="more_vert" className="text-[20px]" />
              </button>
              {menuAbierto && (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-30 mt-1 min-w-52 rounded-lg border border-outline-variant bg-surface-container-lowest p-1 shadow-popover"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuAbierto(false)
                      setConfirmandoEliminar(true)
                    }}
                    className="flex min-h-11 w-full items-center gap-2 rounded-md px-2.5 text-left text-label-md font-semibold text-error transition hover:bg-error-container"
                  >
                    <Icon name="delete" className="text-[18px]" />
                    Eliminar registro
                  </button>
                </div>
              )}
            </div>
          )}
          {turno && (
            <button
              type="button"
              onClick={alternarHistorial}
              aria-expanded={historialAbierto}
              aria-label={
                historialAbierto ? 'Ocultar historial del turno' : 'Ver historial del turno'
              }
              className="inline-flex items-center gap-1 rounded-md border border-outline-variant px-2 py-1 text-label-sm font-semibold text-on-surface transition hover:bg-surface-container focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hro-blue"
            >
              <Icon name="history" className="text-[16px]" />
              Historial
              <Icon
                name={historialAbierto ? 'expand_less' : 'expand_more'}
                className="text-[16px]"
              />
            </button>
          )}
        </div>
      </div>

      {mostrarEditorTipo && <EditorTipoRegistro turno={turno} onCambiar={onCambiarTipoRegistro} />}

      {historialAbierto && (
        <div
          className="mt-2 space-y-1.5 border-t border-outline-variant pt-2"
          onPointerDown={renovarCierreHistorial}
          onKeyDown={renovarCierreHistorial}
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-label-sm font-semibold uppercase tracking-wide text-on-surface-variant">
              Historial de movimientos
            </p>
            <button
              type="button"
              aria-label="Cerrar historial"
              onClick={() => setHistorialAbierto(false)}
              className="flex min-h-9 min-w-9 items-center justify-center rounded-md border border-outline-variant text-on-surface-variant transition hover:bg-surface-container focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hro-blue"
            >
              <Icon name="close" className="text-[18px]" />
            </button>
          </div>
          {cargandoHistorial && (
            <p className="text-label-sm text-on-surface-variant">Cargando historial…</p>
          )}
          {errorHistorial && (
            <p className="text-label-sm text-error">
              No se pudo cargar el historial: {errorHistorial}
            </p>
          )}
          {!cargandoHistorial && !errorHistorial && historial?.length === 0 && (
            <p className="text-label-sm text-on-surface-variant">Sin movimientos registrados.</p>
          )}
          {!cargandoHistorial &&
            historial?.map((movimiento, posicion) => (
              <div
                key={movimiento.id ?? posicion}
                className="flex items-start gap-2 rounded-md bg-surface-container-lowest px-2 py-1.5"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <div className="min-w-0">
                  <p className="text-label-sm font-semibold text-on-surface">
                    {movimiento.estadoAnterior
                      ? `${nombreEstadoBackend(movimiento.estadoAnterior)} → `
                      : ''}
                    {nombreEstadoBackend(movimiento.estadoNuevo)}
                  </p>
                  <p className="text-label-sm text-on-surface-variant">
                    {formatearFechaHora(movimiento.fechaMovimiento)}
                    {movimiento.usuarioNombre ? ` · ${movimiento.usuarioNombre}` : ''}
                    {movimiento.medicoNombre ? ` · ${movimiento.medicoNombre}` : ''}
                  </p>
                  {movimiento.observacion && (
                    <p className="text-label-sm italic text-on-surface-variant">
                      {movimiento.observacion}
                    </p>
                  )}
                </div>
              </div>
            ))}
        </div>
      )}

      <Modal
        open={confirmandoEliminar}
        onClose={() => {
          if (!eliminando) setConfirmandoEliminar(false)
        }}
        title="Eliminar registro"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setConfirmandoEliminar(false)}
              disabled={eliminando}
            >
              Cancelar
            </Button>
            <Button variant="danger" onClick={confirmarEliminar} disabled={eliminando}>
              {eliminando ? 'Eliminando…' : 'Sí, eliminar'}
            </Button>
          </>
        }
      >
        <p>
          ¿Eliminar el turno <strong>{id}</strong>? La casilla quedará en blanco. Solo se puede si
          no tiene paciente ni expediente vinculado.
        </p>
        <label className="mt-3 flex flex-col gap-1">
          <span className="text-label-sm uppercase tracking-wide text-on-surface-variant">
            Motivo (opcional)
          </span>
          <input
            value={motivoEliminar}
            onChange={(evento) => setMotivoEliminar(evento.target.value)}
            autoComplete="off"
            className="h-11 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-body-md text-on-surface outline-none focus:border-primary"
          />
        </label>
      </Modal>
    </div>
  )
}
