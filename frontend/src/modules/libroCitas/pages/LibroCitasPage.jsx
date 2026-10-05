import { useState } from 'react'
import { Card } from '@/shared/components/ui'
import LibroCitasLayout from '../components/LibroCitasLayout.jsx'
import FormularioCita from '../components/FormularioCita.jsx'
import ContadoresLibro from '../components/ContadoresLibro.jsx'
import { CONTADORES_INICIALES } from '../utils/contadores'

// Fase 5F.3: formulario de captura (5F.2) + contadores diarios con Total
// derivado. La tabla acumulada, el resumen por especialidad y el guardado del
// paquete se implementan en fases posteriores.
export default function LibroCitasPage() {
  const [contadores, setContadores] = useState(CONTADORES_INICIALES)

  function manejarAgregar() {}

  function manejarCambioContador(clave, valor) {
    setContadores((actuales) => ({ ...actuales, [clave]: valor }))
  }

  return (
    <LibroCitasLayout>
      <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6">
        <div>
          <h2 className="text-headline-md text-on-surface">Libro de Citas</h2>
          <p className="text-body-md text-on-surface-variant">Registro digital de citas</p>
        </div>

        <Card>
          <h3 className="mb-4 text-title-md text-on-surface">Captura de cita</h3>
          <FormularioCita onAgregar={manejarAgregar} />
        </Card>

        <Card>
          <ContadoresLibro valores={contadores} onChange={manejarCambioContador} />
        </Card>
      </main>
    </LibroCitasLayout>
  )
}
