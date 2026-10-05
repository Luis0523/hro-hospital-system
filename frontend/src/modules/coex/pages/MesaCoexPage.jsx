import { useState } from 'react'
import Alert from '@/shared/components/ui/Alert.jsx'
import Button from '@/shared/components/ui/Button.jsx'
import EmptyState from '@/shared/components/ui/EmptyState.jsx'
import Icon from '@/shared/components/ui/Icon.jsx'
import Input from '@/shared/components/ui/Input.jsx'
import Spinner from '@/shared/components/ui/Spinner.jsx'
import { useToast } from '@/shared/context/ToastContext.jsx'
import { useDevolucionCoex } from '../hooks/useDevolucionCoex'
import { useLoteCoex } from '../hooks/useLoteCoex'
import { useRecepcionCoex } from '../hooks/useRecepcionCoex'
import { useRefrescoAutomaticoCoex } from '../hooks/useRefrescoAutomaticoCoex'
import ConfirmacionDevolucionCoex from '../components/ConfirmacionDevolucionCoex.jsx'
import ConfirmacionRecepcionCoex from '../components/ConfirmacionRecepcionCoex.jsx'
import ResumenLoteCoex from '../components/ResumenLoteCoex.jsx'
import SeccionLoteCoex from '../components/SeccionLoteCoex.jsx'

function horaLocal(instante) {
  if (!instante) return ''
  return new Date(instante).toLocaleTimeString('es-GT', { hour12: false })
}

