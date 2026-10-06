// Descarga local de un Blob devuelto por el backend (p. ej. el PDF de salida
// de expedientes). Es infraestructura de Mesa COEX; no se acopla a otras
// estaciones ni a `shared`.
//
// Estrategia de nombre (Opción A): NO se lee `Content-Disposition` porque el
// interceptor de `shared/api/client` devuelve `response.data` y pierde
// cabeceras. El nombre es local y determinista.

const FECHA_ISO = /^\d{4}-\d{2}-\d{2}$/

// Nombre determinista para el PDF de salida. Si la fecha falta o no es ISO,
// usa un sufijo estable y seguro.
export function nombreArchivoSalidaCoex(fecha) {
  const sufijo = typeof fecha === 'string' && FECHA_ISO.test(fecha) ? fecha : 'sin-fecha'
  return `salida-expedientes-${sufijo}.pdf`
}

// Dispara la descarga de un Blob. Tolera entornos sin DOM/URL (jsdom).
// Devuelve `true` si pudo ejecutar la descarga; `false` en caso contrario.
export function descargarBlobCoex(blob, nombreArchivo) {
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
