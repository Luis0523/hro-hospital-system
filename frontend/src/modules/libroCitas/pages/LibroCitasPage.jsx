import { Card } from '@/shared/components/ui'
import LibroCitasLayout from '../components/LibroCitasLayout.jsx'
import FormularioCita from '../components/FormularioCita.jsx'

// Fase 5F.2: formulario de captura con búsqueda mock del paciente. El payload
// se recibe pero todavía NO se persiste ni se muestra en una tabla (5F.3).
export default function LibroCitasPage() {
  function manejarAgregar() {}

  return (
    <LibroCitasLayout>
      <main className="mx-auto w-full max-w-7xl px-4 py-6">
        <div className="mb-6">
          <h2 className="text-headline-md text-on-surface">Libro de Citas</h2>
          <p className="text-body-md text-on-surface-variant">Registro digital de citas</p>
        </div>

        <Card>
          <h3 className="mb-4 text-title-md text-on-surface">Captura de cita</h3>
          <FormularioCita onAgregar={manejarAgregar} />
        </Card>
      </main>
    </LibroCitasLayout>
  )
}
