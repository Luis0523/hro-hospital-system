import { useCallback, useRef, useState } from 'react'
import {
  descargarDevolucionCarnetsPdf,
  descargarRecepcionCarnetsPdf,
} from '@/modules/carnets/api/carnetsApi'
import { descargarBlobCoex } from '../utils/descargarBlobCoex'

// Descarga (manual) de los reportes generales de Mesa COEX:
//   - recepción: expedientes recibidos en la estación.
//   - devolución: expedientes devueltos a Archivo.
// Ambos reutilizan la plantilla institucional del backend (mismo estándar que
// el reporte de salida de /archivo), pero SIN el bloque de firmas.
//
// Es una acción independiente del flujo de recibir/devolver: solo expone su
// propio estado para deshabilitar el botón correspondiente.
export function useReportesCoex({ fecha, mostrarToast } = {}) {
  const [tipoEnCurso, setTipoEnCurso] = useState(null)
  const enVueloRef = useRef(false)

  const descargar = useCallback(
    async (tipo) => {
      if (enVueloRef.current) return
      enVueloRef.current = true
      setTipoEnCurso(tipo)
      const esRecepcion = tipo === 'recepcion'
      try {
        const pdf = esRecepcion
          ? await descargarRecepcionCarnetsPdf({ fecha })
          : await descargarDevolucionCarnetsPdf({ fecha })
        const nombre = `${esRecepcion ? 'recepcion' : 'devolucion'}-expedientes-${
          fecha ?? 'sin-fecha'
        }.pdf`
        const iniciada = descargarBlobCoex(pdf, nombre)
        if (iniciada) {
          mostrarToast?.({ tone: 'success', title: 'Reporte descargado.' })
        }
      } catch (fallo) {
        mostrarToast?.({
          tone: 'error',
          title: 'No se pudo generar el reporte.',
          message: fallo?.message,
        })
      } finally {
        enVueloRef.current = false
        setTipoEnCurso(null)
      }
    },
    [fecha, mostrarToast],
  )

  return {
    descargandoRecepcion: tipoEnCurso === 'recepcion',
    descargandoDevolucion: tipoEnCurso === 'devolucion',
    descargarRecepcion: () => descargar('recepcion'),
    descargarDevolucion: () => descargar('devolucion'),
  }
}
