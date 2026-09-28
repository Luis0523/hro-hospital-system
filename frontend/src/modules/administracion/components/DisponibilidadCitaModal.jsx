import { useCallback, useEffect, useState } from 'react'
import Alert from '@/shared/components/ui/Alert.jsx'
import Button from '@/shared/components/ui/Button.jsx'
import EmptyState from '@/shared/components/ui/EmptyState.jsx'
import Modal from '@/shared/components/ui/Modal.jsx'
import Spinner from '@/shared/components/ui/Spinner.jsx'
import { obtenerDisponibilidadCita, reprogramarCita } from '../api/administracionApi.js'
import { horaCorta } from '../utils/dias.js'
import { formatearFechaLarga, hoyISO, restarDiasISO } from '../utils/fechas.js'
import ListaCuposDisponibles from './ListaCuposDisponibles.jsx'

/**
 * Flujo de 2 pasos para reprogramar una cita conservando médico y subespecialidad:
 *   1. consultar la disponibilidad de la propia cita (GET /citas/{id}/disponibilidad);
 *   2. confirmar con POST /citas/{id}/reprogramar { nuevoCupoDiarioId, motivo }.
 * Si el cupo se agota (409 CUPOS_AGOTADOS) se refresca la disponibilidad y se
 * fuerza a elegir de nuevo; nunca se reintenta el POST automáticamente.
 */
export default function DisponibilidadCitaModal({ abierto, cita, onCerrar, onReprogramada }) {
  const [paso, setPaso] = useState('disponibilidad')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)
  const [cupos, setCupos] = useState([])
  const [seleccionado, setSeleccionado] = useState(null)
  const [motivo, setMotivo] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [errorEnvio, setErrorEnvio] = useState(null)

  const citaId = cita?.id

  const cargar = useCallback(async () => {
    if (!citaId) return
    setCargando(true)
    setError(null)
    try {
      const inicio = hoyISO()
      const fin = restarDiasISO(inicio, -14)
      const lista = await obtenerDisponibilidadCita(citaId, { fechaInicio: inicio, fechaFin: fin })
      setCupos(Array.isArray(lista) ? lista : [])
    } catch (fallo) {
      setCupos([])
      setError(fallo?.message || 'No se pudo cargar la disponibilidad')
    } finally {
      setCargando(false)
    }
  }, [citaId])

  useEffect(() => {
    if (!abierto || !citaId) return
    setPaso('disponibilidad')
    setSeleccionado(null)
    setMotivo('')
    setErrorEnvio(null)
    cargar()
  }, [abierto, citaId, cargar])

  const confirmar = async () => {
    if (!seleccionado) return
    if (!motivo.trim()) {
      setErrorEnvio('El motivo es obligatorio.')
      return
    }
    setEnviando(true)
    setErrorEnvio(null)
    try {
      await reprogramarCita(citaId, { nuevoCupoDiarioId: seleccionado.id, motivo: motivo.trim() })
      onReprogramada?.(citaId)
    } catch (fallo) {
      if (fallo?.codigo === 'CUPOS_AGOTADOS') {
        setErrorEnvio(
          'Ese cupo se ocupó mientras confirmabas (sin cupos disponibles). Elige otra fecha.',
        )
        setSeleccionado(null)
        setPaso('disponibilidad')
        await cargar()
      } else {
        setErrorEnvio(fallo?.message || 'No se pudo reprogramar la cita')
      }
    } finally {
      setEnviando(false)
    }
  }

  const footer =
    paso === 'disponibilidad' ? (
      <>
        <Button variant="secondary" onClick={onCerrar} disabled={enviando}>
          Cancelar
        </Button>
        <Button onClick={() => setPaso('confirmacion')} disabled={!seleccionado || cargando}>
          Continuar
        </Button>
      </>
    ) : (
      <>
        <Button variant="secondary" onClick={() => setPaso('disponibilidad')} disabled={enviando}>
          Atrás
        </Button>
        <Button onClick={confirmar} disabled={enviando}>
          {enviando ? 'Reprogramando...' : 'Confirmar reprogramación'}
        </Button>
      </>
    )

  return (
    <Modal open={abierto} onClose={onCerrar} title="Reprogramar cita" footer={footer}>
      {cita && (
        <div className="space-y-4">
          <div className="rounded-lg border border-outline-variant/60 bg-surface-container-low p-3">
            <p className="text-sm font-semibold text-on-surface">{cita.pacienteNombre}</p>
            <p className="text-xs text-on-surface-variant">
              {horaCorta(cita.horaEstimada)} · {cita.medicoNombre} · {cita.subespecialidadNombre}
            </p>
          </div>

          {errorEnvio && (
            <Alert tone="error" title="No se pudo reprogramar">
              <p>{errorEnvio}</p>
            </Alert>
          )}

          {paso === 'disponibilidad' && (
            <div className="space-y-3">
              {cargando && <Spinner label="Cargando disponibilidad..." />}

              {!cargando && error && (
                <Alert tone="error" title="No se pudo cargar la disponibilidad">
                  <p>{error}</p>
                  <div className="mt-3">
                    <Button size="sm" variant="secondary" onClick={cargar}>
                      Reintentar
                    </Button>
                  </div>
                </Alert>
              )}

              {!cargando && !error && cupos.length === 0 && (
                <EmptyState
                  title="Sin cupos disponibles"
                  description="No hay fechas disponibles para la misma programación en el rango consultado."
                />
              )}

              {!cargando && !error && cupos.length > 0 && (
                <ListaCuposDisponibles
                  cupos={cupos}
                  seleccionado={seleccionado?.id ?? ''}
                  onSeleccionar={setSeleccionado}
                />
              )}
            </div>
          )}

          {paso === 'confirmacion' && seleccionado && (
            <div className="space-y-3">
              <dl className="space-y-1 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-on-surface-variant">Nueva fecha</dt>
                  <dd className="text-right font-medium text-on-surface">
                    {formatearFechaLarga(seleccionado.fecha)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-on-surface-variant">Horario</dt>
                  <dd className="text-right text-on-surface">
                    {horaCorta(seleccionado.horaInicio)}–{horaCorta(seleccionado.horaFin)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-on-surface-variant">Médico</dt>
                  <dd className="text-right text-on-surface">{seleccionado.medicoNombre}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-on-surface-variant">Subespecialidad</dt>
                  <dd className="text-right text-on-surface">{seleccionado.subespecialidadNombre}</dd>
                </div>
              </dl>

              <div className="space-y-1">
                <label
                  htmlFor="motivo-reprogramacion"
                  className="block text-label-sm uppercase tracking-wider text-on-surface-variant"
                >
                  Motivo
                </label>
                <textarea
                  id="motivo-reprogramacion"
                  rows={3}
                  value={motivo}
                  onChange={(evento) => setMotivo(evento.target.value)}
                  className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Justificación del cambio de fecha"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
