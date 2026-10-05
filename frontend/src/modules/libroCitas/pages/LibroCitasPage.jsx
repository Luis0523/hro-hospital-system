import { useState } from 'react'
import { Alert, Button, Card, Icon } from '@/shared/components/ui'
import { useToast } from '@/shared/context/ToastContext.jsx'
import LibroCitasLayout from '../components/LibroCitasLayout.jsx'
import FormularioCita from '../components/FormularioCita.jsx'
import ContadoresLibro from '../components/ContadoresLibro.jsx'
import TablaCitasCapturadas from '../components/TablaCitasCapturadas.jsx'
import { CONTADORES_INICIALES } from '../utils/contadores'
import { resumirPorEspecialidad } from '../utils/resumenEspecialidades'
import { guardarLibroCitas } from '../api/libroCitasApi'

// Clave local determinista: expediente + fecha + especialidad.
function claveFila({ numeroExpediente, fecha, especialidadId }) {
  return `${numeroExpediente}|${fecha}|${especialidadId}`
}

export default function LibroCitasPage() {
  const [contadores, setContadores] = useState(CONTADORES_INICIALES)
  const [filas, setFilas] = useState([])
  const [mensajeDuplicado, setMensajeDuplicado] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const { mostrarToast } = useToast()

  // Derivado de `filas`; no se almacena en estado.
  const resumen = resumirPorEspecialidad(filas)

  function manejarCambioContador(clave, valor) {
    setContadores((actuales) => ({ ...actuales, [clave]: valor }))
  }

  /** @returns {boolean} true si la fila se agregó; false si era duplicada. */
  function manejarAgregar(payload) {
    const idLocal = claveFila(payload)
    if (filas.some((fila) => fila.idLocal === idLocal)) {
      setMensajeDuplicado('El expediente ya fue agregado para esta fecha y especialidad.')
      return false
    }

    setMensajeDuplicado(null)
    setFilas((actuales) => [...actuales, { idLocal, ...payload }])
    return true
  }

  function manejarEliminar(idLocal) {
    setFilas((actuales) => actuales.filter((fila) => fila.idLocal !== idLocal))
    setMensajeDuplicado(null)
  }

  async function manejarGuardar() {
    if (filas.length === 0 || guardando) return

    setGuardando(true)
    try {
      const items = filas.map((fila) => ({
        numeroExpediente: fila.numeroExpediente,
        nombrePaciente: fila.nombrePaciente,
        fecha: fila.fecha,
        especialidadId: fila.especialidadId,
        especialidadNombre: fila.especialidadNombre,
      }))
      await guardarLibroCitas({ contadores, items })
      mostrarToast({ tone: 'success', title: 'Registro guardado correctamente.' })
      // La guía indica limpiar la tabla; los contadores se mantienen.
      setFilas([])
      setMensajeDuplicado(null)
    } finally {
      setGuardando(false)
    }
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
          {mensajeDuplicado && (
            <div className="mt-4">
              <Alert tone="warning" title="Expediente duplicado">
                {mensajeDuplicado}
              </Alert>
            </div>
          )}
        </Card>

        <Card>
          <ContadoresLibro valores={contadores} onChange={manejarCambioContador} />
        </Card>

        <Card>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-title-md text-on-surface">Citas capturadas</h3>
            <p className="text-body-sm text-on-surface-variant">
              Expedientes capturados: <span data-testid="total-expedientes">{filas.length}</span>
            </p>
          </div>

          <TablaCitasCapturadas filas={filas} onEliminar={manejarEliminar} />

          <div className="mt-6">
            <h4 className="mb-2 text-title-sm uppercase tracking-wider text-on-surface-variant">
              Resumen por especialidad
            </h4>
            {resumen.length === 0 ? (
              <p className="text-body-sm text-on-surface-variant">
                Aún no hay expedientes capturados.
              </p>
            ) : (
              <ul className="space-y-1">
                {resumen.map((item) => (
                  <li
                    key={item.especialidadId}
                    data-testid={`resumen-especialidad-${item.especialidadId}`}
                    className="flex items-center justify-between rounded-lg bg-surface-container-low px-3 py-2 text-sm"
                  >
                    <span className="text-on-surface">{item.especialidadNombre}</span>
                    <span className="tabular-nums font-semibold text-primary">{item.cantidad}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-6 flex justify-end">
            <Button
              type="button"
              onClick={manejarGuardar}
              disabled={filas.length === 0 || guardando}
            >
              <Icon name="save" className="text-[18px]" />
              Guardar registro
            </Button>
          </div>
        </Card>
      </main>
    </LibroCitasLayout>
  )
}
