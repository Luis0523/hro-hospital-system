import { useEffect, useRef, useState } from 'react'
import { Alert, Button, Icon, Modal, Spinner } from '@/shared/components/ui'
import { useToast } from '@/shared/context/ToastContext.jsx'
import { formatearFechaLarga } from '@/shared/utils/fecha'
import { formatearExpediente } from '@/shared/utils/expediente'
import { USANDO_DATOS_MOCK } from '../api/depuracionArchivoApi'
import ArchivoLayout from '../components/ArchivoLayout.jsx'
import BuscadorBitacoraDepurados from '../components/depuracion/BuscadorBitacoraDepurados.jsx'
import BuscadorExpedienteDepurar from '../components/depuracion/BuscadorExpedienteDepurar.jsx'
import ModalDeshacerDepuracion from '../components/depuracion/ModalDeshacerDepuracion.jsx'
import ModalRegistroManualDepuracion from '../components/depuracion/ModalRegistroManualDepuracion.jsx'
import TablaDepurados from '../components/depuracion/TablaDepurados.jsx'
import { useDepuracionExpediente } from '../hooks/useDepuracionExpediente'
import { filtrarDepuradosPorExpediente } from '../utils/busquedaDepurados'
import { hoyIsoGuatemala } from '../utils/fechaDepuracionGuatemala'
import {
  descargarReporteDepurados,
  motivoReporteNoDisponible,
  puedeGenerarReporteDepurados,
} from '../utils/reporteDepurados'

function fechaLargaCapitalizada(iso) {
  const texto = formatearFechaLarga(iso)
  return texto ? texto.charAt(0).toUpperCase() + texto.slice(1) : ''
}

