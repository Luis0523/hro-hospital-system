import { useCallback, useEffect, useRef, useState } from 'react'
import Spinner from '@/shared/components/ui/Spinner.jsx'
import {
  estaEnModoMock,
  estaPermitida,
  fusionarAsignacion,
  obtenerEstadoInicialTablero,
} from '../api/tableroApi'
import { crearClienteTablero } from '../api/tableroSocket'
import { anunciarTurno, estaDisponibleVoz, FRASE_ACTIVACION, hablar } from '../api/comunicacionVoz'
import ControlPantallaCompleta from '../components/ControlPantallaCompleta.jsx'
import ControlVoz from '../components/ControlVoz.jsx'
import EncabezadoTablero from '../components/EncabezadoTablero.jsx'
import EstadoConexion from '../components/EstadoConexion.jsx'
import LlamadoGrande from '../components/LlamadoGrande.jsx'
import TablaTurnos from '../components/TablaTurnos.jsx'
import TableroError from '../components/TableroError.jsx'
import TableroVacio from '../components/TableroVacio.jsx'

export const DURACION_LLAMADO_SIN_VOZ_MS = 6000

export function resolverDuracionLlamadoMs(env = import.meta.env) {
  const valor = Number(env.VITE_TABLERO_LLAMADO_MS)
  return Number.isFinite(valor) && valor > 0 ? valor : DURACION_LLAMADO_SIN_VOZ_MS
}

function estimarDuracionVozMs(mensaje, baseMs) {
  if (!mensaje) return baseMs
  return Math.max(baseMs, Math.min(30000, 2000 + mensaje.length * 80))
}

