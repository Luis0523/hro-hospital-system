import { useCallback, useRef, useState } from 'react'
import { obtenerSalidaPdfCoex } from '../api/coexApi'
import { descargarBlobCoex, nombreArchivoSalidaCoex } from '../utils/descargarBlobCoex'

// Descarga manual del documento de salida de expedientes (PDF) del día.
//
// Es una acción INDEPENDIENTE del flujo de recepción/devolución: NO se acopla a
// `entregar` ni `retornar`, ni se dispara automáticamente tras Recibir. Motivo:
// `/archivo/salida` incluye los estados `localizado` y `en_transito_entrega`
// pero NO `entregado`, por lo que un expediente recién recibido puede
// desaparecer del documento. Hasta que el backend aclare la semántica, la
// descarga se ejecuta solo por acción manual.
//
// No bloquea la pantalla ni interfiere con el polling: solo expone su propio
// estado `descargandoPdf` para deshabilitar su botón.
export function useDescargaPdfCoex({ fecha, mostrarToast } = {}) {
  const [descargandoPdf, setDescargandoPdf] = useState(false)
  // Guard defensivo contra doble envío (el botón también se deshabilita).
  const enVueloRef = useRef(false)

  const descargarSalidaPdf = useCallback(async () => {
    if (enVueloRef.current) return
    enVueloRef.current = true
    setDescargandoPdf(true)
    try {
      const pdf = await obtenerSalidaPdfCoex({ fecha })
      const iniciada = descargarBlobCoex(pdf, nombreArchivoSalidaCoex(fecha))
      if (iniciada) {
        mostrarToast?.({ tone: 'success', title: 'PDF de salida descargado.' })
      }
    } catch (fallo) {
      mostrarToast?.({
        tone: 'error',
        title: 'No se pudo descargar el PDF de salida.',
        message: fallo?.message,
      })
    } finally {
      enVueloRef.current = false
      setDescargandoPdf(false)
    }
  }, [fecha, mostrarToast])

  return { descargandoPdf, descargarSalidaPdf }
}
