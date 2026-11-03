import { useEffect, useRef, useState } from 'react'
import { Alert, Button, Icon, Spinner } from '@/shared/components/ui'
import { useToast } from '@/shared/context/ToastContext.jsx'
import { formatearFechaLarga } from '@/shared/utils/fecha'
import { USANDO_DATOS_MOCK } from '../api/depuracionArchivoApi'
import ArchivoLayout from '../components/ArchivoLayout.jsx'
import BuscadorBitacoraDepurados from '../components/depuracion/BuscadorBitacoraDepurados.jsx'
import BuscadorExpedienteDepurar from '../components/depuracion/BuscadorExpedienteDepurar.jsx'
import ModalConfirmarDepuracion from '../components/depuracion/ModalConfirmarDepuracion.jsx'
import ModalDeshacerDepuracion from '../components/depuracion/ModalDeshacerDepuracion.jsx'
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

function coincideExpediente(expediente, numero) {
  if (!expediente) return false
  return (
    String(expediente.numeroExpediente).replace(/\D/g, '') === String(numero).replace(/\D/g, '')
  )
}

export default function DepuracionExpedientesPage() {
  const {
    numero,
    setNumero,
    resultado,
    estado,
    mensaje,
    exito,
    depurados,
    procesando,
    confirmacionAbierta,
    errorConfirmacion,
    ultimaDepuracion,
    confirmacionDeshacerAbierta,
    errorDeshacer,
    deshaciendo,
    exitoDeshacer,
    modoCaptura,
    bitacoraCargada,
    cargandoBitacora,
    errorBitacora,
    consultaCompleta,
    desactualizado,
    etiquetaPeriodo,
    textoVacioHistorial,
    datosHistorial,
    inputRef,
    buscar,
    alternarModoCaptura,
    abrirConfirmacion,
    cerrarConfirmacion,
    confirmarDepuracion,
    abrirDeshacer,
    cerrarDeshacer,
    confirmarDeshacer,
    reintentarBitacora,
  } = useDepuracionExpediente()
  const { mostrarToast } = useToast()
  const exitoNotificadoRef = useRef(null)
  const confirmacionSolicitadaRef = useRef(false)
  const [busquedaExpediente, setBusquedaExpediente] = useState('')

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

  async function manejarEnvio() {
    if (confirmacionAbierta || confirmacionSolicitadaRef.current) return

    const valor = numero.trim()
    if (!valor) return

    if (estado === 'encontrado' && coincideExpediente(resultado, valor)) {
      abrirConfirmacion()
      return
    }

    confirmacionSolicitadaRef.current = true
    try {
      const respuesta = await buscar(numero)
      if (respuesta?.estado === 'encontrado' && respuesta.resultado) {
        abrirConfirmacion(respuesta.resultado)
      }
    } finally {
      confirmacionSolicitadaRef.current = false
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
            onEnviar={manejarEnvio}
            inputRef={inputRef}
            procesando={procesando}
            manual={modoCaptura === 'manual'}
            onAlternarModo={alternarModoCaptura}
          />

          <section className="space-y-3">
            {estado === 'buscando' && (
              <p
                role="status"
                className="flex items-center gap-2 text-label-sm text-on-surface-variant"
              >
                <Icon name="progress_activity" className="animate-spin text-[16px] text-primary" />
                Buscando expediente…
              </p>
            )}

            {exitoDeshacer && (
              <Alert tone="success" title="Depuración simulada revertida">
                {exitoDeshacer}
              </Alert>
            )}

            {(estado === 'formato_invalido' ||
              estado === 'no_encontrado' ||
              estado === 'duplicado' ||
              estado === 'error') &&
              mensaje && <Alert tone={estado === 'error' ? 'error' : 'warning'} title={mensaje} />}
          </section>
        </div>

        <ModalConfirmarDepuracion
          abierto={confirmacionAbierta}
          expediente={resultado}
          onConfirmar={confirmarDepuracion}
          onCerrar={cerrarConfirmacion}
          procesando={procesando}
          error={errorConfirmacion}
        />

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
              caption="Depurados de hoy: expediente, paciente y hora."
              etiquetaLista="Depurados de hoy (tarjetas)"
            />
          </>
        )}
      </main>
    </ArchivoLayout>
  )
}
