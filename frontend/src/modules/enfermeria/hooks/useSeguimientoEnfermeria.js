import { useCallback, useEffect, useRef, useState } from 'react'
import {
  avanzarTurno,
  contarExpedientesEnClinica,
  listarClinicas,
  obtenerLibro,
  registrarTurno,
  revertirTurno,
} from '../api/seguimientoApi'

const ESTADO_BACKEND_POR_ETAPA = {
  registrado: 'registrado',
  recibido: 'recibido',
  en_clinica: 'en_clinica',
  devuelto: 'devuelto',
  archivo: 'archivado',
}

function insertarTurno(libro, turno) {
  if (!libro) return libro
  const especialidades = libro.especialidades.map((especialidad) => {
    if (String(especialidad.id) !== String(turno.especialidadId)) return especialidad
    if (especialidad.turnos.some((item) => item.id === turno.id)) return especialidad
    return {
      ...especialidad,
      turnos: [...especialidad.turnos, turno].sort((a, b) => a.numero - b.numero),
    }
  })
  return {
    ...libro,
    especialidades,
    totalRegistrados: (libro.totalRegistrados ?? 0) + 1,
  }
}

function reemplazarTurno(libro, turno) {
  if (!libro) return libro
  return {
    ...libro,
    especialidades: libro.especialidades.map((especialidad) => ({
      ...especialidad,
      turnos: especialidad.turnos.map((item) => (item.id === turno.id ? turno : item)),
    })),
  }
}

// Pinta el nuevo estado antes de que responda el backend.
function cambiarEstadoLocal(libro, id, etapa, { clinica = null } = {}) {
  if (!libro) return libro
  return {
    ...libro,
    especialidades: libro.especialidades.map((especialidad) => ({
      ...especialidad,
      turnos: especialidad.turnos.map((item) =>
        item.id === id
          ? {
              ...item,
              etapa,
              estadoBackend: ESTADO_BACKEND_POR_ETAPA[etapa] ?? item.estadoBackend,
              ...(clinica ? { clinicaId: clinica.id, clinicaNombre: clinica.nombre } : {}),
            }
          : item,
      ),
    })),
  }
}

// Carga el libro y las clínicas de la estación/fecha y refresca ambos tras cada acción.
export function useSeguimientoEnfermeria(estacionId, fecha) {
  const [libro, setLibro] = useState(null)
  const [clinicas, setClinicas] = useState([])
  const [cargando, setCargando] = useState(Boolean(estacionId))
  const [error, setError] = useState(null)
  const colaRef = useRef(new Map())

  const cargar = useCallback(
    async ({ silencioso = false } = {}) => {
      if (!estacionId) {
        setLibro(null)
        setClinicas([])
        setError(null)
        setCargando(false)
        return
      }

      if (!silencioso) {
        setCargando(true)
        setError(null)
      }
      try {
        const libroCargado = await obtenerLibro(estacionId, fecha)
        const clinicasCargadas = await listarClinicas()
        setLibro(libroCargado)
        setClinicas(contarExpedientesEnClinica(clinicasCargadas, libroCargado.especialidades))
      } catch (fallo) {
        if (!silencioso) {
          setError(fallo?.message ?? 'No fue posible cargar el libro de turnos.')
        }
      } finally {
        if (!silencioso) setCargando(false)
      }
    },
    [estacionId, fecha],
  )

  useEffect(() => {
    cargar()
  }, [cargar])

  // Serializa las acciones por turno para que los clics rápidos mantengan el orden.
  const encolar = useCallback((id, tarea) => {
    const anterior = colaRef.current.get(id) ?? Promise.resolve()
    const siguiente = anterior.catch(() => undefined).then(tarea)
    colaRef.current.set(id, siguiente)
    siguiente
      .finally(() => {
        if (colaRef.current.get(id) === siguiente) colaRef.current.delete(id)
      })
      .catch(() => undefined)
    return siguiente
  }, [])

  // Devuelve el turno en cuanto el backend confirma y refresca el libro en segundo plano.
  const registrar = useCallback(
    async (datos) => {
      const creado = await registrarTurno({ ...datos, estacionId, fecha })
      const turno = {
        ...creado,
        especialidadId: creado.especialidadId ?? datos.especialidadId,
      }
      setLibro((actual) => insertarTurno(actual, turno))
      cargar({ silencioso: true })
      return turno
    },
    [cargar, estacionId, fecha],
  )

  // Aplica el estado de inmediato, encola la llamada y reconcilia al final.
  const avanzar = useCallback(
    async (id, opciones = {}) => {
      const { estadoOptimista, clinica, ...resto } = opciones
      if (estadoOptimista) {
        setLibro((actual) => cambiarEstadoLocal(actual, id, estadoOptimista, { clinica }))
      }

      try {
        const turno = await encolar(id, () => avanzarTurno(id, resto))
        setLibro((actual) => reemplazarTurno(actual, turno))
        cargar({ silencioso: true })
        return turno
      } catch (fallo) {
        cargar({ silencioso: true })
        throw fallo
      }
    },
    [cargar, encolar],
  )

  const revertir = useCallback(
    async (id) => {
      try {
        const turno = await encolar(id, () => revertirTurno(id))
        setLibro((actual) => reemplazarTurno(actual, turno))
        cargar({ silencioso: true })
        return turno
      } catch (fallo) {
        cargar({ silencioso: true })
        throw fallo
      }
    },
    [cargar, encolar],
  )

  const recargar = useCallback(() => cargar(), [cargar])

  return { libro, clinicas, cargando, error, recargar, registrar, avanzar, revertir }
}
