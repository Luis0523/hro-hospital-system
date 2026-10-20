import { Card, Icon } from '@/shared/components/ui'
import ArchivoLayout from '../components/ArchivoLayout.jsx'
import CuadernoRojoFormulario from '../components/CuadernoRojoFormulario.jsx'
import CuadernoRojoHistorial from '../components/CuadernoRojoHistorial.jsx'

// Historial inicialmente vacío: aún no existe integración de backend para esta
// pantalla. No se generan registros de demostración ni persistencia local.
const HISTORIAL_INICIAL = []

// Plantilla estática servida desde `public/`. Se compone con la base URL de Vite
// para funcionar igual en desarrollo y bajo un subdirectorio de despliegue.
const RUTA_PLANTILLA_PDF = `${import.meta.env.BASE_URL || '/'}plantillas/cuaderno-rojo.pdf`

export default function CuadernoRojoPage() {
  return (
    <ArchivoLayout>
      <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-headline-md text-on-surface">Registro del Cuaderno Rojo</h2>
            <p className="text-body-md text-on-surface-variant">
              Registro diario del cuaderno físico del Hospital Regional de Occidente.
            </p>
          </div>

          <a
            href={RUTA_PLANTILLA_PDF}
            download="cuaderno-rojo.pdf"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2.5 text-sm font-semibold text-primary transition hover:bg-surface-container-low focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hro-blue"
          >
            <Icon name="download" className="text-[18px]" />
            Descargar plantilla PDF
          </a>
        </div>

        <Card>
          <h3 className="mb-4 text-title-md text-on-surface">Registro del día</h3>
          <CuadernoRojoFormulario />
        </Card>

        <Card>
          <CuadernoRojoHistorial registros={HISTORIAL_INICIAL} />
        </Card>
      </main>
    </ArchivoLayout>
  )
}
