import { Alert, Card, Icon } from '@/shared/components/ui'
import { useToast } from '@/shared/context/ToastContext.jsx'
import ArchivoLayout from '../components/ArchivoLayout.jsx'
import CuadernoRojoFormulario from '../components/CuadernoRojoFormulario.jsx'
import CuadernoRojoHistorial from '../components/CuadernoRojoHistorial.jsx'
import { useCuadernoRojo } from '../hooks/useCuadernoRojo'

// Plantilla estática servida desde `public/`. Se compone con la base URL de Vite
// para funcionar igual en desarrollo y bajo un subdirectorio de despliegue.
const RUTA_PLANTILLA_PDF = `${import.meta.env.BASE_URL || '/'}plantillas/cuaderno-rojo.pdf`

export default function CuadernoRojoPage() {
  const { mostrarToast } = useToast()
  const {
    valores,
    errores,
    tocados,
    existente,
    registros,
    cargandoHistorial,
    cargandoDia,
    guardando,
    error,
    cambiarCampo,
    marcarTocado,
    guardar,
    recargarHistorial,
  } = useCuadernoRojo()

  async function manejarGuardar() {
    const resultado = await guardar()
    if (resultado.ok) {
      mostrarToast({
        tone: 'success',
        title: 'Registro guardado',
        message: `Cuaderno Rojo del ${resultado.registro?.fecha ?? valores.fecha}.`,
      })
    } else {
      mostrarToast({
        tone: 'error',
        title: 'No se pudo guardar',
        message: resultado.error,
      })
    }
  }

  return (
    <ArchivoLayout>
      <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-headline-md text-on-surface">Registro del Cuaderno Rojo</h2>
            <p className="text-body-md text-on-surface-variant">
              Registro diario del cuaderno físico del Hospital Regional de Occidente.
            </p>
          </div>

          <a
            href={RUTA_PLANTILLA_PDF}
            download="cuaderno-rojo.pdf"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2.5 text-sm font-semibold text-primary transition hover:bg-surface-container-low focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hro-blue sm:w-auto"
          >
            <Icon name="download" className="text-[18px]" />
            Descargar plantilla PDF
          </a>
        </div>

        {error && (
          <Alert tone="error" title="Ocurrió un problema">
            {error}
          </Alert>
        )}

        <Card>
          <h3 className="mb-4 text-title-md text-on-surface">Registro del día</h3>
          <CuadernoRojoFormulario
            valores={valores}
            errores={errores}
            tocados={tocados}
            existente={existente}
            cargandoDia={cargandoDia}
            guardando={guardando}
            onCambiar={cambiarCampo}
            onBlur={marcarTocado}
            onGuardar={manejarGuardar}
          />
        </Card>

        <Card>
          <CuadernoRojoHistorial
            registros={registros}
            cargando={cargandoHistorial}
            onRecargar={recargarHistorial}
          />
        </Card>
      </main>
    </ArchivoLayout>
  )
}
