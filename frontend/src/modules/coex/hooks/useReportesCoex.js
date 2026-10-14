import { useCallback, useRef, useState } from 'react'
import {
  descargarSalidaCarnetsPdf,
  descargarSalidaEnfermeriaCarnetsPdf,
} from '@/modules/carnets/api/carnetsApi'
import { descargarBlobCoex } from '../utils/descargarBlobCoex'

// Descarga (manual) de los reportes de Mesa COEX:
//   - salida de archivo: expedientes que salieron de archivo.
//   - salida de enfermería: expedientes que salen de enfermería hacia archivo.
// Ambos reutilizan la plantilla institucional del backend (sin bloque de firmas).
export function useReportesCoex({ fecha, mostrarToast } = {}) {
  const [tipoEnCurso, setTipoEnCurso] = useState(null)
  const enVueloRef = useRef(false)

  const descargar = useCallback(
    async (tipo) => {
      if (enVueloRef.current) return
      enVueloRef.current = true
      setTipoEnCurso(tipo)
      try {
        const pdf =
          tipo === 'salida-archivo'
            ? await descargarSalidaCarnetsPdf({ fecha })
            : await descargarSalidaEnfermeriaCarnetsPdf({ fecha })
        const nombre = `${tipo}-${fecha ?? 'sin-fecha'}.pdf`
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
    descargandoSalidaArchivo: tipoEnCurso === 'salida-archivo',
    descargandoSalidaEnfermeria: tipoEnCurso === 'salida-enfermeria',
    descargarSalidaArchivo: () => descargar('salida-archivo'),
    descargarSalidaEnfermeria: () => descargar('salida-enfermeria'),
  }
}
