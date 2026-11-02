import { useMemo, useRef, useState } from 'react'
import { Alert, Button, Icon } from '@/shared/components/ui'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import { USANDO_DATOS_MOCK } from '../api/salidasExternasApi'
import { resolverIdentidadApiArchivo } from '../identidadArchivo'
import { useSalidasExternas } from '../hooks/useSalidasExternas'
import {
  abrirVentanaReporte,
  construirHtmlReporteSalidasExternas,
  escribirReporteEnVentana,
} from '../utils/reporteSalidasExternas'
import ArchivoLayout from '../components/ArchivoLayout.jsx'
import FormularioRecuperacion from '../components/salidasExternas/FormularioRecuperacion.jsx'
import PanelDevolucion from '../components/salidasExternas/PanelDevolucion.jsx'
import PanelPrestamo from '../components/salidasExternas/PanelPrestamo.jsx'
import PanelUltimaAccion from '../components/salidasExternas/PanelUltimaAccion.jsx'
import RelojOperativo from '../components/salidasExternas/RelojOperativo.jsx'
import TablaMovimientosExternos from '../components/salidasExternas/TablaMovimientosExternos.jsx'

const MODOS = [
  {
    id: 'prestamo',
    etiqueta: 'Registrar préstamo',
    descripcion: 'Salida del expediente',
    icono: 'assignment_add',
    ariaLabel: 'Modo: registrar préstamo',
    activo: 'border-primary bg-primary text-white',
    inactivo:
      'border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container',
    iconoActivo: 'text-white',
    iconoInactivo: 'text-primary',
  },
  {
    id: 'devolucion',
    etiqueta: 'Registrar devolución',
    descripcion: 'Regreso al archivo',
    icono: 'assignment_return',
    ariaLabel: 'Modo: registrar devolución',
    activo: 'border-emerald-600 bg-emerald-600 text-white',
    inactivo:
      'border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container',
    iconoActivo: 'text-white',
    iconoInactivo: 'text-emerald-600 dark:text-emerald-400',
  },
]

