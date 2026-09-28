// Descarga un Blob devuelto por el backend (por ejemplo un PDF) sin generar el
// archivo en el frontend. Tolera entornos de prueba donde createObjectURL no
// existe.
export function descargarBlob(blob, nombreArchivo) {
  if (!blob || typeof document === 'undefined') return false
  if (typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') return false

  const url = URL.createObjectURL(blob)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombreArchivo
  document.body.appendChild(enlace)
  enlace.click()
  enlace.remove()
  URL.revokeObjectURL?.(url)
  return true
}
