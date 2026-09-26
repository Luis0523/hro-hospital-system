const PREFIJO = 'hro_cache_'

export function leerCache(clave) {
  try {
    const crudo = localStorage.getItem(PREFIJO + clave)
    if (!crudo) return null
    const { valor, expira } = JSON.parse(crudo)
    if (expira && Date.now() > expira) {
      localStorage.removeItem(PREFIJO + clave)
      return null
    }
    return valor
  } catch {
    return null
  }
}

export function guardarCache(clave, valor, ttlMs = 0) {
  try {
    localStorage.setItem(
      PREFIJO + clave,
      JSON.stringify({ valor, expira: ttlMs ? Date.now() + ttlMs : 0 }),
    )
  } catch {
    return
  }
}

export function limpiarCache(clave) {
  try {
    localStorage.removeItem(PREFIJO + clave)
  } catch {
    return
  }
}

export function limpiarCachePrefijo(prefijo) {
  try {
    const clave = PREFIJO + prefijo
    Object.keys(localStorage)
      .filter((item) => item.startsWith(clave))
      .forEach((item) => localStorage.removeItem(item))
  } catch {
    return
  }
}
