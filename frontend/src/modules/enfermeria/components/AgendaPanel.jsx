import { useState } from 'react'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import Icon from '@/shared/components/ui/Icon.jsx'
import Button from '@/shared/components/ui/Button.jsx'
import Alert from '@/shared/components/ui/Alert.jsx'
import Spinner from '@/shared/components/ui/Spinner.jsx'
import { formatearFechaLarga } from '@/shared/utils/fecha'

function ChipPaciente({ paciente, onQuitar }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg bg-secondary-fixed px-3 py-2 text-on-secondary-container">
      <div className="min-w-0">
        <p className="truncate text-title-sm">
          {paciente.nombres} {paciente.apellidos}
        </p>
        <p className="text-label-sm">
          DPI {paciente.dpi} • {paciente.numeroExpediente}
        </p>
      </div>
      <button
        type="button"
        onClick={onQuitar}
        aria-label="Quitar paciente"
        className="rounded-md p-1 hover:bg-on-secondary-container/10"
      >
        <Icon name="close" className="text-[18px]" />
      </button>
    </div>
  )
}

function ComprobanteCita({ cita, onCerrar }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center gap-1 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <Icon name="event_available" className="text-[28px]" />
        </span>
        <p className="text-headline-sm text-on-surface">Cita agendada</p>
        <p className="text-body-sm text-on-surface-variant">
          {cita.clinicaNombre} • {cita.medicoNombre}
        </p>
      </div>

      <div className="rounded-xl border border-outline-variant bg-surface-container-low p-4">
        <p className="text-label-sm uppercase tracking-wider text-on-surface-variant">
          Ventana de presentación
        </p>
        <p className="text-metric-sub text-primary">
          {cita.horaVentanaInicio?.slice(0, 5)} – {cita.horaVentanaFin?.slice(0, 5)}
        </p>
        <p className="mt-1 text-body-sm text-on-surface-variant">
          Hora estimada de atención:{' '}
          <span className="font-semibold text-on-surface">{cita.horaEstimada?.slice(0, 5)}</span>
        </p>
        <p className="mt-2 text-body-sm text-on-surface">{formatearFechaLarga(cita.fechaCita)}</p>
      </div>

      <p className="text-body-sm text-on-surface-variant">
        Indique al paciente presentarse con su DPI dentro de la ventana para confirmar su llegada en
        la Estación de Enfermería.
      </p>

      <Button onClick={onCerrar}>Listo</Button>
    </div>
  )
}

