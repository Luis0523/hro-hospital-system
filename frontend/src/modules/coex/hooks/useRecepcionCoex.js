import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { entregarExpedienteCiclo } from '../api/coexApi'

// Estado desde el que Enfermería puede recibir un expediente. Es la única
// precondición que conocemos del backend; no se calculan transiciones.
export const ESTADO_ACCIONABLE_RECIBIR = 'en_transito_entrega'

// Guard defensivo: una fila es recibible solo si tiene ciclo y el backend la
// reporta en tránsito de entrega.
export function esFilaRecibible(fila) {
  return fila?.cicloId != null && fila.estadoActual === ESTADO_ACCIONABLE_RECIBIR
}

// Orquesta la recepción (checklist): selección de filas accionables y envío de
// N llamadas individuales con manejo de éxito/fallo por ciclo. No reconstruye
// el lote: delega el refresco a `recargar` (fuente de verdad = backend).
export function useRecepcionCoex({ pendientesRecibir = [], recargar, mostrarToast } = {}) {
  const [seleccion, setSeleccion] = useState(() => new Set())
  const [enviando, setEnviando] = useState(false)
  const [ultimoResultado, setUltimoResultado] = useState(null)
  const enviandoRef = useRef(false)

  const clavesAccionables = useMemo(
    () => pendientesRecibir.filter(esFilaRecibible).map((fila) => String(fila.cicloId)),
    [pendientesRecibir],
  )
  const clavesAccionablesSet = useMemo(() => new Set(clavesAccionables), [clavesAccionables])

  // Poda: al cambiar el lote, descarta selecciones que ya no son accionables
  // (por ejemplo, tras recibir pasan a `entregado` y salen de Pendientes).
  useEffect(() => {
    setSeleccion((actual) => {
      let igual = true
      for (const clave of actual) {
        if (!clavesAccionablesSet.has(clave)) {
          igual = false
          break
        }
      }
      if (igual) return actual

      const siguiente = new Set()
      for (const clave of actual) {
        if (clavesAccionablesSet.has(clave)) siguiente.add(clave)
      }
      return siguiente
    })
  }, [clavesAccionablesSet])

  const toggleFila = useCallback(
    (cicloId) => {
      const clave = String(cicloId)
      if (!clavesAccionablesSet.has(clave)) return
      setSeleccion((actual) => {
        const siguiente = new Set(actual)
        if (siguiente.has(clave)) siguiente.delete(clave)
        else siguiente.add(clave)
        return siguiente
      })
    },
    [clavesAccionablesSet],
  )

  const todasSeleccionadas =
    clavesAccionables.length > 0 && clavesAccionables.every((clave) => seleccion.has(clave))

  const toggleTodas = useCallback(() => {
    setSeleccion((actual) => {
      const completas =
        clavesAccionables.length > 0 && clavesAccionables.every((clave) => actual.has(clave))
      return completas ? new Set() : new Set(clavesAccionables)
    })
  }, [clavesAccionables])

  const limpiarSeleccion = useCallback(() => setSeleccion(new Set()), [])

  const seleccionadas = useMemo(
    () => pendientesRecibir.filter((fila) => seleccion.has(String(fila.cicloId))),
    [pendientesRecibir, seleccion],
  )

  const cantidadSeleccionada = seleccion.size
  const totalAccionables = clavesAccionables.length
  const seleccionParcial = cantidadSeleccionada > 0 && cantidadSeleccionada < totalAccionables

  const estaSeleccionada = useCallback(
    (cicloId) => seleccion.has(String(cicloId)),
    [seleccion],
  )

  const descartarResultado = useCallback(() => setUltimoResultado(null), [])

  const recibirSeleccionados = useCallback(async () => {
    // Protección síncrona contra doble envío: un segundo clic dentro del mismo
    // tick no debe volver a disparar las llamadas.
    if (enviandoRef.current) return null

    const objetivo = pendientesRecibir.filter(
      (fila) => estaSeleccionada(fila.cicloId) && esFilaRecibible(fila),
    )
    if (objetivo.length === 0) return null

    enviandoRef.current = true
    setEnviando(true)
    setUltimoResultado(null)

    const resultados = await Promise.allSettled(
      objetivo.map((fila) => entregarExpedienteCiclo(fila.cicloId)),
    )

    const exitosos = []
    const fallidos = []
    resultados.forEach((resultado, indice) => {
      const fila = objetivo[indice]
      if (resultado.status === 'fulfilled') exitosos.push(fila)
      else fallidos.push({ fila, error: resultado.reason })
    })

    // Solo los ciclos fallidos quedan seleccionados para reintento; los exitosos
    // nunca se reenvían.
    setSeleccion(new Set(fallidos.map(({ fila }) => String(fila.cicloId))))
    setUltimoResultado({ exitosos, fallidos })

    const numerosFallidos = fallidos
      .map(({ fila }) => fila.numeroExpediente || fila.cicloId)
      .join(', ')

    if (fallidos.length === 0) {
      mostrarToast?.({
        tone: 'success',
        title: `${exitosos.length} expediente${exitosos.length === 1 ? '' : 's'} recibido${
          exitosos.length === 1 ? '' : 's'
        }`,
      })
    } else if (exitosos.length === 0) {
      mostrarToast?.({
        tone: 'error',
        title: 'No se pudo recibir ningún expediente',
        message: numerosFallidos,
      })
    } else {
      mostrarToast?.({
        tone: 'warning',
        title: `${exitosos.length} recibido${exitosos.length === 1 ? '' : 's'}, ${
          fallidos.length
        } no se pudo${fallidos.length === 1 ? '' : 'ieron'} recibir`,
        message: numerosFallidos,
      })
    }

    recargar?.()

    enviandoRef.current = false
    setEnviando(false)

    return { exitosos, fallidos }
  }, [pendientesRecibir, estaSeleccionada, mostrarToast, recargar])

  return {
    seleccion,
    seleccionadas,
    cantidadSeleccionada,
    totalAccionables,
    todasSeleccionadas,
    seleccionParcial,
    enviando,
    ultimoResultado,
    toggleFila,
    toggleTodas,
    limpiarSeleccion,
    estaSeleccionada,
    descartarResultado,
    recibirSeleccionados,
  }
}
