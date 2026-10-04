import { Card, Icon } from '@/shared/components/ui'
import LibroCitasLayout from '../components/LibroCitasLayout.jsx'

// Fase 5F.1: contenedor inicial identificable. El formulario, los contadores,
// la tabla y el guardado se implementan en fases posteriores.
export default function LibroCitasPage() {
  return (
    <LibroCitasLayout>
      <main className="mx-auto w-full max-w-7xl px-4 py-6">
        <div className="mb-6">
          <h2 className="text-headline-md text-on-surface">Libro de Citas</h2>
          <p className="text-body-md text-on-surface-variant">Registro digital de citas</p>
        </div>

        <Card>
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <Icon name="menu_book" className="text-[40px] text-outline" />
            <p className="text-body-md text-on-surface-variant">
              Aquí se construirá la captura del libro de citas.
            </p>
          </div>
        </Card>
      </main>
    </LibroCitasLayout>
  )
}
