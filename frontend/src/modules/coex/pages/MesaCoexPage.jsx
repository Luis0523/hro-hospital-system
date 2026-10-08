import { useCallback, useEffect, useState } from 'react'
import Alert from '@/shared/components/ui/Alert.jsx'
import Button from '@/shared/components/ui/Button.jsx'
import EmptyState from '@/shared/components/ui/EmptyState.jsx'
import Icon from '@/shared/components/ui/Icon.jsx'
import InputFecha from '@/shared/components/ui/InputFecha.jsx'
import Spinner from '@/shared/components/ui/Spinner.jsx'
import AppShell from '@/shared/components/AppShell.jsx'
import { useToast } from '@/shared/context/ToastContext.jsx'
import { SECCIONES_ENFERMERIA } from '@/modules/enfermeria/seccionesEnfermeria'
import { devolverCarnet, listarCarnets, recibirCarnet } from '@/modules/carnets/api/carnetsApi'
import { useDevolucionCoex } from '../hooks/useDevolucionCoex'
import { useDescargaPdfCoex } from '../hooks/useDescargaPdfCoex'
import { useLoteCoex } from '../hooks/useLoteCoex'
import { useRecepcionCoex } from '../hooks/useRecepcionCoex'
import { useRefrescoAutomaticoCoex } from '../hooks/useRefrescoAutomaticoCoex'
import ConfirmacionDevolucionCoex from '../components/ConfirmacionDevolucionCoex.jsx'
import ConfirmacionRecepcionCoex from '../components/ConfirmacionRecepcionCoex.jsx'
import ResumenLoteCoex from '../components/ResumenLoteCoex.jsx'
import SeccionLoteCoex from '../components/SeccionLoteCoex.jsx'
import SeccionCarnetsCoex from '../components/SeccionCarnetsCoex.jsx'

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

  // Descarga del PDF de salida: acción manual independiente (no acoplada a
  // Recibir/Devolver). Ver `useDescargaPdfCoex` para el motivo.
  const { descargandoPdf, descargarSalidaPdf } = useDescargaPdfCoex({ fecha, mostrarToast })

  const mutando = recepcion.enviando || devolucion.enviando
  useRefrescoAutomaticoCoex({ refrescar: refrescarSilencioso, pausado: mutando })

  const [confirmacionAbierta, setConfirmacionAbierta] = useState(false)
  const [confirmacionDevolucionAbierta, setConfirmacionDevolucionAbierta] = useState(false)
  const [carnetsPorExpediente, setCarnetsPorExpediente] = useState(() => new Map())

  const cargarCarnets = useCallback(async () => {
    try {
      const lista = await listarCarnets({ fecha })
      setCarnetsPorExpediente(
        new Map((lista ?? []).filter((c) => c.numeroExpediente).map((c) => [c.numeroExpediente, c])),
      )
    } catch {
      // Best-effort: los carnets no deben romper Mesa COEX.
    }
  }, [fecha])

  useEffect(() => {
    cargarCarnets()
  }, [cargarCarnets])

  // Sincroniza (best-effort) el estado del carnet tras recibir/devolver.
  const sincronizarCarnets = useCallback(
    async (filas, transicion) => {
      await Promise.all(
        filas.map(async (fila) => {
          const carnet = carnetsPorExpediente.get(fila.numeroExpediente)
          if (!carnet) return
          try {
            await transicion(carnet.id)
          } catch {
            // El carnet pudo no estar en el estado requerido; se ignora.
          }
        }),
      )
      cargarCarnets()
    },
    [carnetsPorExpediente, cargarCarnets],
  )

  async function confirmarRecepcion() {
    const seleccionadas = [...recepcion.seleccionadas]
    await recepcion.recibirSeleccionados()
    setConfirmacionAbierta(false)
    sincronizarCarnets(seleccionadas, recibirCarnet)
  }

  async function confirmarDevolucion() {
    const seleccionadas = [...devolucion.seleccionadas]
    await devolucion.devolverSeleccionados()
    setConfirmacionDevolucionAbierta(false)
    sincronizarCarnets(seleccionadas, devolverCarnet)
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
        <p className="mb-2 break-words">
          Los siguientes expedientes no se recibieron y siguen seleccionados:
        </p>
        <ul className="list-inside list-disc">
          {fallidos.map(({ fila, error: fallo }) => (
            <li key={String(fila.cicloId)} className="break-words">
              {fila.numeroExpediente || fila.cicloId}
              {fallo?.message ? ` — ${fallo.message}` : ''}
            </li>
          ))}
        </ul>
        <div className="mt-2">
          <Button
            variant="ghost"
            size="sm"
            className="min-h-11"
            onClick={recepcion.descartarResultado}
          >
            Descartar
          </Button>
        </div>
      </Alert>
    ) : null

  const accionesRecepcion = (
    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
      <span
        className="min-w-0 break-words text-label-md text-on-surface-variant"
        aria-live="polite"
      >
        {recepcion.cantidadSeleccionada} seleccionado
        {recepcion.cantidadSeleccionada === 1 ? '' : 's'}
      </span>
      <Button
        size="sm"
        className="min-h-11 w-full sm:w-auto"
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
        <p className="mb-2 break-words">
          Los siguientes expedientes no se devolvieron y siguen seleccionados:
        </p>
        <ul className="list-inside list-disc">
          {fallidosDevolucion.map(({ fila, error: fallo }) => (
            <li key={String(fila.cicloId)} className="break-words">
              {fila.numeroExpediente || fila.cicloId}
              {fallo?.message ? ` — ${fallo.message}` : ''}
            </li>
          ))}
        </ul>
        <div className="mt-2">
          <Button
            variant="ghost"
            size="sm"
            className="min-h-11"
            onClick={devolucion.descartarResultado}
          >
            Descartar
          </Button>
        </div>
      </Alert>
    ) : null

  const accionesDevolucion = (
    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
      <span
        className="min-w-0 break-words text-label-md text-on-surface-variant"
        aria-live="polite"
      >
        {devolucion.cantidadSeleccionada} seleccionado
        {devolucion.cantidadSeleccionada === 1 ? '' : 's'}
      </span>
      <Button
        size="sm"
        className="min-h-11 w-full sm:w-auto"
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
    <AppShell
      titulo="Mesa COEX"
      icono="inventory_2"
      secciones={SECCIONES_ENFERMERIA}
      contexto={
        estacion ? (
          <div className="rounded-lg bg-surface-container-low px-3 py-2">
            <p className="truncate text-title-sm font-semibold text-on-surface">
              {estacion.nombre ?? estacion.codigo}
            </p>
            <p className="truncate text-label-sm uppercase text-on-surface-variant">
              {estacion.codigo}
              {estacion.ubicacion ? ` · ${estacion.ubicacion}` : ''}
            </p>
          </div>
        ) : null
      }
    >
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-6">
        <div className="w-full max-w-xs">
          <InputFecha
            label="Fecha de trabajo"
            name="fecha"
            value={fecha}
            onChange={(valor) => setFecha(valor)}
          />
        </div>

        <SeccionCarnetsCoex fecha={fecha} estacionId={estacion?.id} />

        {estacion && (
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
              <Button
                variant="ghost"
                size="sm"
                className="min-h-11 w-full sm:w-auto"
                onClick={() => refrescarSilencioso()}
                disabled={refrescando || mutando || cargando}
                aria-busy={refrescando || undefined}
              >
                <Icon name="refresh" className="text-[18px]" />
                {refrescando ? 'Actualizando…' : 'Actualizar'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="min-h-11 w-full text-center sm:w-auto"
                onClick={descargarSalidaPdf}
                disabled={descargandoPdf}
                aria-busy={descargandoPdf || undefined}
              >
                <Icon name="picture_as_pdf" className="text-[18px]" />
                {descargandoPdf ? 'Descargando…' : 'Descargar PDF de salida del día'}
              </Button>
            </div>
            <span
              className="min-w-0 break-words text-label-sm text-on-surface-variant"
              aria-live="polite"
            >
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
                    className="min-h-11"
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
              carnetsPorExpediente={carnetsPorExpediente}
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
              carnetsPorExpediente={carnetsPorExpediente}
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
    </AppShell>
  )
}