export default function AgendaPanel({
  abierto,
  fecha,
  cupos = [],
  cargandoCupos = false,
  cupoSeleccionado,
  onSeleccionarCupo,
  paciente,
  onQuitarPaciente,
  onSeleccionarPaciente,
  onBuscarPacientes,
  citaCreada,
  agendando = false,
  sinCupo = false,
  error,
  onAgendar,
  onCerrar,
}) {
  const [query, setQuery] = useState('')
  const [resultados, setResultados] = useState([])
  const [buscando, setBuscando] = useState(false)

  async function manejarBusqueda(event) {
    event.preventDefault()
    const termino = query.trim()
    if (!termino) return
    setBuscando(true)
    try {
      setResultados(await onBuscarPacientes(termino))
    } finally {
      setBuscando(false)
    }
  }

  function seleccionarPaciente(pacienteElegido) {
    setResultados([])
    setQuery('')
    onSeleccionarPaciente(pacienteElegido)
  }

  return (
    <Dialog open={abierto} onClose={onCerrar} className="relative z-50">
      <div className="fixed inset-0 bg-on-surface/40" aria-hidden="true" />

      <div className="fixed inset-0 flex justify-end">
        <DialogPanel className="flex h-full w-[min(420px,100%)] flex-col bg-surface-container-lowest shadow-modal">
          <header className="flex items-center justify-between border-b border-outline-variant px-4 py-3">
            <div className="flex items-center gap-2">
              <Icon name="event_upcoming" className="text-[22px] text-primary" />
              <DialogTitle className="text-headline-sm text-on-surface">Agendar cita</DialogTitle>
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

          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
            {citaCreada ? (
              <ComprobanteCita cita={citaCreada} onCerrar={onCerrar} />
            ) : (
              <>
                <div>
                  <p className="text-label-sm uppercase tracking-wider text-on-surface-variant">
                    Fecha seleccionada
                  </p>
                  <p className="text-title-md text-on-surface">{formatearFechaLarga(fecha)}</p>
                </div>

                <div className="space-y-2">
                  <p className="text-label-sm uppercase tracking-wider text-on-surface-variant">
                    Paciente
                  </p>
                  {paciente ? (
                    <ChipPaciente paciente={paciente} onQuitar={onQuitarPaciente} />
                  ) : (
                    <div className="space-y-2">
                      <form onSubmit={manejarBusqueda} className="flex gap-2">
                        <input
                          value={query}
                          onChange={(event) => setQuery(event.target.value)}
                          placeholder="Buscar por DPI, carné o nombre"
                          aria-label="Buscar paciente para agendar"
                          className="h-11 w-full rounded-lg border border-outline-variant px-3 text-body-md outline-none focus:border-primary-container focus:ring-2 focus:ring-secondary-fixed-dim"
                        />
                        <Button type="submit" size="sm" disabled={buscando}>
                          {buscando ? '...' : 'Buscar'}
                        </Button>
                      </form>
                      {resultados.length > 0 && (
                        <ul className="divide-y divide-outline-variant overflow-hidden rounded-lg border border-outline-variant">
                          {resultados.map((resultado) => (
                            <li key={resultado.id}>
                              <button
                                type="button"
                                onClick={() => seleccionarPaciente(resultado)}
                                className="w-full px-3 py-2 text-left hover:bg-surface-container-low"
                              >
                                <p className="text-title-sm text-on-surface">
                                  {resultado.nombres} {resultado.apellidos}
                                </p>
                                <p className="text-label-sm text-on-surface-variant">
                                  DPI {resultado.dpi} • {resultado.numeroExpediente}
                                </p>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                      <p className="text-label-sm text-on-surface-variant">
                        También puede escanear el DPI o carné en la barra inferior.
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-label-sm uppercase tracking-wider text-on-surface-variant">
                    Cupos del día
                  </p>
                  {cargandoCupos && <Spinner label="Cargando cupos..." />}
                  {!cargandoCupos && cupos.length === 0 && (
                    <p className="rounded-lg border border-dashed border-outline-variant bg-surface-container-low px-3 py-4 text-center text-body-sm text-on-surface-variant">
                      No hay cupos para la fecha seleccionada. Pruebe otro día.
                    </p>
                  )}
                  <div className="flex flex-col gap-1">
                    {cupos.map((cupo) => {
                      const activo = cupoSeleccionado?.id === cupo.id
                      return (
                        <button
                          key={cupo.id}
                          type="button"
                          disabled={!cupo.disponible}
                          onClick={() => onSeleccionarCupo(cupo)}
                          aria-pressed={activo}
                          className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left transition ${
                            activo
                              ? 'border-primary-container bg-secondary-fixed/40'
                              : 'border-outline-variant hover:bg-surface-container-low'
                          } ${!cupo.disponible ? 'cursor-not-allowed opacity-50' : ''}`}
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-title-sm text-on-surface">
                              {cupo.clinicaNombre}
                            </span>
                            <span className="block truncate text-label-sm text-on-surface-variant">
                              {cupo.medicoNombre} • {cupo.horaInicio?.slice(0, 5)}–
                              {cupo.horaFin?.slice(0, 5)}
                            </span>
                          </span>
                          <span
                            className={`text-label-sm font-bold ${
                              cupo.disponible ? 'text-primary' : 'text-outline'
                            }`}
                          >
                            {cupo.cuposDisponibles} cupos
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {error && (
                  <Alert
                    tone="error"
                    title={sinCupo ? 'Sin cupos disponibles' : 'No se pudo agendar'}
                  >
                    {error}
                  </Alert>
                )}
              </>
            )}
          </div>

          {!citaCreada && (
            <footer className="border-t border-outline-variant px-4 py-3">
              <Button
                className="w-full"
                size="lg"
                disabled={!paciente || !cupoSeleccionado || agendando}
                onClick={onAgendar}
              >
                {agendando ? 'Agendando...' : 'Agendar cita'}
              </Button>
            </footer>
          )}
        </DialogPanel>
      </div>
    </Dialog>
  )
}
