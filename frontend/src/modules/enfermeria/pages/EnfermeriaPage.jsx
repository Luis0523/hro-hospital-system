import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import { useToast } from '@/shared/context/ToastContext.jsx'
import { hoyIso, rangoDelMes } from '@/shared/utils/fecha'
import { reproducirBeep } from '@/shared/utils/sonido'
import {
  agendarCita,
  buscarCitaDelDia,
  buscarPacientes,
  cambiarEstadoTablero,
  consultarDisponibilidad,
  hacerCheckIn,
  listarClinicas,
  listarCuposDelDia,
  listarPacientes,
  listarTurnosActivos,
  listarTurnosClinica,
  llamarTurno,
  marcarAtendido,
  marcarNoResponde,
  obtenerEstadoTablero,
  pasarSiguiente as pasarSiguienteApi,
  reintegrarTurno,
} from '../api/enfermeriaApi'
import { pacientesMock } from '../api/mockData'
import TopHud from '../components/TopHud.jsx'
import ClinicFilter from '../components/ClinicFilter.jsx'
import CalendarioMensual from '../components/CalendarioMensual.jsx'
import ScannerDock from '../components/ScannerDock.jsx'
import ConfirmacionCita from '../components/ConfirmacionCita.jsx'
import ColaPanel from '../components/ColaPanel.jsx'
import AgendaPanel from '../components/AgendaPanel.jsx'
import PacientesTemporalModal from '../components/PacientesTemporalModal.jsx'
import MenuUsuario from '../components/MenuUsuario.jsx'

const SEGUNDOS_GRACIA = 180
const ESTADOS_EN_COLA = ['en_espera', 'llamado']

