import { EmptyState } from '@/shared/components/ui'
import ArchivoLayout from '../components/ArchivoLayout.jsx'

// Sección provisional (SCRUM-148). Solo navegación; sin lógica de negocio.
export default function DepuracionExpedientesPage() {
  return (
    <ArchivoLayout>
      <main className="mx-auto max-w-7xl px-4 py-6">
        <EmptyState
          title="Depuración de expedientes"
          description="Sección provisional. La funcionalidad se definirá en una fase posterior."
        />
      </main>
    </ArchivoLayout>
  )
}
