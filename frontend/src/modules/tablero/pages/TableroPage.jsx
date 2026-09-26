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
import ControlVoz from '../components/ControlVoz.jsx'
import EncabezadoTablero from '../components/EncabezadoTablero.jsx'
import EstadoConexion from '../components/EstadoConexion.jsx'
import TarjetaAsignacion from '../components/TarjetaAsignacion.jsx'
import TableroError from '../components/TableroError.jsx'
import TableroVacio from '../components/TableroVacio.jsx'

const GRID_BASE = 'grid flex-1 content-start gap-6'

export function clasesGrid(cantidad) {
  if (cantidad === 1) {
    return `${GRID_BASE} mx-auto w-full max-w-4xl grid-cols-1`
  }
  if (cantidad === 2) {
    return `${GRID_BASE} mx-auto w-full max-w-7xl grid-cols-1 md:grid-cols-2`
  }
  if (cantidad === 3) {
    return `${GRID_BASE} mx-auto w-full max-w-[90rem] grid-cols-1 md:grid-cols-2 2xl:grid-cols-3`
  }
  return `${GRID_BASE} w-full grid-cols-1 md:grid-cols-2 2xl:grid-cols-4`
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

  const montadoRef = useRef(true)
  const vozActivaRef = useRef(false)
  const ultimosTurnosRef = useRef(new Map())

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

  useEffect(() => {
    montadoRef.current = true
    cargar()
    return () => {
      montadoRef.current = false
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

        if (cambioTurno && vozActivaRef.current) {
          anunciarTurno(estado)
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
  }, [])

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <EncabezadoTablero>
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

        {!cargando && !error && asignaciones.length === 0 && <TableroVacio />}

        {!cargando && !error && asignaciones.length > 0 && (
          <div data-testid="tablero-grid" className={clasesGrid(asignaciones.length)}>
            {asignaciones.map((asignacion) => (
              <TarjetaAsignacion
                key={asignacion.asignacionDiariaEspacioId}
                asignacion={asignacion}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
