import { useEffect, useMemo, useRef, useState } from 'react'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { Button, Icon, Modal, Select } from '@/shared/components/ui'
import { buscarPacientePorExpediente } from '@/modules/libroCitas/api/libroCitasApi'
import {
  buscarPacientes,
  consultarDisponibilidad,
  listarEspecialidadesEstacion,
  listarSubespecialidadesDeEspecialidad,
  listarSubespecialidadesEstacion,
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

function nombrePaciente(paciente) {
  if (!paciente) return ''
  const completo = [paciente.nombres, paciente.apellidos].filter(Boolean).join(' ').trim()
  return completo || paciente.nombreCompleto || paciente.pacienteNombre || ''
}

function pacienteDesdeHro(paciente) {
  return {
    id: `hro-${paciente.numeroExpediente}`,
    nombres: paciente.nombre,
    apellidos: '',
    numeroExpediente: paciente.numeroExpediente,
    dpi: null,
    externo: true,
  }
}

export default function PanelCitar({
  abierto,
  turno,
  estacionId = null,
  especialidadNombre,
  especialidadTurnoId = null,
  especialidades = [],
  clinicas = [],
  onCerrar,
  onAsignarExpediente,
  onAgendar,
  onBuscarPacientes = buscarPacientes,
  onBuscarExpediente = buscarPacientePorExpediente,
}) {
  const [busqueda, setBusqueda] = useState('')
  const [resultados, setResultados] = useState([])
  const [buscando, setBuscando] = useState(false)
  const [pacienteSugerido, setPacienteSugerido] = useState(null)
  const [expediente, setExpediente] = useState('')
  const [especialidadId, setEspecialidadId] = useState('')
  const [especialidadesEstacion, setEspecialidadesEstacion] = useState(null)
  const [manualAbierto, setManualAbierto] = useState(false)
  const [formManual, setFormManual] = useState({ numeroExpediente: '', pacienteNombre: '' })
  const [guardandoManual, setGuardandoManual] = useState(false)
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
    setManualAbierto(false)
    setFormManual({ numeroExpediente: '', pacienteNombre: '' })
    setEspecialidadId(especialidadActual)
    setVista('mes')
    setCursor(proxima ? mesDe(proxima) : new Date())
    setBusqueda('')
    setResultados([])
    setError(null)
  }, [abierto, turno, especialidadTurnoId, especialidades])

  // Especialidades con atención en la estación seleccionada.
  useEffect(() => {
    if (!abierto || estacionId == null) {
      setEspecialidadesEstacion(null)
      return undefined
    }

    let activo = true
    listarEspecialidadesEstacion(estacionId)
      .then((lista) => {
        if (activo) setEspecialidadesEstacion(Array.isArray(lista) && lista.length ? lista : null)
      })
      .catch(() => {
        if (activo) setEspecialidadesEstacion(null)
      })

    return () => {
      activo = false
    }
  }, [abierto, estacionId])

  // Subespecialidades de la estación que pertenecen a la especialidad elegida.
  useEffect(() => {
    if (!abierto || !especialidadId) {
      setSubespecialidadIds([])
      setCatalogoListo(false)
      return undefined
    }

    let activo = true
    setCatalogoListo(false)

    async function cargarSubespecialidades() {
      let lista = []
      if (estacionId != null) {
        const estacion = await listarSubespecialidadesEstacion(estacionId).catch(() => [])
        lista = (Array.isArray(estacion) ? estacion : []).filter(
          (subespecialidad) =>
            subespecialidad?.especialidadId != null &&
            String(subespecialidad.especialidadId) === String(especialidadId),
        )
      }
      if (lista.length === 0) {
        lista = await listarSubespecialidadesDeEspecialidad(especialidadId).catch(() => [])
      }
      if (!activo) return
      setSubespecialidadIds(
        (Array.isArray(lista) ? lista : [])
          .map((subespecialidad) => subespecialidad?.id)
          .filter((id) => id != null),
      )
    }

    cargarSubespecialidades().finally(() => {
      if (activo) setCatalogoListo(true)
    })

    return () => {
      activo = false
    }
  }, [abierto, estacionId, especialidadId])

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

  const listaEspecialidades = especialidadesEstacion ?? especialidades

  const opcionesEspecialidad = useMemo(() => {
    const opciones = listaEspecialidades.map((especialidad) => ({
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
  }, [listaEspecialidades, especialidadNombre, especialidadTurnoId, turno?.especialidadId])

  const especialidadSeleccionada = opcionesEspecialidad.find(
    (opcion) => opcion.value === especialidadId,
  )
  const clinicaDelTurno =
    turno?.clinicaNombre ??
    clinicas.find((clinica) => String(clinica.id) === String(turno?.clinicaId))?.nombre ??
    null
  const expedienteConfirmado = Boolean(turno?.numeroExpediente)
  const pacienteConsultado = pacienteSugerido ?? (
    turno?.numeroExpediente || turno?.pacienteNombre
      ? {
          nombres: turno?.pacienteNombre ?? '',
          numeroExpediente: turno?.numeroExpediente ?? '',
          dpi: null,
        }
      : null
  )
  const puedeAgendar = Boolean(fecha) && expedienteConfirmado && !agendando
  const motivoBloqueo = !expedienteConfirmado
    ? 'Asigne o registre manualmente el expediente para habilitar el agendamiento.'
    : !fecha
      ? 'Seleccione una fecha con cupos en el calendario.'
      : null
  const infoFecha = dias.find((dia) => dia.fecha === fecha)

  async function manejarBusqueda(evento) {
    evento.preventDefault()
    const termino = busqueda.trim()
    if (!termino || buscando) return

    setBuscando(true)
    setError(null)
    try {
      let lista = await onBuscarPacientes(termino)
      lista = Array.isArray(lista) ? lista : []
      const pareceExpediente = /^\d+$/.test(termino)
      if (lista.length === 0 || pareceExpediente) {
        const externo = await onBuscarExpediente(termino).catch(() => null)
        if (
          externo &&
          !lista.some(
            (paciente) =>
              String(paciente.numeroExpediente ?? '') === String(externo.numeroExpediente),
          )
        ) {
          lista = [pacienteDesdeHro(externo), ...lista]
        }
      }
      setResultados(lista)
      if (lista.length === 0) {
        setError('No se encontró un paciente con ese nombre, DPI o expediente.')
      }
    } catch (fallo) {
      setResultados([])
      setError(fallo?.message ?? 'No se pudo buscar el paciente.')
    } finally {
      setBuscando(false)
    }
  }

  async function elegirPaciente(paciente) {
    setPacienteSugerido(paciente)
    const numero = paciente.numeroExpediente ?? ''
    setExpediente(numero)
    setBusqueda('')
    setResultados([])
    setError(null)
    if (numero && !expedienteConfirmado) {
      await asignarExpediente(numero)
    }
  }

  function abrirManual() {
    setFormManual({
      numeroExpediente: expediente || busqueda.trim(),
      pacienteNombre: nombrePaciente(pacienteSugerido),
    })
    setManualAbierto(true)
  }

  async function registrarManual(evento) {
    evento.preventDefault()
    if (guardandoManual) return
    const numero = formManual.numeroExpediente.trim()
    const nombre = formManual.pacienteNombre.trim()
    if (!numero || !nombre) {
      setError('Ingrese el número de expediente y el nombre completo.')
      return
    }

    setGuardandoManual(true)
    setError(null)
    try {
      await onAsignarExpediente(numero, nombre)
      setExpediente(numero)
      setPacienteSugerido({ nombres: nombre, numeroExpediente: numero, dpi: null, manual: true })
      setManualAbierto(false)
      setFormManual({ numeroExpediente: '', pacienteNombre: '' })
      setBusqueda('')
      setResultados([])
    } catch (fallo) {
      setError(fallo?.message ?? 'No se pudo registrar el expediente manualmente.')
    } finally {
      setGuardandoManual(false)
    }
  }

  async function asignarExpediente(numeroParam = expediente) {
    const numero = String(numeroParam ?? '').trim()
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
    <>
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
                    {nombrePaciente(pacienteConsultado) || 'Paciente sin nombre registrado'}
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
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-label-sm uppercase tracking-wider text-on-surface-variant">
                        Buscar paciente
                      </p>
                      <Button variant="secondary" size="sm" onClick={abrirManual}>
                        <Icon name="edit_note" className="text-[16px]" />
                        Registro manual
                      </Button>
                    </div>
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
                  </section>

                  <section className="rounded-xl border border-outline-variant bg-surface-container-low p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-label-sm uppercase tracking-wider text-on-surface-variant">
                        Expediente consultado
                      </p>
                      <span className="rounded-md bg-primary-container/20 px-2 py-1 text-label-sm font-semibold text-primary">
                        Correlativo {etiquetaTurno(turno)}
                      </span>
                    </div>

                    {pacienteConsultado ? (
                      <div className="mt-2 space-y-1">
                        <h2 className="text-title-lg font-bold tracking-tight text-on-surface">
                          {nombrePaciente(pacienteConsultado) || 'Paciente sin nombre registrado'}
                        </h2>
                        {pacienteConsultado.dpi && (
                          <h3 className="text-body-sm font-medium text-on-surface-variant">
                            DPI {pacienteConsultado.dpi}
                          </h3>
                        )}
                        <h3 className="text-body-sm font-semibold text-on-surface">
                          Expediente {pacienteConsultado.numeroExpediente || 'sin número'}
                        </h3>

                        {expedienteConfirmado ? (
                          <p className="flex items-center gap-1 text-label-sm font-semibold text-primary">
                            <Icon name="verified" className="text-[16px]" />
                            Expediente vinculado al turno.
                          </p>
                        ) : (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={asignarExpediente}
                            disabled={!expediente.trim() || procesandoExpediente}
                          >
                            <Icon name="badge" className="text-[16px]" />
                            {procesandoExpediente ? 'Asignando…' : 'Asignar expediente'}
                          </Button>
                        )}
                      </div>
                    ) : (
                      <p className="mt-2 text-body-sm text-on-surface-variant">
                        Busque al paciente por nombre, DPI o expediente para consultar sus datos, o
                        use “Registro manual” si el expediente no aparece.
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
                  <section className="rounded-xl border border-outline-variant bg-surface-container-low p-3">
                    <p className="text-label-sm uppercase tracking-wider text-on-surface-variant">
                      Clínica
                    </p>
                    <h2 className="mt-1 text-title-lg font-bold tracking-tight text-on-surface">
                      {clinicaDelTurno ?? 'Sin clínica'}
                    </h2>
                    <p className="mt-1 text-label-sm text-on-surface-variant">
                      {clinicaDelTurno
                        ? 'Asignada desde la vista del doctor.'
                        : 'Aún no tiene una clínica asignada.'}
                    </p>
                  </section>
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
                      {clinicaDelTurno ?? 'Sin clínica'}
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
                    {clinicaDelTurno ? ` · ${clinicaDelTurno}` : ''}
                    {motivoBloqueo && (
                      <span className="mt-0.5 block text-label-sm text-error">{motivoBloqueo}</span>
                    )}
                  </span>
                ) : (
                  (motivoBloqueo ?? 'Seleccione una fecha para agendar.')
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

      <Modal
        open={manualAbierto}
        onClose={() => {
          if (!guardandoManual) setManualAbierto(false)
        }}
        title="Registro manual de expediente"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setManualAbierto(false)}
              disabled={guardandoManual}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => document.getElementById('form-cita-manual')?.requestSubmit()}
              disabled={guardandoManual}
            >
              {guardandoManual ? 'Guardando…' : 'Registrar'}
            </Button>
          </>
        }
      >
        <p>
          Úselo cuando el expediente físico no coincida con el paciente del HRO. El nombre se
          guarda solo para este turno y su cita.
        </p>
        <form id="form-cita-manual" onSubmit={registrarManual} className="mt-3 space-y-3">
          <label className="flex flex-col gap-1">
            <span className="text-label-sm uppercase tracking-wide text-on-surface-variant">
              Número de expediente
            </span>
            <input
              value={formManual.numeroExpediente}
              onChange={(evento) =>
                setFormManual((actual) => ({
                  ...actual,
                  numeroExpediente: evento.target.value,
                }))
              }
              inputMode="numeric"
              autoComplete="off"
              required
              className="h-11 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-body-md text-on-surface outline-none focus:border-primary"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-label-sm uppercase tracking-wide text-on-surface-variant">
              Nombre completo
            </span>
            <input
              value={formManual.pacienteNombre}
              onChange={(evento) =>
                setFormManual((actual) => ({ ...actual, pacienteNombre: evento.target.value }))
              }
              autoComplete="off"
              required
              className="h-11 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-body-md text-on-surface outline-none focus:border-primary"
            />
          </label>
          <p className="text-label-sm text-on-surface-variant">
            Turno: <strong>{etiquetaTurno(turno)}</strong>
            {especialidadSeleccionada ? ` · ${especialidadSeleccionada.label}` : ''}
          </p>
        </form>
      </Modal>
    </>
  )
}
