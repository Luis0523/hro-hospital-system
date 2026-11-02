import { Alert, Button, Icon, Spinner } from '@/shared/components/ui'
import { formatearFechaLarga } from '@/shared/utils/fecha'
import { USANDO_DATOS_MOCK } from '../api/depuracionArchivoApi'
import ArchivoLayout from '../components/ArchivoLayout.jsx'
import BuscadorExpedienteDepurar from '../components/depuracion/BuscadorExpedienteDepurar.jsx'
import TablaDepurados from '../components/depuracion/TablaDepurados.jsx'
import TarjetaConfirmacionDepurar from '../components/depuracion/TarjetaConfirmacionDepurar.jsx'
import { useEscanerCodigo } from '../hooks/useEscanerCodigo'
import { useDepuracionExpediente } from '../hooks/useDepuracionExpediente'
import { hoyIsoGuatemala } from '../utils/fechaDepuracionGuatemala'

// Depuración de expedientes: ingresar solo el número → búsqueda automática →
// confirmación de baja lógica (sin correlativo) → bitácora del día.
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
    bitacoraCargada,
    cargandoBitacora,
    errorBitacora,
    inputRef,
    buscar,
    confirmarDepuracion,
    reintentarBitacora,
  } = useDepuracionExpediente()

  const escaner = useEscanerCodigo((codigo) => {
    const valor = String(codigo ?? '').trim()
    if (valor) setNumero(valor)
  })

  return (
    <ArchivoLayout>
      <main className="mx-auto w-full max-w-6xl space-y-4 px-4 py-4">
        <header className="rounded-xl bg-surface-container-lowest p-4 shadow-card">
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

        <div className="max-w-2xl space-y-4">
          <BuscadorExpedienteDepurar
            numero={numero}
            onCambio={setNumero}
            onEnviar={() => buscar(numero)}
            inputRef={inputRef}
            procesando={procesando}
            escaner={escaner}
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

            {estado === 'encontrado' && resultado && (
              <>
                <p role="status" className="sr-only">
                  Expediente encontrado. Verifique los datos y confirme la baja.
                </p>
                <TarjetaConfirmacionDepurar
                  expediente={resultado}
                  motivo={motivo}
                  onMotivo={setMotivo}
                  onConfirmar={confirmarDepuracion}
                  procesando={procesando}
                />
              </>
            )}

            {estado === 'duplicado' && resultado && (
              <TarjetaConfirmacionDepurar expediente={resultado} yaDepurado />
            )}

            {(estado === 'no_encontrado' || estado === 'error') && mensaje && (
              <Alert tone={estado === 'no_encontrado' ? 'warning' : 'error'} title={mensaje} />
            )}
          </section>
        </div>

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
          <section className="rounded-xl bg-surface-container-lowest p-4 shadow-card">
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
            {errorBitacora && (
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

            {cargandoBitacora && (
              <p
                role="status"
                className="flex items-center gap-2 text-label-sm text-on-surface-variant"
              >
                <Icon name="progress_activity" className="animate-spin text-[16px] text-primary" />
                Actualizando bitácora…
              </p>
            )}

            <TablaDepurados depurados={depurados} />
          </>
        )}
      </main>
    </ArchivoLayout>
  )
}
