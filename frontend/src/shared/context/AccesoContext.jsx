import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import { MAPEO_DEFECTO, inicioSegunMapa, listarRolesPaginas } from '@/shared/api/rolesPaginasApi.js'

/**
 * Páginas/áreas permitidas por rol, cargadas desde el backend (configurables).
 * Si el backend no responde, se usa MAPEO_DEFECTO.
 *
 * El contexto trae un valor por defecto (basado en MAPEO_DEFECTO) para que
 * componentes como los guards funcionen aunque no haya provider (p. ej. tests).
 */
const DEFAULT_ACCESO = {
  paginasPorRol: MAPEO_DEFECTO,
  paginasDe: (rol) => MAPEO_DEFECTO[rol] ?? [],
  puedeAcceder: (rol, area) => (MAPEO_DEFECTO[rol] ?? []).includes(area),
  inicioSegunRol: (rol) => inicioSegunMapa(MAPEO_DEFECTO, rol),
  recargar: async () => MAPEO_DEFECTO,
  cargando: false,
}

const AccesoContext = createContext(DEFAULT_ACCESO)

export function AccesoProvider({ children }) {
  const { autenticado } = useAuth()
  const [paginasPorRol, setPaginasPorRol] = useState(MAPEO_DEFECTO)
  const [cargando, setCargando] = useState(autenticado)

  const recargar = useCallback(async () => {
    try {
      const lista = await listarRolesPaginas()
      const mapa = {}
      for (const item of lista) {
        mapa[item.rol] = item.paginas ?? []
      }
      if (Object.keys(mapa).length > 0) setPaginasPorRol(mapa)
      return mapa
    } catch {
      // Sin backend: se conserva MAPEO_DEFECTO.
      return MAPEO_DEFECTO
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    if (!autenticado) {
      setCargando(false)
      return
    }
    recargar()
  }, [autenticado, recargar])

  const paginasDe = useCallback((rol) => paginasPorRol[rol] ?? [], [paginasPorRol])

  const puedeAcceder = useCallback((rol, area) => paginasDe(rol).includes(area), [paginasDe])

  const inicioSegunRol = useCallback((rol) => inicioSegunMapa(paginasPorRol, rol), [paginasPorRol])

  const value = useMemo(
    () => ({ paginasPorRol, paginasDe, puedeAcceder, inicioSegunRol, recargar, cargando }),
    [paginasPorRol, paginasDe, puedeAcceder, inicioSegunRol, recargar, cargando],
  )

  return <AccesoContext.Provider value={value}>{children}</AccesoContext.Provider>
}

export function useAcceso() {
  return useContext(AccesoContext)
}
