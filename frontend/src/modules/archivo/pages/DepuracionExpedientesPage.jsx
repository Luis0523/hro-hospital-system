import { Alert, Icon } from '@/shared/components/ui'
import { formatearFechaLarga, hoyIso } from '@/shared/utils/fecha'
import ArchivoLayout from '../components/ArchivoLayout.jsx'
import BuscadorExpedienteDepurar from '../components/depuracion/BuscadorExpedienteDepurar.jsx'
import TablaDepurados from '../components/depuracion/TablaDepurados.jsx'
import TarjetaConfirmacionDepurar from '../components/depuracion/TarjetaConfirmacionDepurar.jsx'
import { useEscanerCodigo } from '../hooks/useEscanerCodigo'
import { useDepuracionExpediente } from '../hooks/useDepuracionExpediente'

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
    inputRef,
    buscar,
    confirmarDepuracion,
  } = useDepuracionExpediente()

  const escaner = useEscanerCodigo((codigo) => {
    const valor = String(codigo ?? '').trim()
    if (valor) setNumero(valor)
  })

  return (
    <ArchivoLayout>
      <main className="mx-auto max-w-2xl space-y-4 px-4 py-4">
        <header className="rounded-xl bg-surface-container-lowest p-4 shadow-card">
          <h2 className="text-headline-sm text-on-surface">Depuración de expedientes</h2>
          <p className="mt-1 text-body-md text-on-surface-variant">
            Ingrese el número de expediente para marcarlo como “ya no existe en el sistema”.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-label-md text-on-surface-variant">
            <span className="inline-flex items-center gap-1">
              <Icon name="calendar_today" className="text-[16px] text-secondary" />
              {formatearFechaLarga(hoyIso())}
            </span>
            <span className="inline-flex items-center gap-1">
              <Icon name="barcode_scanner" className="text-[16px] text-primary" />
              Lector listo · foco permanente
            </span>
          </div>
        </header>

        <BuscadorExpedienteDepurar
          numero={numero}
          onCambio={setNumero}
          onEnviar={() => buscar(numero)}
          inputRef={inputRef}
          procesando={procesando}
          escaner={escaner}
        />

        <section className="space-y-3" aria-live="polite" aria-atomic="true">
          {exito && (
            <Alert tone="success" title="Expediente depurado">
              {exito}
            </Alert>
          )}

          {estado === 'encontrado' && resultado && (
            <TarjetaConfirmacionDepurar
              expediente={resultado}
              motivo={motivo}
              onMotivo={setMotivo}
              onConfirmar={confirmarDepuracion}
              procesando={procesando}
            />
          )}

          {estado === 'duplicado' && resultado && (
            <TarjetaConfirmacionDepurar expediente={resultado} yaDepurado />
          )}

          {(estado === 'no_encontrado' || estado === 'error') && mensaje && (
            <Alert tone={estado === 'no_encontrado' ? 'warning' : 'error'} title={mensaje} />
          )}
        </section>

        <TablaDepurados depurados={depurados} />
      </main>
    </ArchivoLayout>
  )
}
