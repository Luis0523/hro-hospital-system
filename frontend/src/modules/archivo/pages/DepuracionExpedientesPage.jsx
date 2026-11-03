import { useState } from 'react'
import { Alert, Button, Icon, Spinner } from '@/shared/components/ui'
import { formatearFechaLarga } from '@/shared/utils/fecha'
import { USANDO_DATOS_MOCK } from '../api/depuracionArchivoApi'
import ArchivoLayout from '../components/ArchivoLayout.jsx'
import BuscadorBitacoraDepurados from '../components/depuracion/BuscadorBitacoraDepurados.jsx'
import BuscadorExpedienteDepurar from '../components/depuracion/BuscadorExpedienteDepurar.jsx'
import FiltrosBitacoraDepurados from '../components/depuracion/FiltrosBitacoraDepurados.jsx'
import ModalConfirmacionDepuracion from '../components/depuracion/ModalConfirmacionDepuracion.jsx'
import ModalConsultaRangoLargo from '../components/depuracion/ModalConsultaRangoLargo.jsx'
import ModalDeshacerDepuracion from '../components/depuracion/ModalDeshacerDepuracion.jsx'
import TablaDepurados from '../components/depuracion/TablaDepurados.jsx'
import TarjetaConfirmacionDepurar from '../components/depuracion/TarjetaConfirmacionDepurar.jsx'
import UltimaDepuracionPanel from '../components/depuracion/UltimaDepuracionPanel.jsx'
import { useEscanerCodigo } from '../hooks/useEscanerCodigo'
import { useDepuracionExpediente } from '../hooks/useDepuracionExpediente'
import { filtrarDepuradosPorExpediente } from '../utils/busquedaDepurados'
import { hoyIsoGuatemala } from '../utils/fechaDepuracionGuatemala'
import {
  descargarReporteDepurados,
  motivoReporteNoDisponible,
  puedeGenerarReporteDepurados,
} from '../utils/reporteDepurados'