export default function EnfermeriaPage() {
  const { usuario, cerrarSesion } = useAuth()
  const { mostrarToast } = useToast()
  const navigate = useNavigate()

  const ahora = new Date()
  const scannerRef = useRef(null)

  const [mes, setMes] = useState(new Date(ahora.getFullYear(), ahora.getMonth(), 1))
  const [clinicas, setClinicas] = useState([])
  const [seleccionadas, setSeleccionadas] = useState([])
  const [dias, setDias] = useState([])
  const [seleccionada, setSeleccionada] = useState(hoyIso())
  const [tableroActivo, setTableroActivo] = useState(true)
  const [turnoActual, setTurnoActual] = useState(0)
  const [pacienteActual, setPacienteActual] = useState('')
  const [colaEnEspera, setColaEnEspera] = useState(0)
  const [turnos, setTurnos] = useState([])
  const [noRespondidos, setNoRespondidos] = useState([])
  const [cargandoId, setCargandoId] = useState(null)
  const [turnoEnGracia, setTurnoEnGracia] = useState(null)
  const [scanner, setScanner] = useState('')
  const [resultado, setResultado] = useState(null)
  const [turnoGenerado, setTurnoGenerado] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [pasando, setPasando] = useState(false)
  const [errorEscaneo, setErrorEscaneo] = useState(null)
  const [agendaAbierta, setAgendaAbierta] = useState(false)
  const [pacienteAgenda, setPacienteAgenda] = useState(null)
  const [cuposDelDia, setCuposDelDia] = useState([])
  const [cupoSeleccionado, setCupoSeleccionado] = useState(null)
  const [cargandoCupos, setCargandoCupos] = useState(false)
  const [agendando, setAgendando] = useState(false)
  const [citaCreada, setCitaCreada] = useState(null)
  const [errorAgenda, setErrorAgenda] = useState(null)
  const [sinCupo, setSinCupo] = useState(false)
  const [cargandoDias, setCargandoDias] = useState(false)
  const [pacientesAbierto, setPacientesAbierto] = useState(false)
  const [perfilAbierto, setPerfilAbierto] = useState(false)

  const clinicaActivaId = seleccionadas[0] ?? clinicas[0]?.id ?? null

  useEffect(() => {
    listarClinicas()
      .then(setClinicas)
      .catch(() => setClinicas([]))
    obtenerEstadoTablero()
      .then((estado) => setTableroActivo(estado.activo))
      .catch(() => {})
    listarTurnosActivos()
      .then((activos) => {
        setColaEnEspera(activos.length)
        const ultimo = activos.reduce((max, turno) => Math.max(max, turno.numeroTurno ?? 0), 0)
        setTurnoActual(ultimo)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const { fechaInicio, fechaFin } = rangoDelMes(mes.getFullYear(), mes.getMonth())
    setCargandoDias(true)
    consultarDisponibilidad({ clinicaIds: seleccionadas, fechaInicio, fechaFin })
      .then(setDias)
      .catch(() => setDias([]))
      .finally(() => setCargandoDias(false))
  }, [mes, seleccionadas])

  useEffect(() => {
    if (!agendaAbierta) return
    setCargandoCupos(true)
    listarCuposDelDia(seleccionada, seleccionadas)
      .then(setCuposDelDia)
      .catch(() => setCuposDelDia([]))
      .finally(() => setCargandoCupos(false))
  }, [agendaAbierta, seleccionada, seleccionadas])

  const refrescarCola = useCallback(async () => {
    if (!clinicaActivaId) return
    const lista = await listarTurnosClinica(clinicaActivaId)
    const enCola = lista.filter((turno) => ESTADOS_EN_COLA.includes(turno.estado))
    setTurnos(enCola)
    setNoRespondidos(lista.filter((turno) => turno.estado === 'no_responde'))
    setColaEnEspera(enCola.length)
  }, [clinicaActivaId])

  useEffect(() => {
    refrescarCola().catch(() => {})
  }, [refrescarCola])

  useEffect(() => {
    if (!turnoEnGracia?.id) return
    const intervalo = setInterval(() => {
      setTurnoEnGracia((actual) => {
        if (!actual) return actual
        return { ...actual, restante: Math.max(0, actual.restante - 1) }
      })
    }, 1000)
    return () => clearInterval(intervalo)
  }, [turnoEnGracia?.id])

  useEffect(() => {
    if (turnoEnGracia && turnoEnGracia.restante === 0) {
      mostrarToast({
        tone: 'warning',
        title: 'Tiempo de gracia agotado',
        message: 'Puede marcar al paciente como "No responde".',
      })
    }
  }, [turnoEnGracia, mostrarToast])

  const resumen = useMemo(() => {
    const disponibles = dias.reduce((total, dia) => total + (dia.cuposDisponibles ?? 0), 0)
    const capacidad = dias.reduce((total, dia) => total + (dia.capacidadMaxima ?? 0), 0)
    const ocupacion = capacidad > 0 ? Math.round(((capacidad - disponibles) / capacidad) * 100) : 0
    return { cuposMes: disponibles, ocupacion }
  }, [dias])

  function alternarClinica(id) {
    setSeleccionadas((actual) =>
      actual.includes(id) ? actual.filter((valor) => valor !== id) : [...actual, id],
    )
  }

  function activarGracia(turno) {
    if (turno?.id) setTurnoEnGracia({ id: turno.id, restante: SEGUNDOS_GRACIA })
  }

  function enfocarScanner() {
    scannerRef.current?.focus()
  }

  const escanear = useCallback(
    async (identificador) => {
      setErrorEscaneo(null)
      if (!identificador.trim()) return
      try {
        const encontrado = await buscarCitaDelDia(identificador)
        if (!encontrado) {
          mostrarToast({
            tone: 'error',
            title: 'Paciente no encontrado',
            message: 'Verifique el código de expediente escaneado.',
          })
          enfocarScanner()
          return
        }
        if (!encontrado.cita) {
          abrirAgenda(encontrado.paciente)
          mostrarToast({
            tone: 'info',
            title: 'Paciente sin cita hoy',
            message: 'Seleccione una fecha y un cupo para agendar.',
          })
          return
        }
        setResultado(encontrado)
      } catch (error) {
        mostrarToast({ tone: 'error', title: 'Error de búsqueda', message: error.message })
        enfocarScanner()
      }
    },
    [mostrarToast],
  )

  async function manejarSubmit(event) {
    event.preventDefault()
    const identificador = scanner
    setScanner('')
    await escanear(identificador)
  }

  async function simularScan() {
    const paciente = pacientesMock[0]
    setScanner(paciente.numeroExpediente)
    await escanear(paciente.numeroExpediente)
  }

  async function confirmarLlegada() {
    if (!resultado?.cita) return
    setEnviando(true)
    setErrorEscaneo(null)
    try {
      const turno = await hacerCheckIn(resultado.cita.id)
      setTurnoGenerado(turno)
      setTurnoActual(turno.numeroTurno)
      setPacienteActual(`${resultado.paciente.nombres} ${resultado.paciente.apellidos}`)
      await refrescarCola()
      mostrarToast({
        tone: 'success',
        title: `Turno #${String(turno.numeroTurno).padStart(3, '0')}`,
        message: `${resultado.cita.clinicaNombre} actualizada en el tablero.`,
      })
    } catch (error) {
      setErrorEscaneo(error.message)
    } finally {
      setEnviando(false)
    }
  }

  function cerrarConfirmacion() {
    setResultado(null)
    setTurnoGenerado(null)
    setErrorEscaneo(null)
    enfocarScanner()
  }

  async function alternarTablero() {
    const nuevo = !tableroActivo
    setTableroActivo(nuevo)
    try {
      await cambiarEstadoTablero(nuevo)
      mostrarToast({
        tone: nuevo ? 'success' : 'warning',
        title: 'Tablero de turnos',
        message: nuevo
          ? 'Pantalla pública conectada en tiempo real.'
          : 'La pantalla en sala no anunciará nuevos turnos.',
      })
    } catch (error) {
      setTableroActivo(!nuevo)
      mostrarToast({ tone: 'warning', title: 'Tablero', message: error.message })
    }
  }

  async function manejarPasarSiguiente() {
    setPasando(true)
    try {
      const llamado = await pasarSiguienteApi(clinicaActivaId)
      if (llamado?.numeroTurno) setTurnoActual(llamado.numeroTurno)
      if (llamado?.pacienteNombre) setPacienteActual(llamado.pacienteNombre)
      activarGracia(llamado)
      reproducirBeep()
      await refrescarCola()
      mostrarToast({
        tone: 'info',
        title: `Turno #${String(llamado?.numeroTurno ?? '').padStart(3, '0')}`,
        message: 'Llamando al siguiente paciente.',
      })
    } catch (error) {
      mostrarToast({ tone: 'error', title: 'No se pudo avanzar', message: error.message })
    } finally {
      setPasando(false)
    }
  }

  async function ejecutarAccionTurno(turno, accion, mensajeExito) {
    setCargandoId(turno.id)
    try {
      const actualizado = await accion()
      if (turnoEnGracia?.id === turno.id && actualizado?.estado !== 'llamado') {
        setTurnoEnGracia(null)
      }
      await refrescarCola()
      mostrarToast({
        tone: 'success',
        title: `Turno #${String(turno.numeroTurno).padStart(3, '0')}`,
        message: mensajeExito,
      })
    } catch (error) {
      mostrarToast({ tone: 'error', title: 'No se pudo actualizar', message: error.message })
    } finally {
      setCargandoId(null)
    }
  }

  function manejarLlamar(turno) {
    return ejecutarAccionTurno(
      turno,
      async () => {
        const llamado = await llamarTurno(turno.id)
        activarGracia(llamado)
        reproducirBeep()
        setTurnoActual(llamado.numeroTurno)
        setPacienteActual(llamado.pacienteNombre ?? '')
        return llamado
      },
      'Paciente llamado al consultorio.',
    )
  }

  function manejarAtendido(turno) {
    return ejecutarAccionTurno(
      turno,
      () => marcarAtendido(turno.id),
      'Consulta finalizada; cita marcada como atendida.',
    )
  }

  function manejarNoResponde(turno) {
    return ejecutarAccionTurno(
      turno,
      () => marcarNoResponde(turno.id, 'Paciente no se presentó tras el tiempo de gracia'),
      'Paciente marcado como no responde; la fila continúa.',
    )
  }

  function manejarReintegrar(turno) {
    return ejecutarAccionTurno(
      turno,
      () => reintegrarTurno(turno.id, 'Paciente regresó el mismo día'),
      'Paciente reintegrado al final de la fila.',
    )
  }

  function abrirPacientes() {
    setPacientesAbierto(true)
  }

  function seleccionarPacienteTemporal(paciente) {
    setPacientesAbierto(false)
    abrirAgenda(paciente)
  }

  function confirmarCierreSesion() {
    setPerfilAbierto(false)
    cerrarSesion()
    mostrarToast({ tone: 'info', title: 'Sesión cerrada', message: 'Puede volver a ingresar.' })
    navigate('/sesion-cerrada')
  }

  function abrirAgenda(paciente = null) {
    if (paciente) setPacienteAgenda(paciente)
    setCitaCreada(null)
    setErrorAgenda(null)
    setSinCupo(false)
    setAgendaAbierta(true)
  }

  function cerrarAgenda() {
    setAgendaAbierta(false)
    setPacienteAgenda(null)
    setCupoSeleccionado(null)
    setCuposDelDia([])
    setCitaCreada(null)
    setErrorAgenda(null)
  }

  function seleccionarDia(info) {
    setSeleccionada(info.fecha)
    setCupoSeleccionado(null)
    setCitaCreada(null)
    setErrorAgenda(null)
    setSinCupo(false)
    setAgendaAbierta(true)
  }

  async function confirmarAgenda() {
    if (!pacienteAgenda || !cupoSeleccionado) return
    setAgendando(true)
    setErrorAgenda(null)
    setSinCupo(false)
    try {
      const cita = await agendarCita({
        pacienteId: pacienteAgenda.id,
        cupo: cupoSeleccionado,
      })
      setCitaCreada(cita)
      setCupoSeleccionado(null)
      mostrarToast({
        tone: 'success',
        title: 'Cita agendada',
        message: `${cita.fechaCita} • ${cita.horaEstimada?.slice(0, 5)}`,
      })
    } catch (error) {
      setSinCupo(error.status === 409)
      setErrorAgenda(error.message)
      mostrarToast({ tone: 'error', title: 'No se pudo agendar', message: error.message })
    } finally {
      setAgendando(false)
      listarCuposDelDia(seleccionada, seleccionadas)
        .then(setCuposDelDia)
        .catch(() => {})
    }
  }

  const pasarSiguienteRef = useRef(() => {})
  pasarSiguienteRef.current = manejarPasarSiguiente
  const cerrarConfirmacionRef = useRef(() => {})
  cerrarConfirmacionRef.current = cerrarConfirmacion

  useEffect(() => {
    function manejarAtajos(event) {
      if (event.altKey && event.key.toLowerCase() === 's') {
        event.preventDefault()
        enfocarScanner()
      }
      if (event.altKey && event.key.toLowerCase() === 'n') {
        event.preventDefault()
        pasarSiguienteRef.current()
      }
      if (event.key === 'Escape') {
        cerrarConfirmacionRef.current()
      }
    }
    window.addEventListener('keydown', manejarAtajos)
    return () => window.removeEventListener('keydown', manejarAtajos)
  }, [])

  return (
    <div className="min-h-screen bg-surface pb-28">
      <TopHud
        usuario={usuario}
        terminal={usuario?.terminal}
        turnoActual={turnoActual}
        pacienteActual={pacienteActual}
        tableroActivo={tableroActivo}
        onToggleTablero={alternarTablero}
        onPasarSiguiente={manejarPasarSiguiente}
        onVerPacientes={abrirPacientes}
        onAbrirPerfil={() => setPerfilAbierto(true)}
        pasandoSiguiente={pasando}
      />

      <div className="grid grid-cols-1 items-start gap-4 px-4 py-3 lg:grid-cols-12">
        <div className="flex flex-col gap-3 lg:col-span-3">
          <ClinicFilter
            clinicas={clinicas}
            seleccionadas={seleccionadas}
            onToggle={alternarClinica}
            onTodas={() => setSeleccionadas([])}
            resumen={resumen}
            colaEnEspera={colaEnEspera}
            promedioMin={6}
          />
          <ColaPanel
            turnos={turnos}
            noRespondidos={noRespondidos}
            turnoEnGraciaId={turnoEnGracia?.id}
            segundosRestantes={turnoEnGracia?.restante ?? 0}
            cargandoId={cargandoId}
            onLlamar={manejarLlamar}
            onAtendido={manejarAtendido}
            onNoResponde={manejarNoResponde}
            onReintegrar={manejarReintegrar}
          />
        </div>
        <div className="lg:col-span-9">
          <CalendarioMensual
            mes={mes}
            dias={dias}
            cargando={cargandoDias}
            seleccionada={seleccionada}
            onSeleccionar={seleccionarDia}
            onCambiarMes={(delta) =>
              setMes((actual) => new Date(actual.getFullYear(), actual.getMonth() + delta, 1))
            }
            onHoy={() => {
              setMes(new Date(ahora.getFullYear(), ahora.getMonth(), 1))
              setSeleccionada(hoyIso())
            }}
          />
        </div>
      </div>

      {resultado && (
        <ConfirmacionCita
          resultado={resultado}
          turno={turnoGenerado}
          enviando={enviando}
          error={errorEscaneo}
          onConfirmar={confirmarLlegada}
          onCancelar={cerrarConfirmacion}
        />
      )}

      <AgendaPanel
        abierto={agendaAbierta}
        fecha={seleccionada}
        cupos={cuposDelDia}
        cargandoCupos={cargandoCupos}
        cupoSeleccionado={cupoSeleccionado}
        onSeleccionarCupo={setCupoSeleccionado}
        paciente={pacienteAgenda}
        onQuitarPaciente={() => setPacienteAgenda(null)}
        onSeleccionarPaciente={setPacienteAgenda}
        onBuscarPacientes={buscarPacientes}
        citaCreada={citaCreada}
        agendando={agendando}
        sinCupo={sinCupo}
        error={errorAgenda}
        onAgendar={confirmarAgenda}
        onCerrar={cerrarAgenda}
      />

      <PacientesTemporalModal
        abierto={pacientesAbierto}
        onCerrar={() => setPacientesAbierto(false)}
        onCargarPacientes={listarPacientes}
        onSeleccionarPaciente={seleccionarPacienteTemporal}
      />

      <MenuUsuario
        abierto={perfilAbierto}
        onCerrar={() => setPerfilAbierto(false)}
        usuario={usuario}
        terminal={usuario?.terminal}
        onCerrarSesion={confirmarCierreSesion}
      />

      <ScannerDock
        value={scanner}
        onChange={setScanner}
        onSubmit={manejarSubmit}
        onSimular={simularScan}
        inputRef={scannerRef}
      />
    </div>
  )
}
