import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  MAPEO_DEFECTO,
  PRIORIDAD_AREAS,
  RUTA_POR_AREA,
  listarRolesPaginas,
} from '@/shared/api/rolesPaginasApi.js'

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
  inicioSegunRol: (rol) => {
    const paginas = MAPEO_DEFECTO[rol] ?? []
    const area = PRIORIDAD_AREAS.find((candidata) => paginas.includes(candidata))
    return area ? RUTA_POR_AREA[area] : '/sin-acceso'
  },
  recargar: async () => MAPEO_DEFECTO,
}

const AccesoContext = createContext(DEFAULT_ACCESO)

export function AccesoProvider({ children }) {
  const [paginasPorRol, setPaginasPorRol] = useState(MAPEO_DEFECTO)

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
    }
  }, [])

  useEffect(() => {
    recargar()
  }, [recargar])

  const paginasDe = useCallback((rol) => paginasPorRol[rol] ?? [], [paginasPorRol])

  const puedeAcceder = useCallback(
    (rol, area) => paginasDe(rol).includes(area),
    [paginasDe],
  )

  const inicioSegunRol = useCallback(
    (rol) => {
      const paginas = paginasDe(rol)
      const area = PRIORIDAD_AREAS.find((candidata) => paginas.includes(candidata))
      return area ? RUTA_POR_AREA[area] : '/sin-acceso'
    },
    [paginasDe],
  )

  const value = useMemo(
    () => ({ paginasPorRol, paginasDe, puedeAcceder, inicioSegunRol, recargar }),
    [paginasPorRol, paginasDe, puedeAcceder, inicioSegunRol, recargar],
  )

  return <AccesoContext.Provider value={value}>{children}</AccesoContext.Provider>
}

export function useAcceso() {
  return useContext(AccesoContext)
}
