import { useEffect, useMemo, useRef, useState } from 'react'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { Button, Icon, Select } from '@/shared/components/ui'
import {
  buscarPacientes,
  consultarDisponibilidad,
  listarSubespecialidadesDeEspecialidad,
} from '../../api/enfermeriaApi'
import { formatearFechaLarga, mesDe } from '@/shared/utils/fecha'
import CalendarioCuposCita, { rangoDePeriodo } from './CalendarioCuposCita'

function textoRelativo(iso) {
  if (!iso) return ''
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const objetivo = new Date(`${iso}T00:00:00`)
  const dias = Math.round((objetivo - hoy) / 86400000)
  if (dias === 0) return 'Hoy'
  if (dias === 1) return 'Mañana'
  if (dias < 0) return 'Fecha pasada'
  if (dias < 30) return `En ${dias} días`
  const meses = Math.round(dias / 30)
  return `En ${meses} ${meses === 1 ? 'mes' : 'meses'}`
}

function etiquetaTurno(turno) {
  if (!turno?.codigo || turno?.numero == null) return 'Correlativo seleccionado'
  return `${turno.codigo}-${String(turno.numero).padStart(2, '0')}`
}

export default function PanelCitar({
  abierto,
  turno,
  especialidadNombre,
  especialidadTurnoId = null,
  especialidades = [],
  clinicas = [],
  onCerrar,
  onAsignarExpediente,
  onAgendar,
  onBuscarPacientes = buscarPacientes,
}) {
  const [busqueda, setBusqueda] = useState('')
  const [resultados, setResultados] = useState([])
  const [buscando, setBuscando] = useState(false)
  const [pacienteSugerido, setPacienteSugerido] = useState(null)
  const [expediente, setExpediente] = useState('')
  const [especialidadId, setEspecialidadId] = useState('')
  const [clinicaId, setClinicaId] = useState('')
  const [fecha, setFecha] = useState('')
  const [vista, setVista] = useState('mes')
  const [cursor, setCursor] = useState(() => new Date())
  const [subespecialidadIds, setSubespecialidadIds] = useState([])
  const [catalogoListo, setCatalogoListo] = useState(false)
  const [dias, setDias] = useState([])
  const [cargandoDias, setCargandoDias] = useState(false)
  const [procesandoExpediente, setProcesandoExpediente] = useState(false)
  const [agendando, setAgendando] = useState(false)
  const [error, setError] = useState(null)
  const turnoIdRef = useRef(null)

  useEffect(() => {
    if (!abierto) {
      turnoIdRef.current = null
      return
    }

    const id = turno?.id ?? null
    if (turnoIdRef.current === id) return
    turnoIdRef.current = id

    const proxima = turno?.proximaVisita ?? ''
    const especialidadActual =
      turno?.especialidadId != null
        ? String(turno.especialidadId)
        : especialidadTurnoId != null
          ? String(especialidadTurnoId)
          : String(especialidades[0]?.id ?? '')

    setFecha(proxima)
    setExpediente(turno?.numeroExpediente ?? '')
    setPacienteSugerido(null)
    setEspecialidadId(especialidadActual)
    setClinicaId(turno?.clinicaId != null ? String(turno.clinicaId) : '')
    setVista('mes')
    setCursor(proxima ? mesDe(proxima) : new Date())
    setBusqueda('')
    setResultados([])
    setError(null)
  }, [abierto, turno, especialidadTurnoId, especialidades])

  useEffect(() => {
    if (!abierto || !especialidadId) {
      setSubespecialidadIds([])
      setCatalogoListo(false)
      return undefined
    }

    let activo = true
    setCatalogoListo(false)
    listarSubespecialidadesDeEspecialidad(especialidadId)
      .then((lista) => {
        if (!activo) return
        setSubespecialidadIds(
          (Array.isArray(lista) ? lista : [])
            .map((subespecialidad) => subespecialidad?.id)
            .filter((id) => id != null),
        )
      })
      .catch(() => {
        if (activo) setSubespecialidadIds([])
      })
      .finally(() => {
        if (activo) setCatalogoListo(true)
      })

    return () => {
      activo = false
    }
  }, [abierto, especialidadId])

  const rango = useMemo(() => rangoDePeriodo(vista, cursor), [vista, cursor])

  useEffect(() => {
    if (!abierto || !catalogoListo) return undefined

    let activo = true
    setCargandoDias(true)
    consultarDisponibilidad({
      subespecialidadIds,
      fechaInicio: rango.fechaInicio,
      fechaFin: rango.fechaFin,
    })
      .then((lista) => {
        if (activo) setDias(Array.isArray(lista) ? lista : [])
      })
      .catch(() => {
        if (activo) setDias([])
      })
      .finally(() => {
        if (activo) setCargandoDias(false)
      })

    return () => {
      activo = false
    }
  }, [
    abierto,
    catalogoListo,
    especialidadId,
    subespecialidadIds,
    rango.fechaInicio,
    rango.fechaFin,
  ])

  const opcionesEspecialidad = useMemo(() => {
    const opciones = especialidades.map((especialidad) => ({
      value: String(especialidad.id),
      label: especialidad.nombre,
    }))
    const actual =
      turno?.especialidadId != null
        ? String(turno.especialidadId)
        : especialidadTurnoId != null
          ? String(especialidadTurnoId)
          : ''
    if (actual && !opciones.some((opcion) => opcion.value === actual)) {
      opciones.unshift({
        value: actual,
        label: especialidadNombre || 'Especialidad seleccionada',
      })
    }
    return opciones
  }, [especialidades, especialidadNombre, especialidadTurnoId, turno?.especialidadId])

  const opcionesClinica = useMemo(
    () =>
      clinicas.map((clinica) => ({
        value: String(clinica.id),
        label: clinica.nombre,
      })),
    [clinicas],
  )

  const especialidadSeleccionada = opcionesEspecialidad.find(
    (opcion) => opcion.value === especialidadId,
  )
  const clinicaSeleccionada = opcionesClinica.find((opcion) => opcion.value === clinicaId)
  const expedienteConfirmado = Boolean(turno?.numeroExpediente)
  const puedeAgendar = Boolean(fecha) && Boolean(clinicaId) && expedienteConfirmado && !agendando
  const infoFecha = dias.find((dia) => dia.fecha === fecha)

  async function manejarBusqueda(evento) {
    evento.preventDefault()
    const termino = busqueda.trim()
    if (!termino || buscando) return

    setBuscando(true)
    setError(null)
    try {
      setResultados(await onBuscarPacientes(termino))
    } catch (fallo) {
      setError(fallo?.message ?? 'No se pudo buscar el paciente.')
    } finally {
      setBuscando(false)
    }
  }

  function elegirPaciente(paciente) {
    setPacienteSugerido(paciente)
    setExpediente(paciente.numeroExpediente ?? '')
    setBusqueda('')
    setResultados([])
    setError(null)
  }

  async function asignarExpediente() {
    const numero = expediente.trim()
    if (!numero || procesandoExpediente || expedienteConfirmado) return

    setProcesandoExpediente(true)
    setError(null)
    try {
      await onAsignarExpediente(numero)
      setExpediente(numero)
    } catch (fallo) {
      setError(fallo?.message ?? 'No se pudo asignar el expediente.')
    } finally {
      setProcesandoExpediente(false)
    }
  }

  async function agendar() {
    if (!puedeAgendar) return
    setAgendando(true)
    setError(null)
    try {
      await onAgendar(fecha)
    } catch (fallo) {
      setError(fallo?.message ?? 'No se pudo agendar la próxima visita.')
    } finally {
      setAgendando(false)
    }
  }

  function navegar(delta) {
    setCursor((actual) =>
      vista === 'semana'
        ? new Date(actual.getFullYear(), actual.getMonth(), actual.getDate() + delta * 7)
        : new Date(actual.getFullYear(), actual.getMonth() + delta, 1),
    )
  }

  function irAlMesActual() {
    setVista('mes')
    setCursor(new Date())
  }

  if (!abierto || !turno) {
    return (
      <section className="h-fit rounded-2xl border border-outline-variant bg-surface-container-lowest p-3 shadow-card">
        <h2 className="text-headline-sm text-on-surface">Citar paciente</h2>
        <p className="mt-2 text-body-sm text-on-surface-variant">
          Seleccione un correlativo de la etapa Citar para abrir el formulario de próxima visita.
        </p>
      </section>
    )
  }

  return (
    <Dialog open={abierto} onClose={onCerrar} className="relative z-50">
      <div className="fixed inset-0 bg-on-surface/50 backdrop-blur-sm" aria-hidden="true" />

      <div className="fixed inset-0 overflow-y-auto p-3 sm:p-6">
        <div className="flex min-h-full items-start justify-center">
          <DialogPanel
            data-testid="panel-citar"
            className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-modal"
          >
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant px-5 py-3">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-container/20 text-primary">
                  <Icon name="event_upcoming" className="text-[24px]" />
                </span>
                <div>
                  <DialogTitle className="text-headline-sm text-on-surface">
                    Citar paciente
                  </DialogTitle>
                  <p className="text-body-sm text-on-surface-variant">
                    {turno.pacienteNombre ?? 'Paciente sin nombre registrado'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-primary-container/20 px-3 py-1.5 text-title-sm font-bold text-primary">
                  {etiquetaTurno(turno)}
                </span>
                <span className="rounded-lg bg-surface-container-high px-2 py-1 text-label-sm text-on-surface-variant">
                  {especialidadNombre ?? turno.especialidadNombre ?? 'Especialidad'}
                </span>
                <button
                  type="button"
                  onClick={onCerrar}
                  aria-label="Cerrar panel de cita"
                  className="rounded-lg p-1 text-on-surface-variant transition hover:bg-surface-container"
                >
                  <Icon name="close" className="text-[22px]" />
                </button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="space-y-3">
                  <section className="rounded-xl border border-outline-variant bg-surface-container-low p-3">
                    <p className="text-label-sm uppercase tracking-wider text-on-surface-variant">
                      Buscar paciente
                    </p>
                    <form onSubmit={manejarBusqueda} className="mt-1 flex gap-2">
                      <input
                        value={busqueda}
                        onChange={(evento) => setBusqueda(evento.target.value)}
                        placeholder="Buscar por nombre, DPI o expediente"
                        aria-label="Buscar paciente"
                        className="h-10 min-w-0 flex-1 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-body-sm text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                      <Button type="submit" size="sm" disabled={buscando}>
                        {buscando ? 'Buscando…' : 'Buscar'}
                      </Button>
                    </form>

                    {resultados.length > 0 && (
                      <ul className="mt-2 max-h-40 divide-y divide-outline-variant overflow-y-auto rounded-lg border border-outline-variant bg-surface-container-lowest">
                        {resultados.map((paciente) => (
                          <li key={paciente.id}>
                            <button
                              type="button"
                              onClick={() => elegirPaciente(paciente)}
                              className="w-full px-3 py-2 text-left transition hover:bg-surface-container-low"
                            >
                              <span className="block text-title-sm text-on-surface">
                                {paciente.nombres} {paciente.apellidos}
                              </span>
                              <span className="block text-label-sm text-on-surface-variant">
                                DPI {paciente.dpi} · {paciente.numeroExpediente}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}

                    {pacienteSugerido && (
                      <p className="mt-2 text-label-sm text-primary">
                        Paciente encontrado: {pacienteSugerido.nombres} {pacienteSugerido.apellidos}
                      </p>
                    )}
                  </section>

                  <section className="rounded-xl border border-outline-variant bg-surface-container-low p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-label-sm uppercase tracking-wider text-on-surface-variant">
                        Número de expediente
                      </p>
                      <span className="rounded-md bg-primary-container/20 px-2 py-1 text-label-sm font-semibold text-primary">
                        Correlativo {etiquetaTurno(turno)}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        value={expediente}
                        onChange={(evento) => {
                          setExpediente(evento.target.value)
                          setPacienteSugerido(null)
                          setError(null)
                        }}
                        disabled={expedienteConfirmado || procesandoExpediente}
                        placeholder="Expediente"
                        inputMode="numeric"
                        aria-label="Número de expediente"
                        className="h-10 min-w-0 flex-1 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-body-sm text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                      />
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={asignarExpediente}
                        disabled={
                          expedienteConfirmado || !expediente.trim() || procesandoExpediente
                        }
                      >
                        <Icon name="badge" className="text-[16px]" />
                        {expedienteConfirmado
                          ? 'Confirmado'
                          : procesandoExpediente
                            ? 'Asignando…'
                            : 'Asignar'}
                      </Button>
                    </div>
                    {!expedienteConfirmado && (
                      <p className="mt-1 text-label-sm text-on-surface-variant">
                        Asigne el expediente para habilitar el agendamiento.
                      </p>
                    )}
                  </section>

                  <Select
                    label="Especialidad"
                    ariaLabel="Especialidad"
                    value={especialidadId}
                    onChange={(valor) => {
                      setEspecialidadId(valor)
                      if (!turno.proximaVisita) setFecha('')
                      setError(null)
                    }}
                    options={opcionesEspecialidad}
                    placeholder="Seleccione una especialidad"
                  />
                </div>

                <aside className="space-y-3">
                  <Select
                    label="Clínica"
                    ariaLabel="Clínica"
                    value={clinicaId}
                    onChange={setClinicaId}
                    options={opcionesClinica}
                    placeholder="Seleccione una clínica"
                  />

                  <section className="rounded-xl border border-outline-variant bg-surface-container-low p-3">
                    <p className="text-label-sm uppercase tracking-wider text-on-surface-variant">
                      Próxima visita
                    </p>
                    <p className="mt-1 text-title-sm font-semibold text-on-surface">
                      {fecha ? formatearFechaLarga(fecha) : 'Seleccione una fecha en el calendario'}
                    </p>
                    {fecha && (
                      <p className="text-label-md font-semibold text-primary">
                        {textoRelativo(fecha)}
                      </p>
                    )}
                    <p className="mt-1 text-label-sm text-on-surface-variant">
                      {turno.proximaVisita
                        ? 'Fecha indicada por la interfaz médica.'
                        : 'Fecha seleccionada por Enfermería.'}
                    </p>
                    <p className="mt-1 text-label-sm text-on-surface">
                      {clinicaSeleccionada?.label ?? 'Clínica pendiente de seleccionar'}
                    </p>
                    {infoFecha && (
                      <p className="mt-1 text-label-sm text-on-surface-variant">
                        {infoFecha.cuposDisponibles ?? 0} cupos disponibles ese día
                      </p>
                    )}
                  </section>
                </aside>
              </div>

              <div className="mt-4">
                <CalendarioCuposCita
                  vista={vista}
                  cursor={cursor}
                  dias={dias}
                  fechaSeleccionada={fecha}
                  cargando={cargandoDias}
                  onCambiarVista={setVista}
                  onNavegar={navegar}
                  onMesActual={irAlMesActual}
                  onSeleccionar={(nuevaFecha) => {
                    setFecha(nuevaFecha)
                    setError(null)
                  }}
                />
              </div>

              {especialidadSeleccionada && (
                <p className="mt-3 text-label-sm text-on-surface-variant">
                  Mostrando días con atención de {especialidadSeleccionada.label}.
                </p>
              )}

              {error && (
                <p
                  role="alert"
                  className="mt-3 rounded-lg bg-error-container px-3 py-2 text-body-sm text-on-error-container"
                >
                  {error}
                </p>
              )}
            </div>

            <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant bg-surface-container-low px-5 py-3">
              <div className="text-label-sm text-on-surface-variant">
                {fecha ? (
                  <span>
                    Próxima visita:{' '}
                    <strong className="text-on-surface">{formatearFechaLarga(fecha)}</strong>
                    {clinicaSeleccionada ? ` · ${clinicaSeleccionada.label}` : ''}
                  </span>
                ) : (
                  'Seleccione una fecha y una clínica para agendar.'
                )}
              </div>
              <Button size="lg" onClick={agendar} disabled={!puedeAgendar} className="min-w-48">
                <Icon name="event_available" className="text-[20px]" />
                {agendando ? 'Agendando…' : 'Agendar'}
              </Button>
            </footer>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  )
}