export default function DepuracionExpedientesPage() {
  const {
    numero,
    setNumero,
    estado,
    mensaje,
    exito,
    depurados,
    procesando,
    cola,
    fallidos,
    ultimaDepuracion,
    confirmacionDeshacerAbierta,
    errorDeshacer,
    deshaciendo,
    exitoDeshacer,
    bitacoraCargada,
    cargandoBitacora,
    errorBitacora,
    consultaCompleta,
    desactualizado,
    etiquetaPeriodo,
    textoVacioHistorial,
    datosHistorial,
    inputRef,
    agregar,
    registrarManual,
    eliminar,
    abrirDeshacer,
    cerrarDeshacer,
    confirmarDeshacer,
    reintentarBitacora,
  } = useDepuracionExpediente()
  const { mostrarToast } = useToast()
  const exitoNotificadoRef = useRef(null)
  const [busquedaExpediente, setBusquedaExpediente] = useState('')
  const [registroManualAbierto, setRegistroManualAbierto] = useState(false)
  const [porEliminar, setPorEliminar] = useState(null)
  const [eliminando, setEliminando] = useState(false)

  useEffect(() => {
    if (!exito) {
      exitoNotificadoRef.current = null
      return
    }
    if (exitoNotificadoRef.current === exito) return

    exitoNotificadoRef.current = exito
    mostrarToast({ tone: 'success', title: 'Expediente depurado correctamente' })
  }, [exito, mostrarToast])

  const filtroBitacora = filtrarDepuradosPorExpediente(depurados, busquedaExpediente)
  const totalPeriodo = datosHistorial.total
  const datosReporte = {
    ...datosHistorial,
    registros: filtroBitacora.registros,
    total: filtroBitacora.totalCoincidencias,
  }
  const puedeGenerarReporte = puedeGenerarReporteDepurados(datosReporte)
  const bloqueoHistorial = motivoReporteNoDisponible(datosHistorial)
  const bloqueoReporte =
    bloqueoHistorial ||
    (filtroBitacora.busquedaActiva && filtroBitacora.totalCoincidencias === 0
      ? 'No hay coincidencias para el número de expediente buscado.'
      : '')

  async function confirmarEliminar() {
    if (!porEliminar || eliminando) return
    setEliminando(true)
    try {
      await eliminar(porEliminar.id)
      setPorEliminar(null)
      mostrarToast({ tone: 'success', title: 'Depuración eliminada' })
    } catch (fallo) {
      mostrarToast({
        tone: 'error',
        title: 'No se pudo eliminar la depuración',
        message: fallo?.message,
      })
    } finally {
      setEliminando(false)
    }
  }

  function generarReporte() {
    if (!puedeGenerarReporte) return
    const resultado = descargarReporteDepurados({
      datosHistorial: datosReporte,
      usandoMock: USANDO_DATOS_MOCK,
      periodoEtiqueta: etiquetaPeriodo,
      busquedaExpediente: filtroBitacora.busquedaActiva ? busquedaExpediente : '',
    })
    if (!resultado.ok) {
      mostrarToast({
        tone: 'error',
        title: 'No se pudo generar el reporte PDF',
        message: resultado.mensaje,
      })
    }
  }

  const accionesTabla = (
    <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto sm:flex-nowrap">
      <BuscadorBitacoraDepurados valor={busquedaExpediente} onChange={setBusquedaExpediente} />

      {USANDO_DATOS_MOCK && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="min-h-11 min-w-11 px-3"
          onClick={abrirDeshacer}
          disabled={!ultimaDepuracion || deshaciendo}
          title={!ultimaDepuracion ? 'No hay una depuración reversible en esta sesión.' : undefined}
          aria-label="Deshacer"
        >
          <Icon name="undo" className="text-[18px]" />
          <span className="hidden sm:inline">Deshacer</span>
        </Button>
      )}

      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="min-h-11 min-w-11 px-3"
        onClick={generarReporte}
        disabled={!puedeGenerarReporte}
        title={bloqueoReporte || undefined}
        aria-label="Descargar PDF"
        aria-describedby={bloqueoReporte ? 'bloqueo-reporte-depurados' : undefined}
      >
        <Icon name="picture_as_pdf" className="text-[18px]" />
        <span className="hidden sm:inline">Descargar PDF</span>
      </Button>

      {bloqueoReporte && (
        <span id="bloqueo-reporte-depurados" className="sr-only">
          {bloqueoReporte}
        </span>
      )}
    </div>
  )

  return (
    <ArchivoLayout>
      <main className="mx-auto w-full max-w-6xl space-y-4 px-4 py-4">
        <header className="rounded-2xl bg-surface-container-lowest p-4 shadow-card sm:p-5">
          <h2 className="text-headline-sm text-on-surface">Depuración de expedientes</h2>
          <p className="mt-1 text-body-md text-on-surface-variant">
            Ingrese el número de expediente para marcarlo como “ya no existe en el sistema”.
          </p>
          <p className="mt-3 flex items-center gap-2 text-body-md font-semibold text-on-surface">
            <Icon name="calendar_today" className="shrink-0 text-[20px] text-secondary" />
            <time dateTime={hoyIsoGuatemala()}>{fechaLargaCapitalizada(hoyIsoGuatemala())}</time>
          </p>
        </header>

        <div className="mx-auto w-full max-w-2xl space-y-4">
          <BuscadorExpedienteDepurar
            numero={numero}
            onCambio={setNumero}
            onEnviar={agregar}
            inputRef={inputRef}
            procesando={procesando}
            cola={cola}
            aviso={estado === 'formato_invalido' ? mensaje : null}
            onAbrirRegistroManual={() => setRegistroManualAbierto(true)}
          />

          <section className="space-y-3">
            {exitoDeshacer && (
              <Alert tone="success" title="Depuración simulada revertida">
                {exitoDeshacer}
              </Alert>
            )}

            {(estado === 'no_encontrado' || estado === 'duplicado' || estado === 'error') &&
              mensaje && <Alert tone={estado === 'error' ? 'error' : 'warning'} title={mensaje} />}

            {fallidos > 0 && (
              <p className="text-label-sm text-on-surface-variant">
                {fallidos} {fallidos === 1 ? 'registro falló' : 'registros fallaron'} en esta
                sesión.
              </p>
            )}
          </section>
        </div>

        <ModalRegistroManualDepuracion
          abierto={registroManualAbierto}
          onCerrar={() => setRegistroManualAbierto(false)}
          onGuardar={(datos) => registrarManual(datos)}
          onRegistrado={() => {
            setRegistroManualAbierto(false)
            mostrarToast({ tone: 'success', title: 'Expediente depurado manualmente' })
          }}
        />

        <Modal
          open={Boolean(porEliminar)}
          onClose={() => {
            if (!eliminando) setPorEliminar(null)
          }}
          title="Eliminar depuración"
          size="sm"
        >
          <div className="space-y-4">
            <p>
              ¿Eliminar la depuración del expediente{' '}
              <strong>{formatearExpediente(porEliminar?.numeroExpediente)}</strong>
              {porEliminar?.pacienteNombre ? ` (${porEliminar.pacienteNombre})` : ''}? El expediente
              volverá a estar disponible.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setPorEliminar(null)} disabled={eliminando}>
                Cancelar
              </Button>
              <Button variant="danger" onClick={confirmarEliminar} disabled={eliminando}>
                {eliminando ? 'Eliminando…' : 'Sí, eliminar'}
              </Button>
            </div>
          </div>
        </Modal>

        {USANDO_DATOS_MOCK && (
          <ModalDeshacerDepuracion
            abierto={confirmacionDeshacerAbierta}
            depuracion={ultimaDepuracion}
            onConfirmar={confirmarDeshacer}
            onCerrar={cerrarDeshacer}
            deshaciendo={deshaciendo}
            error={errorDeshacer}
          />
        )}

        {USANDO_DATOS_MOCK && (
          <p className="flex items-start gap-2 rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-label-sm text-on-surface-variant">
            <Icon name="science" className="text-[16px] text-primary" />
            <span>
              Modo simulación — Los registros se almacenan temporalmente y no se guardan en el
              servidor.
            </span>
          </p>
        )}

        {!bitacoraCargada && cargandoBitacora && (
          <section className="rounded-2xl bg-surface-container-lowest p-4 shadow-card">
            <Spinner label="Cargando bitácora…" />
          </section>
        )}

        {!bitacoraCargada && !cargandoBitacora && errorBitacora && (
          <Alert tone="error" title="No se pudo cargar la bitácora">
            <p className="mt-1">{errorBitacora}</p>
            <div className="mt-3">
              <Button size="sm" variant="secondary" onClick={reintentarBitacora}>
                <Icon name="refresh" className="text-[18px]" />
                Reintentar
              </Button>
            </div>
          </Alert>
        )}

        {bitacoraCargada && (
          <>
            {errorBitacora && desactualizado && (
              <Alert tone="warning" title="No se pudo actualizar la bitácora">
                <p className="mt-1">{errorBitacora} El listado puede estar desactualizado.</p>
                <div className="mt-3">
                  <Button size="sm" variant="secondary" onClick={reintentarBitacora}>
                    <Icon name="refresh" className="text-[18px]" />
                    Reintentar
                  </Button>
                </div>
              </Alert>
            )}

            {errorBitacora && !desactualizado && !consultaCompleta && (
              <Alert tone="error" title="Consulta incompleta">
                <p className="mt-1">
                  {errorBitacora} El listado contiene solo los días consultados y no es una base
                  válida para reportes.
                </p>
                <div className="mt-3">
                  <Button size="sm" variant="secondary" onClick={reintentarBitacora}>
                    <Icon name="refresh" className="text-[18px]" />
                    Reintentar
                  </Button>
                </div>
              </Alert>
            )}

            {cargandoBitacora && (
              <p
                role="status"
                className="flex items-center gap-2 text-label-sm text-on-surface-variant"
              >
                <Icon name="progress_activity" className="animate-spin text-[16px] text-primary" />
                Actualizando bitácora…
              </p>
            )}

            <TablaDepurados
              depurados={filtroBitacora.registros}
              titulo="Depurados de hoy"
              descripcion={etiquetaPeriodo}
              total={totalPeriodo}
              totalCoincidencias={filtroBitacora.totalCoincidencias}
              busquedaActiva={filtroBitacora.busquedaActiva}
              sinRegistros={
                filtroBitacora.busquedaActiva
                  ? 'No hay coincidencias para el número de expediente buscado'
                  : textoVacioHistorial
              }
              consultaIncompleta={!consultaCompleta}
              desactualizado={desactualizado}
              acciones={accionesTabla}
              onEliminar={setPorEliminar}
              eliminandoId={eliminando ? porEliminar?.id : null}
              caption="Depurados de hoy: expediente, paciente y hora."
              etiquetaLista="Depurados de hoy (tarjetas)"
            />
          </>
        )}
      </main>
    </ArchivoLayout>
  )
}