// Mesa COEX. Fase 1: carga el lote de la estación activa y lo separa en
// "Pendientes de recibir" y "En uso". Fase 2: checklist de recepción sobre las
// filas accionables (`en_transito_entrega`) y transición `entregar` por ciclo.
// Fase 3: checklist de devolución sobre las filas en uso (`entregado`) y
// transición `retornar` por ciclo. Fase 4: seguimiento near-real-time por
// polling silencioso cada 30 s (sin WebSocket; no hay eventos de expedientes).
export default function MesaCoexPage() {
  const {
    estacion,
    fecha,
    setFecha,
    subespecialidades,
    pendientesRecibir,
    enUso,
    total,
    cargando,
    error,
    refrescarSilencioso,
    refrescando,
    ultimaActualizacion,
    errorRefresco,
  } = useLoteCoex()

  const { mostrarToast } = useToast()
  const recepcion = useRecepcionCoex({
    pendientesRecibir,
    recargar: refrescarSilencioso,
    mostrarToast,
  })
  const devolucion = useDevolucionCoex({
    enUso,
    recargar: refrescarSilencioso,
    mostrarToast,
  })

  const mutando = recepcion.enviando || devolucion.enviando
  useRefrescoAutomaticoCoex({ refrescar: refrescarSilencioso, pausado: mutando })

  const [confirmacionAbierta, setConfirmacionAbierta] = useState(false)
  const [confirmacionDevolucionAbierta, setConfirmacionDevolucionAbierta] = useState(false)

  async function confirmarRecepcion() {
    await recepcion.recibirSeleccionados()
    setConfirmacionAbierta(false)
  }

  async function confirmarDevolucion() {
    await devolucion.devolverSeleccionados()
    setConfirmacionDevolucionAbierta(false)
  }

  const fallidos = recepcion.ultimoResultado?.fallidos ?? []
  const exitosos = recepcion.ultimoResultado?.exitosos ?? []
  const alertaFallos =
    fallidos.length > 0 ? (
      <Alert
        tone={exitosos.length === 0 ? 'error' : 'warning'}
        title={
          exitosos.length === 0
            ? 'No se pudo recibir ningún expediente'
            : `${exitosos.length} recibido${exitosos.length === 1 ? '' : 's'}, ${fallidos.length} sin recibir`
        }
      >
        <p className="mb-2">Los siguientes expedientes no se recibieron y siguen seleccionados:</p>
        <ul className="list-inside list-disc">
          {fallidos.map(({ fila, error: fallo }) => (
            <li key={String(fila.cicloId)}>
              {fila.numeroExpediente || fila.cicloId}
              {fallo?.message ? ` — ${fallo.message}` : ''}
            </li>
          ))}
        </ul>
        <div className="mt-2">
          <Button variant="ghost" size="sm" onClick={recepcion.descartarResultado}>
            Descartar
          </Button>
        </div>
      </Alert>
    ) : null

  const accionesRecepcion = (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-label-md text-on-surface-variant" aria-live="polite">
        {recepcion.cantidadSeleccionada} seleccionado{recepcion.cantidadSeleccionada === 1 ? '' : 's'}
      </span>
      <Button
        size="sm"
        onClick={() => setConfirmacionAbierta(true)}
        disabled={recepcion.cantidadSeleccionada === 0 || recepcion.enviando}
        aria-busy={recepcion.enviando || undefined}
      >
        <Icon name="inbox" className="text-[18px]" />
        Recibir seleccionados
      </Button>
    </div>
  )

  const fallidosDevolucion = devolucion.ultimoResultado?.fallidos ?? []
  const exitososDevolucion = devolucion.ultimoResultado?.exitosos ?? []
  const alertaFallosDevolucion =
    fallidosDevolucion.length > 0 ? (
      <Alert
        tone={exitososDevolucion.length === 0 ? 'error' : 'warning'}
        title={
          exitososDevolucion.length === 0
            ? 'No se pudo devolver ningún expediente'
            : `${exitososDevolucion.length} devuelto${exitososDevolucion.length === 1 ? '' : 's'}, ${fallidosDevolucion.length} sin devolver`
        }
      >
        <p className="mb-2">Los siguientes expedientes no se devolvieron y siguen seleccionados:</p>
        <ul className="list-inside list-disc">
          {fallidosDevolucion.map(({ fila, error: fallo }) => (
            <li key={String(fila.cicloId)}>
              {fila.numeroExpediente || fila.cicloId}
              {fallo?.message ? ` — ${fallo.message}` : ''}
            </li>
          ))}
        </ul>
        <div className="mt-2">
          <Button variant="ghost" size="sm" onClick={devolucion.descartarResultado}>
            Descartar
          </Button>
        </div>
      </Alert>
    ) : null

  const accionesDevolucion = (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-label-md text-on-surface-variant" aria-live="polite">
        {devolucion.cantidadSeleccionada} seleccionado{devolucion.cantidadSeleccionada === 1 ? '' : 's'}
      </span>
      <Button
        size="sm"
        onClick={() => setConfirmacionDevolucionAbierta(true)}
        disabled={devolucion.cantidadSeleccionada === 0 || devolucion.enviando}
        aria-busy={devolucion.enviando || undefined}
      >
        <Icon name="undo" className="text-[18px]" />
        Devolver seleccionados
      </Button>
    </div>
  )

  return (
    <div className="min-h-screen bg-surface pb-10">
      <header className="border-b border-outline-variant bg-surface-container-lowest px-4 py-4">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary-container text-on-primary">
            <Icon name="folder_shared" className="text-[26px]" />
          </span>
          <div className="leading-tight">
            <p className="text-label-sm uppercase tracking-widest text-secondary">
              Hospital Regional de Occidente
            </p>
            <h1 className="text-headline-md text-on-surface">Mesa COEX</h1>
          </div>
          {estacion && (
            <div className="ml-auto text-right leading-tight">
              <p className="text-title-sm text-on-surface">{estacion.nombre ?? estacion.codigo}</p>
              <p className="text-label-sm uppercase text-on-surface-variant">
                {estacion.codigo}
                {estacion.ubicacion ? ` · ${estacion.ubicacion}` : ''}
              </p>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-6">
        <div className="max-w-xs">
          <Input
            label="Fecha de trabajo"
            type="date"
            name="fecha"
            value={fecha}
            onChange={(evento) => setFecha(evento.target.value)}
          />
        </div>

        {estacion && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refrescarSilencioso()}
              disabled={refrescando || mutando || cargando}
              aria-busy={refrescando || undefined}
            >
              <Icon name="refresh" className="text-[18px]" />
              {refrescando ? 'Actualizando…' : 'Actualizar'}
            </Button>
            <span className="text-label-sm text-on-surface-variant" aria-live="polite">
              {ultimaActualizacion
                ? `Última actualización: ${horaLocal(ultimaActualizacion)}`
                : 'Sin actualización todavía'}
            </span>
          </div>
        )}

        {!estacion ? (
          <Alert tone="warning" title="Sin estación activa">
            Seleccione una estación de enfermería para cargar el lote de expedientes.
          </Alert>
        ) : cargando ? (
          <Spinner label="Cargando lote de la estación..." />
        ) : error ? (
          <Alert tone="error" title="No se pudo cargar el lote">
            {error.message || 'Error de comunicación con el servidor.'}
          </Alert>
        ) : total === 0 ? (
          <EmptyState
            title="Sin expedientes para la fecha seleccionada"
            description={
              subespecialidades.length === 0
                ? 'La estación no tiene subespecialidades activas para esta fecha.'
                : 'No hay citas con expediente registradas en las áreas de la estación.'
            }
          />
        ) : (
          <>
            {errorRefresco && (
              <Alert tone="warning" title="No se pudo actualizar el lote">
                <p>
                  Se muestran los últimos datos disponibles
                  {ultimaActualizacion ? ` (${horaLocal(ultimaActualizacion)})` : ''}.
                </p>
                <div className="mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => refrescarSilencioso()}
                    disabled={refrescando || mutando}
                  >
                    Reintentar
                  </Button>
                </div>
              </Alert>
            )}
            <ResumenLoteCoex
              total={total}
              pendientesRecibir={pendientesRecibir.length}
              enUso={enUso.length}
            />
            <SeccionLoteCoex
              titulo="Pendientes de recibir"
              descripcion="Expedientes despachados por Archivo, en tránsito hacia la estación."
              filas={pendientesRecibir}
              vacio={{
                title: 'Sin pendientes de recibir',
                description: 'No hay expedientes en tránsito hacia la estación.',
              }}
              mostrarSeleccion
              todasSeleccionadas={recepcion.todasSeleccionadas}
              seleccionParcial={recepcion.seleccionParcial}
              onToggleTodas={recepcion.toggleTodas}
              estaSeleccionada={recepcion.estaSeleccionada}
              onToggleFila={recepcion.toggleFila}
              acciones={accionesRecepcion}
              alerta={alertaFallos}
            />
            <SeccionLoteCoex
              titulo="En uso"
              descripcion="Expedientes recibidos por la estación y actualmente en consulta."
              filas={enUso}
              vacio={{
                title: 'Sin expedientes en uso',
                description: 'No hay expedientes recibidos actualmente.',
              }}
              mostrarSeleccion
              etiquetaSeleccionarTodo="Seleccionar todos los expedientes en uso"
              todasSeleccionadas={devolucion.todasSeleccionadas}
              seleccionParcial={devolucion.seleccionParcial}
              onToggleTodas={devolucion.toggleTodas}
              estaSeleccionada={devolucion.estaSeleccionada}
              onToggleFila={devolucion.toggleFila}
              acciones={accionesDevolucion}
              alerta={alertaFallosDevolucion}
            />
          </>
        )}
      </main>

      <ConfirmacionRecepcionCoex
        abierto={confirmacionAbierta}
        expedientes={recepcion.seleccionadas}
        enviando={recepcion.enviando}
        onCancelar={() => setConfirmacionAbierta(false)}
        onConfirmar={confirmarRecepcion}
      />

      <ConfirmacionDevolucionCoex
        abierto={confirmacionDevolucionAbierta}
        expedientes={devolucion.seleccionadas}
        enviando={devolucion.enviando}
        onCancelar={() => setConfirmacionDevolucionAbierta(false)}
        onConfirmar={confirmarDevolucion}
      />
    </div>
  )
}
