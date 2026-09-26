import { useCallback, useState } from 'react'

export const CLAVE_TEMA = 'hro-tablero-tema'

export const TEMAS_VALIDOS = ['light', 'dark']

export const TEMA_POR_DEFECTO = 'light'

export function normalizarTema(valor) {
  return TEMAS_VALIDOS.includes(valor) ? valor : TEMA_POR_DEFECTO
}

export function leerTemaGuardado(storage = globalThis.localStorage) {
  try {
    return normalizarTema(storage?.getItem(CLAVE_TEMA))
  } catch {
    return TEMA_POR_DEFECTO
  }
}

export function guardarTema(tema, storage = globalThis.localStorage) {
  try {
    storage?.setItem(CLAVE_TEMA, normalizarTema(tema))
    return true
  } catch {
    return false
  }
}

/**
 * Tema local (claro/oscuro) del tablero. La preferencia es por navegador/TV y
 * no depende de la sala. Si localStorage falla, se usa claro y el cambio visual
 * de la sesión sigue funcionando aunque no se persista.
 */
export function useTemaTablero({ storage = globalThis.localStorage } = {}) {
  const [tema, setTema] = useState(() => leerTemaGuardado(storage))

  const alternarTema = useCallback(() => {
    setTema((actual) => {
      const nuevo = actual === 'dark' ? 'light' : 'dark'
      guardarTema(nuevo, storage)
      return nuevo
    })
  }, [storage])

  return { tema, alternarTema }
}
