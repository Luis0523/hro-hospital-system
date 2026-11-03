import { useState } from 'react'
import { Alert, Button, Icon, Spinner } from '@/shared/components/ui'
import { useToast } from '@/shared/context/ToastContext.jsx'
import { USANDO_DATOS_MOCK } from '../../api/depuracionArchivoApi'
import BuscadorBitacoraDepurados from '../depuracion/BuscadorBitacoraDepurados.jsx'
import FiltrosBitacoraDepurados from '../depuracion/FiltrosBitacoraDepurados.jsx'
import ModalConsultaRangoLargo from '../depuracion/ModalConsultaRangoLargo.jsx'
import TablaDepurados from '../depuracion/TablaDepurados.jsx'
import { useHistorialDepurados } from '../../hooks/useHistorialDepurados'
import { filtrarDepuradosPorExpediente } from '../../utils/busquedaDepurados'
import {
  descargarReporteDepurados,
  motivoReporteNoDisponible,
  puedeGenerarReporteDepurados,
} from '../../utils/reporteDepurados'

// Historial histórico de depuraciones dentro de Consolidado. La consulta y la
// búsqueda se reutilizan del módulo de Depuración, sin acciones de baja.
export default function HistorialDepuracionesConsolidado() {
  const {
    bitacoraCargada,
    cargandoBitacora,
    errorBitacora,
    consultaCompleta,
    desactualizado,
    filtroSeleccionado,
    filtroActivo,
    etiquetaPeriodo,
    tituloHistorial,
    textoVacioHistorial,
    datosHistorial,
    rangoBorrador,
    errorRango,
    confirmacionRangoLargoAbierta,
    periodoPendiente,
    confirmarRangoLargo,
    cancelarRangoLargo,
    seleccionarPeriodo,
    cambiarRango,
    aplicarRangoPersonalizado,
    restablecerRango,
    reintentarBitacora,
  } = useHistorialDepurados()
  const { mostrarToast } = useToast()
  const [busquedaExpediente, setBusquedaExpediente] = useState('')

  const filtroBitacora = filtrarDepuradosPorExpediente(datosHistorial.registros, busquedaExpediente)
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

  const acciones = (
    <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto sm:flex-nowrap">
      <BuscadorBitacoraDepurados valor={busquedaExpediente} onChange={setBusquedaExpediente} />
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="min-h-11 min-w-11 px-3"
        onClick={generarReporte}
        disabled={!puedeGenerarReporte}
        title={bloqueoReporte || undefined}
        aria-label="Descargar PDF"
        aria-describedby={bloqueoReporte ? 'bloqueo-reporte-historial-depuraciones' : undefined}
      >
        <Icon name="picture_as_pdf" className="text-[18px]" />
        <span className="hidden sm:inline">Descargar PDF</span>
      </Button>
      {bloqueoReporte && (
        <span id="bloqueo-reporte-historial-depuraciones" className="sr-only">
          {bloqueoReporte}
        </span>
      )}
    </div>
  )

  return (
    <div className="space-y-4">
      <FiltrosBitacoraDepurados
        filtroSeleccionado={filtroSeleccionado}
        filtroActivo={filtroActivo}
        etiquetaActiva={etiquetaPeriodo}
        rango={rangoBorrador}
        errorRango={errorRango}
        onSeleccionar={seleccionarPeriodo}
        onCambiarRango={cambiarRango}
        onAplicarRango={aplicarRangoPersonalizado}
        onRestablecerRango={restablecerRango}
      />

      {!bitacoraCargada && cargandoBitacora && (
        <section className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 shadow-card">
          <Spinner label="Cargando historial de depuraciones…" />
        </section>
      )}

      {!bitacoraCargada && !cargandoBitacora && errorBitacora && (
        <Alert tone="error" title="No se pudo cargar el historial de depuraciones">
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
            <Alert tone="warning" title="No se pudo actualizar el historial">
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
              Actualizando historial…
            </p>
          )}

          <TablaDepurados
            depurados={filtroBitacora.registros}
            titulo={tituloHistorial}
            descripcion={etiquetaPeriodo}
            total={datosHistorial.total}
            totalCoincidencias={filtroBitacora.totalCoincidencias}
            busquedaActiva={filtroBitacora.busquedaActiva}
            sinRegistros={
              filtroBitacora.busquedaActiva
                ? 'No hay coincidencias para el número de expediente buscado'
                : textoVacioHistorial
            }
            consultaIncompleta={!consultaCompleta}
            desactualizado={desactualizado}
            mostrarFecha={datosHistorial.dias.length > 1}
            acciones={acciones}
            caption={`${tituloHistorial}: expediente, paciente y hora.`}
            etiquetaLista={`${tituloHistorial} (tarjetas)`}
          />
        </>
      )}

      {!USANDO_DATOS_MOCK && (
        <ModalConsultaRangoLargo
          abierto={confirmacionRangoLargoAbierta}
          periodo={periodoPendiente}
          onConfirmar={confirmarRangoLargo}
          onCancelar={cancelarRangoLargo}
        />
      )}
    </div>
  )
}
