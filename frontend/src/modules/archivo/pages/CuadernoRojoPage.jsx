import { Card } from '@/shared/components/ui'
import ArchivoLayout from '../components/ArchivoLayout.jsx'
import CuadernoRojoFormulario from '../components/CuadernoRojoFormulario.jsx'
import CuadernoRojoHistorial from '../components/CuadernoRojoHistorial.jsx'

// Historial inicialmente vacío: aún no existe integración de backend para esta
// pantalla. No se generan registros de demostración ni persistencia local.
const HISTORIAL_INICIAL = []

export default function CuadernoRojoPage() {
  return (
    <ArchivoLayout>
      <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6">
        <div>
          <h2 className="text-headline-md text-on-surface">Registro del Cuaderno Rojo</h2>
          <p className="text-body-md text-on-surface-variant">
            Registro diario del cuaderno físico del Hospital Regional de Occidente.
          </p>
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
