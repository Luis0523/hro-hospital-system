import { useCallback, useRef, useState } from 'react'
import {
  crearActaRecepcion,
  obtenerActaRecepcionPdf,
  obtenerResumenArchivo,
  obtenerResumenArchivoPdf,
} from '../api/archivoApi'
import { descargarBlob } from '../utils/descargarBlob'

// Acciones del día de la Estación de Archivo (SCRUM-96): resumen del backend,
// descarga de PDFs y creación de actas. Cada acción evita la doble ejecución y
// expone su propio estado de carga. No genera PDFs en el frontend.
export function useAccionesArchivo() {
  const [resumen, setResumen] = useState(null)
  const [cargandoResumen, setCargandoResumen] = useState(false)
  const [cargandoResumenPdf, setCargandoResumenPdf] = useState(false)
  const [creandoActa, setCreandoActa] = useState(false)
  const [descargandoActaPdf, setDescargandoActaPdf] = useState(false)

  // Guarda contra doble clic por acción.
  const enCurso = useRef({})

  const ejecutar = useCallback(async (clave, marcar, tarea) => {
    if (enCurso.current[clave]) return undefined
    enCurso.current[clave] = true
    marcar(true)
    try {
      return await tarea()
    } finally {
      enCurso.current[clave] = false
      marcar(false)
    }
  }, [])

  const consultarResumen = useCallback(
    (fecha) =>
      ejecutar('resumen', setCargandoResumen, async () => {
        const datos = await obtenerResumenArchivo({ fecha })
        setResumen(datos)
        return datos
      }),
    [ejecutar],
  )

  const descargarResumenPdf = useCallback(
    (fecha) =>
      ejecutar('resumenPdf', setCargandoResumenPdf, async () => {
        const blob = await obtenerResumenArchivoPdf({ fecha })
        descargarBlob(blob, `resumen-archivo-${fecha ?? 'hoy'}.pdf`)
        return blob
      }),
    [ejecutar],
  )

  const generarActa = useCallback(
    (datos) => ejecutar('acta', setCreandoActa, () => crearActaRecepcion(datos)),
    [ejecutar],
  )

  const descargarActaPdf = useCallback(
    (id) =>
      ejecutar('actaPdf', setDescargandoActaPdf, async () => {
        const blob = await obtenerActaRecepcionPdf(id)
        descargarBlob(blob, `acta-${id}.pdf`)
        return blob
      }),
    [ejecutar],
  )

  return {
    resumen,
    cargandoResumen,
    cargandoResumenPdf,
    creandoActa,
    descargandoActaPdf,
    consultarResumen,
    descargarResumenPdf,
    generarActa,
    descargarActaPdf,
  }
}
