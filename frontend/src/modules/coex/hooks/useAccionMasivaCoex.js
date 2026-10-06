import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

// Core reutilizable para acciones masivas por ciclo (recepción y devolución).
// Encapsula la mecánica común: selección por `cicloId`, poda tras refresco,
// maestro/indeterminate, contadores, guard síncrono contra doble envío,
// `Promise.allSettled`, éxitos/fallos y conservación de solo los fallidos.
//
// NO conoce la API ni los estados: recibe `esAccionable` y `ejecutar` desde
// cada wrapper (`useRecepcionCoex` / `useDevolucionCoex`). No reconstruye el
// lote: delega el refresco a `recargar` (fuente de verdad = backend).
export function useAccionMasivaCoex({
  filas = [],
  esAccionable,
  ejecutar,
  recargar,
  mostrarToast,
  construirToast,
} = {}) {
  const [seleccion, setSeleccion] = useState(() => new Set())
  const [enviando, setEnviando] = useState(false)
  const [ultimoResultado, setUltimoResultado] = useState(null)
  const enviandoRef = useRef(false)

  const clavesAccionables = useMemo(
    () => filas.filter((fila) => esAccionable(fila)).map((fila) => String(fila.cicloId)),
    [filas, esAccionable],
  )
  const clavesAccionablesSet = useMemo(() => new Set(clavesAccionables), [clavesAccionables])

  // Poda: al cambiar el lote, descarta selecciones que ya no son accionables
  // (por ejemplo, tras la transición dejan de estar en la lista fuente).
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
    () => filas.filter((fila) => seleccion.has(String(fila.cicloId))),
    [filas, seleccion],
  )

  const cantidadSeleccionada = seleccion.size
  const totalAccionables = clavesAccionables.length
  const seleccionParcial = cantidadSeleccionada > 0 && cantidadSeleccionada < totalAccionables

  const estaSeleccionada = useCallback(
    (cicloId) => seleccion.has(String(cicloId)),
    [seleccion],
  )

  const descartarResultado = useCallback(() => setUltimoResultado(null), [])

  const ejecutarSeleccionados = useCallback(async () => {
    // Protección síncrona contra doble envío: un segundo clic dentro del mismo
    // tick no debe volver a disparar las llamadas.
    if (enviandoRef.current) return null

    const objetivo = filas.filter(
      (fila) => estaSeleccionada(fila.cicloId) && esAccionable(fila),
    )
    if (objetivo.length === 0) return null

    enviandoRef.current = true
    setEnviando(true)
    setUltimoResultado(null)

    const resultados = await Promise.allSettled(objetivo.map((fila) => ejecutar(fila)))

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

    const toast = construirToast?.({ exitosos, fallidos })
    if (toast) mostrarToast?.(toast)

    recargar?.()

    enviandoRef.current = false
    setEnviando(false)

    return { exitosos, fallidos }
  }, [filas, estaSeleccionada, esAccionable, ejecutar, construirToast, mostrarToast, recargar])

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
    ejecutarSeleccionados,
  }
}
