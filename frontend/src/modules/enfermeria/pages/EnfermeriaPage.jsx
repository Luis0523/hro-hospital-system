import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import { useToast } from '@/shared/context/ToastContext.jsx'
import { hoyIso, rangoDelMes } from '@/shared/utils/fecha'
import {
  buscarCitaDelDia,
  cambiarEstadoTablero,
  consultarDisponibilidad,
  hacerCheckIn,
  listarClinicas,
  listarTurnosActivos,
  obtenerEstadoTablero,
  pasarSiguiente as pasarSiguienteApi,
} from '../api/enfermeriaApi'
import { pacientesMock } from '../api/mockData'
import TopHud from '../components/TopHud.jsx'
import ClinicFilter from '../components/ClinicFilter.jsx'
import CalendarioMensual from '../components/CalendarioMensual.jsx'
import ScannerDock from '../components/ScannerDock.jsx'
import ConfirmacionCita from '../components/ConfirmacionCita.jsx'

export default function EnfermeriaPage() {
  const { usuario, usuarioId } = useAuth()
  const { mostrarToast } = useToast()

  const ahora = new Date()
  const [mes, setMes] = useState(new Date(ahora.getFullYear(), ahora.getMonth(), 1))
  const [clinicas, setClinicas] = useState([])
  const [seleccionadas, setSeleccionadas] = useState([])
  const [dias, setDias] = useState([])
  const [seleccionada, setSeleccionada] = useState(hoyIso())
  const [tableroActivo, setTableroActivo] = useState(true)
  const [turnoActual, setTurnoActual] = useState(0)
  const [pacienteActual, setPacienteActual] = useState('')
  const [colaEnEspera, setColaEnEspera] = useState(0)
  const [scanner, setScanner] = useState('')
  const [resultado, setResultado] = useState(null)
  const [turnoGenerado, setTurnoGenerado] = useState(null)
  const [enviando, setEnviando] = useState(false)
  const [pasando, setPasando] = useState(false)
  const [errorEscaneo, setErrorEscaneo] = useState(null)

  useEffect(() => {
    listarClinicas()
      .then(setClinicas)
      .catch(() => setClinicas([]))
    obtenerEstadoTablero()
      .then((estado) => setTableroActivo(estado.activo))
      .catch(() => {})
    listarTurnosActivos()
      .then((turnos) => {
        setColaEnEspera(turnos.length)
        const ultimo = turnos.reduce((max, turno) => Math.max(max, turno.numeroTurno ?? 0), 0)
        setTurnoActual(ultimo)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const { fechaInicio, fechaFin } = rangoDelMes(mes.getFullYear(), mes.getMonth())
    consultarDisponibilidad({ clinicaIds: seleccionadas, fechaInicio, fechaFin })
      .then(setDias)
      .catch(() => setDias([]))
  }, [mes, seleccionadas])

  const resumen = useMemo(() => {
    const disponibles = dias.reduce((total, dia) => total + (dia.cuposDisponibles ?? 0), 0)
    const capacidad = dias.reduce((total, dia) => total + (dia.capacidadMaxima ?? 0), 0)
    const ocupacion = capacidad > 0 ? Math.round(((capacidad - disponibles) / capacidad) * 100) : 0
    return { cuposMes: disponibles, ocupacion }
  }, [dias])

  const clinicaActivaId = seleccionadas[0] ?? clinicas[0]?.id ?? null

  function alternarClinica(id) {
    setSeleccionadas((actual) =>
      actual.includes(id) ? actual.filter((valor) => valor !== id) : [...actual, id],
    )
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
            message: 'Verifique el DPI o carné escaneado.',
          })
          return
        }
        setResultado(encontrado)
      } catch (error) {
        mostrarToast({ tone: 'error', title: 'Error de búsqueda', message: error.message })
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
    setScanner(paciente.dpi)
    await escanear(paciente.dpi)
  }

  async function confirmarLlegada() {
    if (!resultado?.cita) return
    setEnviando(true)
    setErrorEscaneo(null)
    try {
      const turno = await hacerCheckIn(resultado.cita.id, usuarioId)
      setTurnoGenerado(turno)
      setTurnoActual(turno.numeroTurno)
      setPacienteActual(`${resultado.paciente.nombres} ${resultado.paciente.apellidos}`)
      setColaEnEspera((total) => total + 1)
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
      const llamado = await pasarSiguienteApi(clinicaActivaId, usuarioId)
      if (llamado?.numeroTurno) setTurnoActual(llamado.numeroTurno)
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
        pasandoSiguiente={pasando}
      />

      <div className="grid grid-cols-1 items-start gap-4 px-4 py-3 lg:grid-cols-12">
        <div className="lg:col-span-3">
          <ClinicFilter
            clinicas={clinicas}
            seleccionadas={seleccionadas}
            onToggle={alternarClinica}
            onTodas={() => setSeleccionadas([])}
            resumen={resumen}
            colaEnEspera={colaEnEspera}
            promedioMin={6}
          />
        </div>
        <div className="lg:col-span-9">
          <CalendarioMensual
            mes={mes}
            dias={dias}
            seleccionada={seleccionada}
            onSeleccionar={(info) => setSeleccionada(info.fecha)}
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

      <ScannerDock
        value={scanner}
        onChange={setScanner}
        onSubmit={manejarSubmit}
        onSimular={simularScan}
      />
    </div>
  )
}