export default function TableroPage() {
  const [asignaciones, setAsignaciones] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [estadoConexion, setEstadoConexion] = useState(() =>
    estaEnModoMock() ? 'mock' : 'reconectando',
  )
  const [vozDisponible] = useState(() => estaDisponibleVoz())
  const [vozActiva, setVozActiva] = useState(false)
  const [vista, setVista] = useState('tabla')
  const [llamadoActual, setLlamadoActual] = useState(null)

  const montadoRef = useRef(true)
  const vozActivaRef = useRef(false)
  const ultimosTurnosRef = useRef(new Map())
  const colaLlamadosRef = useRef([])
  const reproduciendoRef = useRef(false)
  const timerLlamadoRef = useRef(null)
  const generacionLlamadoRef = useRef(0)
  const iniciarSiguienteRef = useRef(() => {})

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const estado = await obtenerEstadoInicialTablero()
      if (montadoRef.current) {
        setAsignaciones(estado)
        ultimosTurnosRef.current = new Map(
          estado.map((asignacion) => [
            asignacion.asignacionDiariaEspacioId,
            asignacion.turnoActual,
          ]),
        )
      }
    } catch (err) {
      if (montadoRef.current) {
        setError(err?.message ?? 'Ocurrió un error al obtener el estado inicial.')
        setAsignaciones([])
      }
    } finally {
      if (montadoRef.current) setCargando(false)
    }
  }, [])

  const limpiarTimerLlamado = useCallback(() => {
    if (timerLlamadoRef.current !== null) {
      clearTimeout(timerLlamadoRef.current)
      timerLlamadoRef.current = null
    }
  }, [])

  useEffect(() => {
    montadoRef.current = true
    cargar()
    return () => {
      montadoRef.current = false
      if (timerLlamadoRef.current !== null) {
        clearTimeout(timerLlamadoRef.current)
        timerLlamadoRef.current = null
      }
      colaLlamadosRef.current = []
      reproduciendoRef.current = false
    }
  }, [cargar])

  const activarVoz = useCallback(() => {
    ultimosTurnosRef.current = new Map(
      asignaciones.map((asignacion) => [
        asignacion.asignacionDiariaEspacioId,
        asignacion.turnoActual,
      ]),
    )
    vozActivaRef.current = true
    setVozActiva(true)
    hablar(FRASE_ACTIVACION)
  }, [asignaciones])

  const avanzar = useCallback(() => {
    if (!montadoRef.current) return
    limpiarTimerLlamado()
    reproduciendoRef.current = false
    iniciarSiguienteRef.current()
  }, [limpiarTimerLlamado])

  const iniciarSiguiente = useCallback(() => {
    if (!montadoRef.current) return

    limpiarTimerLlamado()
    const generacion = ++generacionLlamadoRef.current

    const cola = colaLlamadosRef.current
    if (cola.length === 0) {
      reproduciendoRef.current = false
      setLlamadoActual(null)
      setVista('tabla')
      return
    }

    const siguiente = cola.shift()
    reproduciendoRef.current = true
    setLlamadoActual(siguiente)
    setVista('llamado')

    const terminar = () => {
      if (!montadoRef.current) return
      if (generacionLlamadoRef.current !== generacion) return
      avanzar()
    }

    const baseMs = resolverDuracionLlamadoMs()

    if (vozActivaRef.current && estaDisponibleVoz()) {
      const mensaje = anunciarTurno(siguiente, { onEnd: terminar, onError: terminar })
      if (mensaje) {
        timerLlamadoRef.current = setTimeout(terminar, estimarDuracionVozMs(mensaje, baseMs))
        return
      }
    }

    timerLlamadoRef.current = setTimeout(terminar, baseMs)
  }, [limpiarTimerLlamado, avanzar])

  iniciarSiguienteRef.current = iniciarSiguiente

  const encolarLlamado = useCallback((asignacion) => {
    colaLlamadosRef.current.push(asignacion)
    if (!reproduciendoRef.current) {
      iniciarSiguienteRef.current()
    }
  }, [])

  useEffect(() => {
    if (estaEnModoMock()) return undefined

    const cliente = crearClienteTablero({
      onMensaje: (estado) => {
        if (!montadoRef.current) return
        const idAsignacion = estado.asignacionDiariaEspacioId
        if (!estaPermitida(idAsignacion)) return

        setError(null)

        const conocidos = ultimosTurnosRef.current
        const esConocida = conocidos.has(idAsignacion)
        const turnoAnterior = conocidos.get(idAsignacion)
        const cambioTurno =
          esConocida && estado.turnoActual !== null && estado.turnoActual !== turnoAnterior
        conocidos.set(idAsignacion, estado.turnoActual)

        setAsignaciones((actuales) => fusionarAsignacion(actuales, estado))

        if (cambioTurno) {
          encolarLlamado(estado)
        }
      },
      onConnected: () => {
        if (montadoRef.current) setEstadoConexion('conectado')
      },
      onDisconnected: () => {
        if (!montadoRef.current) return
        setEstadoConexion((anterior) =>
          anterior === 'conectado' ? 'reconectando' : 'desconectado',
        )
      },
      onError: () => {
        if (!montadoRef.current) return
        setEstadoConexion((anterior) =>
          anterior === 'conectado' ? 'reconectando' : 'desconectado',
        )
      },
    })

    cliente.activar()

    return () => {
      cliente.desactivar()
    }
  }, [encolarLlamado])

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <EncabezadoTablero>
        <ControlPantallaCompleta />
        <ControlVoz disponible={vozDisponible} activa={vozActiva} onActivar={activarVoz} />
        <EstadoConexion estado={estadoConexion} />
      </EncabezadoTablero>

      <main className="flex flex-1 flex-col gap-6 px-6 py-4 2xl:py-6">
        {cargando && (
          <div className="flex flex-1 items-center justify-center">
            <Spinner label="Cargando turnos…" />
          </div>
        )}

        {!cargando && error && <TableroError mensaje={error} onReintentar={cargar} />}

        {!cargando && !error && vista === 'llamado' && llamadoActual && (
          <LlamadoGrande asignacion={llamadoActual} />
        )}

        {!cargando && !error && vista === 'tabla' && asignaciones.length === 0 && <TableroVacio />}

        {!cargando && !error && vista === 'tabla' && asignaciones.length > 0 && (
          <TablaTurnos asignaciones={asignaciones} />
        )}
      </main>
    </div>
  )
}
