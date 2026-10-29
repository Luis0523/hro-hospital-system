import { useCallback, useEffect, useRef, useState } from 'react'
import {
  actualizarTipoRegistroTurno,
  avanzarTurno,
  cambiarClinicaTurno,
  deshacerDevolucionClinica,
  eliminarTurno,
  listarClinicas,
  registrarDevolucionClinica,
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

function quitarTurno(libro, id) {
  if (!libro) return libro
  let eliminado = false
  const especialidades = libro.especialidades.map((especialidad) => ({
    ...especialidad,
    turnos: especialidad.turnos.filter((item) => {
      if (item.id !== id) return true
      eliminado = true
      return false
    }),
  }))
  return {
    ...libro,
    especialidades,
    totalRegistrados: Math.max(0, (libro.totalRegistrados ?? 0) - (eliminado ? 1 : 0)),
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

function actualizarResumenClinica(clinicas, resumen) {
  if (!resumen) return clinicas
  const id = resumen.espacioFisicoId ?? resumen.id
  return clinicas.map((clinica) =>
    String(clinica.id) === String(id)
      ? {
          ...clinica,
          asignados: Number(resumen.asignados ?? clinica.asignados ?? 0),
          devueltos: Number(resumen.devueltos ?? clinica.devueltos ?? 0),
          presentaciones: Number(resumen.presentaciones ?? clinica.presentaciones ?? 0),
          expedientesEnClinica: Number(
            resumen.pendientes ?? resumen.expedientesEnClinica ?? clinica.expedientesEnClinica ?? 0,
          ),
          ultimaDevolucionEn: resumen.ultimaDevolucionEn ?? clinica.ultimaDevolucionEn ?? null,
        }
      : clinica,
  )
}

// Carga el libro y las clínicas de la estación/fecha y refresca ambos tras cada acción.
export function useSeguimientoEnfermeria(estacionId, fecha) {
  const [libro, setLibro] = useState(null)
  const [clinicas, setClinicas] = useState([])
  const [cargando, setCargando] = useState(Boolean(estacionId))
  const [error, setError] = useState(null)
  const colaRef = useRef(new Map())
  const cargaRef = useRef(0)

  const cargar = useCallback(
    async ({ silencioso = false } = {}) => {
      const cargaId = ++cargaRef.current
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
        const clinicasCargadas = await listarClinicas({ estacionId, fecha })
        if (cargaId !== cargaRef.current) return
        setLibro(libroCargado)
        setClinicas(Array.isArray(clinicasCargadas) ? clinicasCargadas : [])
      } catch (fallo) {
        if (cargaId !== cargaRef.current) return
        if (!silencioso) {
          setError(fallo?.message ?? 'No fue posible cargar el libro de turnos.')
        }
      } finally {
        if (cargaId === cargaRef.current && !silencioso) setCargando(false)
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
      // Pinta la casilla de inmediato; el backend confirma y luego se reconcilia.
      const provisionalId = `tmp-${datos.codigo}-${datos.numero}-${Date.now()}`
      const provisional = {
        id: provisionalId,
        especialidadId: datos.especialidadId,
        codigo: datos.codigo,
        numero: datos.numero,
        numeroGeneral: null,
        etapa: 'registrado',
        estadoBackend: 'registrado',
        clinicaId: null,
        clinicaNumero: null,
        clinicaNombre: null,
        tipoRegistro: datos.tipoRegistro ?? null,
        registradoEn: new Date().toISOString(),
      }
      setLibro((actual) => insertarTurno(actual, provisional))

      try {
        const creado = await registrarTurno({ ...datos, estacionId, fecha })
        const turno = {
          ...creado,
          especialidadId: creado.especialidadId ?? datos.especialidadId,
        }
        setLibro((actual) => insertarTurno(quitarTurno(actual, provisionalId), turno))
        cargar({ silencioso: true })
        return turno
      } catch (fallo) {
        setLibro((actual) => quitarTurno(actual, provisionalId))
        throw fallo
      }
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

  const eliminar = useCallback(
    async (id, motivo) => {
      const resultado = await encolar(id, () => eliminarTurno(id, motivo))
      setLibro((actual) => quitarTurno(actual, id))
      cargar({ silencioso: true })
      return resultado
    },
    [cargar, encolar],
  )

  const cambiarClinica = useCallback(
    async (id, espacioFisicoId) => {
      const turno = await encolar(id, () => cambiarClinicaTurno(id, espacioFisicoId))
      setLibro((actual) => reemplazarTurno(actual, turno))
      cargar({ silencioso: true })
      return turno
    },
    [cargar, encolar],
  )

  const cambiarTipoRegistro = useCallback(
    async (id, tipoRegistro) => {
      const turno = await encolar(id, () => actualizarTipoRegistroTurno(id, tipoRegistro))
      setLibro((actual) => reemplazarTurno(actual, turno))
      cargar({ silencioso: true })
      return turno
    },
    [cargar, encolar],
  )

  const devolverClinica = useCallback(
    async (espacioFisicoId, cantidad = 1) => {
      const resumen = await registrarDevolucionClinica({
        espacioFisicoId,
        estacionId,
        fecha,
        cantidad,
      })
      setClinicas((actual) => actualizarResumenClinica(actual, resumen))
      return resumen
    },
    [estacionId, fecha],
  )

  const deshacerDevolucion = useCallback(
    async (espacioFisicoId) => {
      const resumen = await deshacerDevolucionClinica({ espacioFisicoId, estacionId, fecha })
      setClinicas((actual) => actualizarResumenClinica(actual, resumen))
      return resumen
    },
    [estacionId, fecha],
  )

  const recargar = useCallback(() => cargar(), [cargar])

  return {
    libro,
    clinicas,
    cargando,
    error,
    recargar,
    registrar,
    avanzar,
    revertir,
    eliminar,
    cambiarClinica,
    cambiarTipoRegistro,
    devolverClinica,
    deshacerDevolucion,
  }
}
