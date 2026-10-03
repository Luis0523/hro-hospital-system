import { useEffect, useMemo, useState } from 'react'
import Alert from '@/shared/components/ui/Alert.jsx'
import Button from '@/shared/components/ui/Button.jsx'
import Icon from '@/shared/components/ui/Icon.jsx'
import Spinner from '@/shared/components/ui/Spinner.jsx'
import { useToast } from '@/shared/context/ToastContext.jsx'
import { useAcceso } from '@/shared/context/AccesoContext.jsx'
import {
  actualizarRolPaginas,
  listarPaginas,
  listarRolesPaginas,
} from '@/shared/api/rolesPaginasApi.js'

/**
 * Configuración de páginas por rol. Los roles se administran en Keycloak;
 * aquí solo se define a qué páginas del SIGHO accede cada rol.
 */
export default function RolesPaginasPage() {
  const { mostrarToast } = useToast()
  const { recargar } = useAcceso()

  const [paginas, setPaginas] = useState([])
  const [filas, setFilas] = useState([])
  const [nuevoRol, setNuevoRol] = useState('')
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let activo = true
    ;(async () => {
      setCargando(true)
      setError(null)
      try {
        const [catalogo, mapeo] = await Promise.all([listarPaginas(), listarRolesPaginas()])
        if (!activo) return
        setPaginas(catalogo)
        setFilas(
          (mapeo ?? []).map((item) => ({
            rol: item.rol,
            seleccion: new Set(item.paginas ?? []),
          })),
        )
      } catch (fallo) {
        if (activo) setError(fallo?.message || 'No se pudo cargar la configuración')
      } finally {
        if (activo) setCargando(false)
      }
    })()
    return () => {
      activo = false
    }
  }, [])

  const rolesExistentes = useMemo(() => new Set(filas.map((fila) => fila.rol)), [filas])

  function alternar(rol, clave) {
    setFilas((actual) =>
      actual.map((fila) => {
        if (fila.rol !== rol) return fila
        const seleccion = new Set(fila.seleccion)
        if (seleccion.has(clave)) seleccion.delete(clave)
        else seleccion.add(clave)
        return { ...fila, seleccion }
      }),
    )
  }

  async function guardar(rol) {
    const fila = filas.find((item) => item.rol === rol)
    if (!fila) return
    setGuardando(rol)
    try {
      await actualizarRolPaginas(rol, [...fila.seleccion])
      await recargar()
      mostrarToast({
        tone: 'success',
        title: 'Páginas actualizadas',
        message: `Rol "${rol}" guardado.`,
      })
    } catch (fallo) {
      mostrarToast({
        tone: 'error',
        title: 'No se pudo guardar',
        message: fallo?.message || 'Error al guardar el rol.',
      })
    } finally {
      setGuardando(null)
    }
  }

  function agregarRol() {
    const rol = nuevoRol.trim().toLowerCase()
    if (!rol) return
    if (rolesExistentes.has(rol)) {
      mostrarToast({ tone: 'warning', title: 'El rol ya existe', message: rol })
      return
    }
    setFilas((actual) => [...actual, { rol, seleccion: new Set() }])
    setNuevoRol('')
  }

  if (cargando) return <Spinner label="Cargando configuración de roles..." />

  if (error) {
    return (
      <Alert tone="error" title="No se pudo cargar la configuración">
        {error}
      </Alert>
    )
  }

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h2 className="text-headline-md text-hro-blue">Roles y páginas</h2>
        <p className="text-sm text-slate-500">
          Elija a qué páginas del SIGHO accede cada rol. Los roles se crean y administran en
          Keycloak; aquí solo se configuran sus páginas.
        </p>
      </header>

      <Alert tone="info" title="Los roles provienen de Keycloak">
        Para crear un rol nuevo, créelo primero en Keycloak y luego agregue aquí su nombre y sus
        páginas.
      </Alert>

      <div className="flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="nuevo-rol" className="text-label-md text-on-surface-variant">
            Agregar rol (nombre tal como está en Keycloak)
          </label>
          <input
            id="nuevo-rol"
            type="text"
            value={nuevoRol}
            onChange={(evento) => setNuevoRol(evento.target.value)}
            placeholder="p. ej. tecnico"
            className="rounded border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface outline-none focus:border-hro-blue focus:ring-2 focus:ring-secondary-fixed-dim"
          />
        </div>
        <Button variant="secondary" onClick={agregarRol}>
          <Icon name="add" className="text-[18px]" />
          Agregar rol
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-outline-variant">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-surface-container">
            <tr>
              <th className="px-4 py-3 font-semibold text-on-surface">Rol</th>
              {paginas.map((pagina) => (
                <th key={pagina.clave} className="px-4 py-3 font-semibold text-on-surface">
                  {pagina.nombre}
                </th>
              ))}
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filas.length === 0 ? (
              <tr>
                <td colSpan={paginas.length + 2} className="px-4 py-6 text-center text-slate-500">
                  No hay roles configurados.
                </td>
              </tr>
            ) : (
              filas.map((fila) => (
                <tr key={fila.rol} className="border-t border-outline-variant">
                  <td className="px-4 py-3 font-medium text-on-surface">{fila.rol}</td>
                  {paginas.map((pagina) => (
                    <td key={pagina.clave} className="px-4 py-3">
                      <input
                        type="checkbox"
                        aria-label={`${fila.rol} - ${pagina.nombre}`}
                        checked={fila.seleccion.has(pagina.clave)}
                        onChange={() => alternar(fila.rol, pagina.clave)}
                        className="h-4 w-4 cursor-pointer rounded accent-hro-blue"
                      />
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="primary" onClick={() => guardar(fila.rol)} disabled={guardando === fila.rol}>
                      {guardando === fila.rol ? 'Guardando…' : 'Guardar'}
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