export default function SalidasExternasPage() {
  const { usuario } = useAuth()

  // Misma identidad efectiva que usa la Estación de Archivo para la API
  // (`identidadArchivo.js`). No se crea ni se fija una identidad nueva.
  const identidad = useMemo(() => resolverIdentidadApiArchivo(usuario), [usuario])

  const salidas = useSalidasExternas({ operador: identidad.idExterno })
  const {
    modo,
    cambiarModo,
    limpiarAvisos,
    operacionEnCurso,
    exitoRecuperacion,
    errorReversion,
    exitoReversion,
  } = salidas

  const [imprimiendo, setImprimiendo] = useState(false)
  const [errorImpresion, setErrorImpresion] = useState(null)
  const [avisoImpresion, setAvisoImpresion] = useState(null)
  const [recuperacionAbierta, setRecuperacionAbierta] = useState(false)

  // Guard sincrónico: un estado de React no alcanza para un doble clic.
  const imprimiendoRef = useRef(false)

  // Cambiar de modo nunca borra lo escrito. Si se abandona la devolución, se
  // descarta la búsqueda pendiente (sin tocar ningún registro).
  function elegirModo(nuevoModo) {
    if (nuevoModo === modo || operacionEnCurso) return
    if (modo === 'devolucion') salidas.cancelarDevolucion()
    cambiarModo(nuevoModo)
    limpiarAvisos()
  }

  // La ventana se abre de forma SÍNCRONA dentro del clic para que el navegador
  // no la bloquee; el contenido se escribe después de obtener el historial.
  async function imprimirReporte() {
    if (imprimiendoRef.current || operacionEnCurso) return

    // Se marca antes de abrir la ventana: si el navegador bloquea el pop-up,
    // el guard se libera igualmente.
    imprimiendoRef.current = true

    const ventana = abrirVentanaReporte()
    if (!ventana) {
      imprimiendoRef.current = false
      setAvisoImpresion(null)
      setErrorImpresion(
        'El navegador bloqueó la ventana del reporte. Permita las ventanas emergentes para esta página e intente de nuevo.',
      )
      return
    }

    setImprimiendo(true)
    setErrorImpresion(null)
    setAvisoImpresion(null)

    try {
      const registros = await salidas.obtenerHistorialCompleto()
      const instanteCorte = new Date()
      const html = construirHtmlReporteSalidasExternas({
        registros,
        fecha: salidas.hoy,
        instanteCorte,
        generadoPor: identidad.nombre,
        modoSimulacion: USANDO_DATOS_MOCK,
      })

      if (!escribirReporteEnVentana(ventana, html)) {
        ventana.close?.()
        setErrorImpresion('No se pudo preparar el documento de impresión.')
        return
      }

      setAvisoImpresion(
        'El reporte se abrió en una ventana nueva. Revise la vista previa del navegador antes de imprimir.',
      )
    } catch {
      ventana.close?.()
      setErrorImpresion('No se pudo generar el reporte. Intente de nuevo.')
    } finally {
      imprimiendoRef.current = false
      setImprimiendo(false)
    }
  }

  return (
    <ArchivoLayout>
      <main className="mx-auto w-full max-w-5xl space-y-4 px-4 py-4 sm:px-6 sm:py-6">
        <header className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 shadow-card sm:p-6">
          <div className="flex flex-wrap items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
              <Icon name="outbound" className="text-[24px]" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-headline-sm text-on-surface">Salidas externas</h2>
              <p className="mt-1 text-body-md text-on-surface-variant">
                Registro y control de préstamos de expedientes físicos.
              </p>
              <RelojOperativo className="mt-2" />
            </div>
            <Button
              type="button"
              size="lg"
              onClick={imprimirReporte}
              disabled={imprimiendo || operacionEnCurso}
              className="min-h-[52px] w-full sm:w-auto"
            >
              <Icon name={imprimiendo ? 'hourglass_top' : 'print'} className="text-[20px]" />
              {imprimiendo ? 'Preparando…' : 'Imprimir reporte del día'}
            </Button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-label-md text-on-surface-variant">
            <span className="inline-flex items-center gap-1">
              <Icon name="info" className="text-[16px] text-secondary" />
              Préstamo a personas, no es salida a Registro Médico
            </span>
          </div>
        </header>

        {errorImpresion && (
          <Alert tone="error" title="No se pudo abrir el reporte">
            <p>{errorImpresion}</p>
          </Alert>
        )}

        {avisoImpresion && (
          <Alert tone="info" title="Reporte generado">
            <p>{avisoImpresion}</p>
          </Alert>
        )}

        {USANDO_DATOS_MOCK && (
          <Alert tone="warning" title="Modo simulación">
            Los registros son temporales y se perderán al recargar la página.
          </Alert>
        )}

        <div role="group" aria-label="Modo de operación" className="grid gap-2 sm:grid-cols-2">
          {MODOS.map((opcion) => {
            const activo = modo === opcion.id
            return (
              <button
                key={opcion.id}
                type="button"
                aria-pressed={activo}
                aria-label={opcion.ariaLabel}
                onClick={() => elegirModo(opcion.id)}
                disabled={operacionEnCurso}
                className={`flex min-h-16 w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hro-blue disabled:cursor-not-allowed disabled:opacity-60 ${
                  activo ? opcion.activo : opcion.inactivo
                }`}
              >
                <Icon
                  name={opcion.icono}
                  className={`text-[24px] ${activo ? opcion.iconoActivo : opcion.iconoInactivo}`}
                />
                <span className="min-w-0">
                  <span className="block text-title-sm font-semibold">{opcion.etiqueta}</span>
                  <span
                    className={`block text-label-sm ${
                      activo ? 'text-white/80' : 'text-on-surface-variant'
                    }`}
                  >
                    {opcion.descripcion}
                  </span>
                </span>
              </button>
            )
          })}
        </div>

        <PanelUltimaAccion
          accion={salidas.ultimaAccion}
          onRevertir={salidas.revertirAccion}
          revirtiendo={salidas.revirtiendo}
        />

        {errorReversion && (
          <Alert tone="error" title="No se pudo revertir">
            <p>{errorReversion.mensaje}</p>
          </Alert>
        )}

        {exitoReversion && (
          <Alert tone="success" title="Acción revertida">
            <p>{exitoReversion}</p>
          </Alert>
        )}

        <div className="lg:min-h-[440px]">
          {modo === 'prestamo' ? (
            <div className="space-y-3">
              <PanelPrestamo
                personaRetira={salidas.personaRetira}
                onPersonaRetira={salidas.setPersonaRetira}
                motivo={salidas.motivo}
                onMotivo={salidas.setMotivo}
                numeroExpediente={salidas.numeroPrestamo}
                onNumeroExpediente={salidas.setNumeroPrestamo}
                onRegistrar={salidas.guardarPrestamo}
                guardando={salidas.guardandoPrestamo}
                error={salidas.errorPrestamo}
                exito={salidas.exitoPrestamo}
                verificando={salidas.verificandoPrestamo}
                verificacion={salidas.verificacionPrestamo}
                modoVerificacion={salidas.modoVerificacion}
              />

              <div className="w-full">
                <button
                  type="button"
                  onClick={() => setRecuperacionAbierta(true)}
                  disabled={operacionEnCurso}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg !bg-red-600 px-5 py-3 text-sm font-semibold !text-white transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hro-blue disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Icon name="restore" className="text-[20px]" />
                  Recuperar préstamo pendiente
                </button>
              </div>
            </div>
          ) : (
            <PanelDevolucion
              numeroExpediente={salidas.numeroDevolucion}
              onNumeroExpediente={salidas.setNumeroDevolucion}
              onRegistrar={salidas.registrarDevolucionDirecta}
              guardando={salidas.guardandoDevolucion}
              error={salidas.errorDevolucion}
              exito={salidas.exitoDevolucion}
            />
          )}
        </div>

        {exitoRecuperacion && (
          <Alert tone="success" title="Recuperación registrada">
            <p>{exitoRecuperacion}</p>
            <p className="mt-1">Queda pendiente de devolución.</p>
          </Alert>
        )}

        <TablaMovimientosExternos
          registros={salidas.registros}
          vista={salidas.vista}
          onCambiarVista={salidas.cambiarVista}
          busquedaLocal={salidas.busquedaLocal}
          onBuscar={salidas.cambiarBusquedaLocal}
          cargando={salidas.cargando}
          errorCarga={salidas.errorCarga}
          onReintentar={salidas.recargar}
          hoy={salidas.hoy}
          nombresPacientes={salidas.nombresPacientes}
          modoVerificacion={salidas.modoVerificacion}
        />

        <section
          aria-labelledby="titulo-contingencia"
          className="rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3"
        >
          <h3
            id="titulo-contingencia"
            className="text-label-md font-bold uppercase tracking-wider text-on-surface-variant"
          >
            Reporte y contingencia
          </h3>
          <p className="mt-1 text-body-sm text-on-surface-variant">
            El reporte impreso sirve como referencia física del día. Los registros de esta sesión se
            pierden al recargar la página, por lo que los expedientes pendientes pueden
            reconstruirse con «Recuperar préstamo pendiente». Los movimientos posteriores a la
            impresión no aparecerán en ese documento.
          </p>
        </section>

        <FormularioRecuperacion
          abierto={recuperacionAbierta}
          onCerrar={() => setRecuperacionAbierta(false)}
          onRecuperar={salidas.recuperarPrestamo}
          recuperando={salidas.guardandoRecuperacion}
          error={salidas.errorRecuperacion}
        />
      </main>
    </ArchivoLayout>
  )
}
