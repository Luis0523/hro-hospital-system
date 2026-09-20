import { useCallback, useEffect, useMemo, useState } from 'react'
import { aIso } from '@/shared/utils/fecha'
import {
  avanzarEstado,
  crearExpediente,
  listarClinicas,
  listarExpedientes,
  listarMedicos,
  marcarNoLocalizado,
} from '../api/archivoApi'
import { ORDEN_ESTADOS } from '../estadosExpediente'

function mananaIso() {
  const fecha = new Date()
  fecha.setDate(fecha.getDate() + 1)
  return aIso(fecha)
}

export function useExpedientes() {
  const [fecha, setFecha] = useState(mananaIso)
  const [clinicaId, setClinicaId] = useState('')
  const [medicoId, setMedicoId] = useState('')
  const [clinicas, setClinicas] = useState([])
  const [medicos, setMedicos] = useState([])
  const [expedientes, setExpedientes] = useState([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    listarClinicas()
      .then(setClinicas)
      .catch(() => setClinicas([]))
    listarMedicos()
      .then(setMedicos)
      .catch(() => setMedicos([]))
  }, [])

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const lista = await listarExpedientes({ fecha, clinicaId, medicoId })
      setExpedientes(lista)
    } catch (fallo) {
      setError(fallo)
      setExpedientes([])
    } finally {
      setCargando(false)
    }
  }, [fecha, clinicaId, medicoId])

  useEffect(() => {
    cargar()
  }, [cargar])

  const resumen = useMemo(() => {
    const conteo = Object.fromEntries([...ORDEN_ESTADOS, 'no_localizado'].map((e) => [e, 0]))
    expedientes.forEach((expediente) => {
      if (expediente.estado in conteo) conteo[expediente.estado] += 1
    })
    return conteo
  }, [expedientes])

  const reemplazar = useCallback((actualizado) => {
    setExpedientes((actual) =>
      actual.map((expediente) => (expediente.id === actualizado.id ? actualizado : expediente)),
    )
    return actualizado
  }, [])

  const avanzar = useCallback(async (id) => reemplazar(await avanzarEstado(id)), [reemplazar])

  const marcar = useCallback(async (id) => reemplazar(await marcarNoLocalizado(id)), [reemplazar])

  const crear = useCallback(
    async (pacienteId) => reemplazar(await crearExpediente(pacienteId)),
    [reemplazar],
  )

  return {
    fecha,
    setFecha,
    clinicaId,
    setClinicaId,
    medicoId,
    setMedicoId,
    clinicas,
    medicos,
    expedientes,
    cargando,
    error,
    resumen,
    total: expedientes.length,
    recargar: cargar,
    avanzar,
    marcarNoLocalizado: marcar,
    crear,
  }
}
