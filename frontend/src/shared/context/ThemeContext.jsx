import { createContext, useCallback, useContext, useEffect, useState } from 'react'

const CLAVE = 'hro_tema'

const ThemeContext = createContext(null)

function temaInicial() {
  try {
    const guardado = localStorage.getItem(CLAVE)
    if (guardado === 'claro' || guardado === 'oscuro') return guardado
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro'
    }
  } catch {
    return 'claro'
  }
  return 'claro'
}

export function ThemeProvider({ children }) {
  const [tema, setTema] = useState(temaInicial)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', tema === 'oscuro')
    try {
      localStorage.setItem(CLAVE, tema)
    } catch {
      return
    }
  }, [tema])

  const alternarTema = useCallback(() => {
    setTema((actual) => (actual === 'oscuro' ? 'claro' : 'oscuro'))
  }, [])

  return <ThemeContext.Provider value={{ tema, alternarTema }}>{children}</ThemeContext.Provider>
}

export function useTema() {
  const contexto = useContext(ThemeContext)
  if (!contexto) throw new Error('useTema debe usarse dentro de ThemeProvider')
  return contexto
}