export default function DepuracionExpedientesPage() {
  const {
    numero,
    setNumero,
    resultado,
    estado,
    mensaje,
    exito,
    motivo,
    setMotivo,
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
    filtroSeleccionado,
    filtroActivo,
    rangoBorrador,
    errorRango,
    confirmacionRangoLargoAbierta,
    periodoPendiente,
    confirmarRangoLargo,
    cancelarRangoLargo,
    etiquetaPeriodo,
    tituloHistorial,
    textoVacioHistorial,
    datosHistorial,
    inputRef,
    buscar,
    alternarModoCaptura,
    establecerModoCaptura,
    abrirConfirmacion,
    cerrarConfirmacion,
    confirmarDepuracion,
    abrirDeshacer,
    cerrarDeshacer,
    confirmarDeshacer,
    reintentarBitacora,
    seleccionarPeriodo,
    cambiarRango,
    aplicarRangoPersonalizado,
    restablecerRango,
  } = useDepuracionExpediente()
  const [errorReporte, setErrorReporte] = useState(null)
  const [busquedaExpediente, setBusquedaExpediente] = useState('')
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

  const escaner = useEscanerCodigo((codigo) => {
    const valor = String(codigo ?? '').trim()
    if (!valor) return
    // Un código escaneado siempre representa la identidad numérica, aunque el
    // operador haya abierto la captura manual.
    establecerModoCaptura('normal')
    setNumero(valor)
  })

  function generarReporte() {
    if (!puedeGenerarReporte) return
    setErrorReporte(null)
    const resultado = descargarReporteDepurados({
      datosHistorial: datosReporte,
      usandoMock: USANDO_DATOS_MOCK,
      periodoEtiqueta: etiquetaPeriodo,
      busquedaExpediente: filtroBitacora.busquedaActiva ? busquedaExpediente : '',
    })
    if (!resultado.ok) setErrorReporte(resultado.mensaje)
  }

  return (
    <ArchivoLayout>
      <main className="mx-auto w-full max-w-6xl space-y-4 px-4 py-4">
        <header className="rounded-2xl bg-surface-container-lowest p-4 shadow-card sm:p-5">
          <h2 className="text-headline-sm text-on-surface">Depuración de expedientes</h2>
          <p className="mt-1 text-body-md text-on-surface-variant">
            Ingrese el número de expediente para marcarlo como “ya no existe en el sistema”.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-label-md text-on-surface-variant">
            <span className="inline-flex items-center gap-1">
              <Icon name="calendar_today" className="text-[16px] text-secondary" />
              {formatearFechaLarga(hoyIsoGuatemala())}
            </span>
            <span className="inline-flex items-center gap-1">
              <Icon name="barcode_scanner" className="text-[16px] text-primary" />
              Lector listo · foco permanente
            </span>
          </div>
        </header>

        <div className="mx-auto w-full max-w-2xl space-y-4">
          <BuscadorExpedienteDepurar
            numero={numero}
            onCambio={setNumero}
            onEnviar={() => buscar(numero)}
            inputRef={inputRef}
            procesando={procesando}
            escaner={escaner}
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

            {exito && (
              <Alert tone="success" title="Expediente depurado">
                {exito}
              </Alert>
            )}

            {exitoDeshacer && (
              <Alert tone="success" title="Depuración simulada revertida">
                {exitoDeshacer}
              </Alert>
            )}

            {estado === 'encontrado' && resultado && (
              <>
                <p role="status" className="sr-only">
                  Expediente encontrado. Revise los datos y pulse Depurar expediente para confirmar.
                </p>
                <TarjetaConfirmacionDepurar
                  expediente={resultado}
                  onSolicitarDepuracion={abrirConfirmacion}
                />
              </>
            )}

            {estado === 'duplicado' && resultado && (
              <TarjetaConfirmacionDepurar expediente={resultado} yaDepurado />
            )}

            {(estado === 'formato_invalido' || estado === 'no_encontrado' || estado === 'error') &&
              mensaje && <Alert tone={estado === 'error' ? 'error' : 'warning'} title={mensaje} />}
          </section>

          {USANDO_DATOS_MOCK && ultimaDepuracion && (
            <UltimaDepuracionPanel
              depuracion={ultimaDepuracion}
              onDeshacer={abrirDeshacer}
              deshaciendo={deshaciendo}
            />
          )}
        </div>

        <ModalConfirmacionDepuracion
          abierto={confirmacionAbierta}
          expediente={resultado}
          motivo={motivo}
          onMotivo={setMotivo}
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

        {!USANDO_DATOS_MOCK && (
          <ModalConsultaRangoLargo
            abierto={confirmacionRangoLargoAbierta}
            periodo={periodoPendiente}
            onConfirmar={confirmarRangoLargo}
            onCancelar={cancelarRangoLargo}
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

        <BuscadorBitacoraDepurados
          valor={busquedaExpediente}
          onChange={setBusquedaExpediente}
          totalPeriodo={totalPeriodo}
          totalCoincidencias={filtroBitacora.totalCoincidencias}
        />

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

            {(depurados.length > 0 || (consultaCompleta && !desactualizado)) && (
              <TablaDepurados
                depurados={filtroBitacora.registros}
                titulo={tituloHistorial}
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
                caption={`${tituloHistorial}: fecha, hora, expediente, paciente, usuario y motivo.`}
                etiquetaLista={`${tituloHistorial} (tarjetas)`}
              />
            )}
          </>
        )}

        <section
          aria-labelledby="reporte-depurados-titulo"
          className="space-y-3 rounded-2xl bg-surface-container-lowest p-4 shadow-card sm:p-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h3
                id="reporte-depurados-titulo"
                className="inline-flex items-center gap-1 text-title-md font-bold text-on-surface"
              >
                <Icon name="description" className="text-[20px] text-primary" />
                Reporte de depurados
              </h3>
              <p className="mt-1 text-label-sm text-on-surface-variant">
                Usa los registros completos del período y la búsqueda activa.
              </p>
            </div>
            <Button
              size="md"
              variant="secondary"
              className="min-h-11"
              onClick={generarReporte}
              disabled={!puedeGenerarReporte}
              aria-describedby={bloqueoReporte ? 'reporte-depurados-motivo' : undefined}
            >
              <Icon name="picture_as_pdf" className="text-[18px]" />
              Descargar reporte PDF
            </Button>
          </div>

          {bloqueoReporte && (
            <p id="reporte-depurados-motivo" className="text-label-sm text-on-surface-variant">
              {bloqueoReporte}
            </p>
          )}

          {errorReporte && (
            <Alert tone="warning" title="No se pudo generar el reporte PDF">
              {errorReporte}
            </Alert>
          )}
        </section>
      </main>
    </ArchivoLayout>
  )
}
