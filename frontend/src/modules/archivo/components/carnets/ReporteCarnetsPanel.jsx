import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { Alert, EmptyState, Icon } from '@/shared/components/ui'
import BarraUmbralCarnet from './BarraUmbralCarnet.jsx'
import { calcularReporteCarnets } from '../../utils/limitesCarnets'

// Reporte de carnets registrados hoy por especialidad, en un panel lateral
// (slide-over derecho). Muestra el conteo, el avance sobre el límite y una
// alerta cuando alguna especialidad lo supera. Presentacional.
export default function ReporteCarnetsPanel({
  open,
  onClose,
  registros = [],
  especialidades = [],
}) {
  const filas = calcularReporteCarnets(registros, especialidades)
  const excedidas = filas.filter((fila) => fila.excedido)
  const maximoSinLimite = filas
    .filter((fila) => fila.limite == null)
    .reduce((maximo, fila) => Math.max(maximo, fila.registrados), 0)

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-on-surface/40" aria-hidden="true" />

      <div className="fixed inset-y-0 right-0 flex max-w-full">
        <DialogPanel className="flex w-screen max-w-md flex-col bg-surface-container-lowest shadow-modal">
          <header className="flex items-center justify-between gap-2 border-b border-outline-variant px-4 py-3">
            <DialogTitle className="text-title-md text-on-surface">
              Reporte de carnets por especialidad
            </DialogTitle>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar reporte"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-on-surface-variant transition hover:bg-surface-container focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hro-blue"
            >
              <Icon name="close" className="text-[20px]" />
            </button>
          </header>

          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
            <p className="text-body-sm text-on-surface-variant">
              Total registrado hoy: <strong className="text-on-surface">{registros.length}</strong>
            </p>

            {excedidas.length > 0 && (
              <Alert tone="warning" title="Límite superado">
                <ul className="mt-1 list-disc space-y-0.5 pl-4">
                  {excedidas.map((fila) => (
                    <li key={fila.especialidadId ?? fila.nombre}>
                      {fila.nombre}: {fila.registrados}/{fila.limite}
                    </li>
                  ))}
                </ul>
              </Alert>
            )}

            {filas.length === 0 ? (
              <EmptyState
                title="Sin datos"
                description="No hay especialidades para mostrar en el reporte."
              />
            ) : (
              <ul className="space-y-3">
                {filas.map((fila) => (
                  <BarraUmbralCarnet
                    key={fila.especialidadId ?? fila.nombre}
                    fila={fila}
                    maximoSinLimite={maximoSinLimite}
                  />
                ))}
              </ul>
            )}
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}
