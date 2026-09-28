import { useEffect, useRef, useState } from 'react'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import Icon from '@/shared/components/ui/Icon.jsx'
import Button from '@/shared/components/ui/Button.jsx'
import Spinner from '@/shared/components/ui/Spinner.jsx'
import Alert from '@/shared/components/ui/Alert.jsx'

export default function PacientesTemporalModal({
  abierto,
  onCerrar,
  onCargarPacientes,
  onSeleccionarPaciente,
}) {
  const [pacientes, setPacientes] = useState([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)
  const [cargado, setCargado] = useState(false)

  const cargarRef = useRef(onCargarPacientes)
  cargarRef.current = onCargarPacientes

  useEffect(() => {
    if (!abierto) return
    setCargando(true)
    setError(null)
    cargarRef
      .current()
      .then((lista) => {
        setPacientes(lista)
        setCargado(true)
      })
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false))
  }, [abierto])

  return (
    <Dialog open={abierto} onClose={onCerrar} className="relative z-50">
      <div className="fixed inset-0 bg-on-surface/40" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="flex max-h-[80vh] w-[min(560px,100%)] flex-col rounded-xl bg-surface-container-lowest shadow-modal">
          <header className="flex items-center justify-between border-b border-outline-variant px-4 py-3">
            <div className="flex items-center gap-2">
              <Icon name="folder_shared" className="text-[22px] text-primary" />
              <DialogTitle className="text-headline-sm text-on-surface">
                Pacientes registrados
              </DialogTitle>
              <span className="rounded bg-surface-container px-2 py-0.5 text-label-sm text-on-surface-variant">
                temporal
              </span>
            </div>
            <button
              type="button"
              onClick={onCerrar}
              aria-label="Cerrar"
              className="rounded-lg p-1 text-on-surface-variant hover:bg-surface-container"
            >
              <Icon name="close" className="text-[22px]" />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto px-4 py-3">
            {cargando && <Spinner label="Obteniendo registros..." />}

            {error && (
              <Alert tone="error" title="No se pudieron obtener los registros">
                {error}
              </Alert>
            )}

            {!cargando && !error && cargado && pacientes.length === 0 && (
              <p className="py-6 text-center text-body-sm text-on-surface-variant">
                Sin registros.
              </p>
            )}

            {!cargando && !error && pacientes.length > 0 && (
              <>
                <p className="mb-2 text-label-sm uppercase tracking-wider text-on-surface-variant">
                  {pacientes.length} registros
                </p>
                <ul className="divide-y divide-outline-variant overflow-hidden rounded-lg border border-outline-variant">
                  {pacientes.map((paciente) => (
                    <li key={paciente.id}>
                      <button
                        type="button"
                        onClick={() => onSeleccionarPaciente(paciente)}
                        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left hover:bg-surface-container-low"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-title-sm text-on-surface">
                            {paciente.nombres} {paciente.apellidos}
                          </span>
                          <span className="block text-label-sm text-on-surface-variant">
                            DPI {paciente.dpi} • {paciente.numeroExpediente}
                          </span>
                        </span>
                        <Icon name="arrow_forward" className="text-[18px] text-primary" />
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          <footer className="border-t border-outline-variant px-4 py-3">
            <Button variant="secondary" className="w-full" onClick={onCerrar}>
              Cerrar
            </Button>
          </footer>
        </DialogPanel>
      </div>
    </Dialog>
  )
}
