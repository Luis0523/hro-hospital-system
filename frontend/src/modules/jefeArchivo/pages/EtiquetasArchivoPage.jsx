import { useCallback, useEffect, useState } from 'react'
import { Alert, Button, Icon, Input, Modal, Spinner } from '@/shared/components/ui'
import { useToast } from '@/shared/context/ToastContext.jsx'
import { listarEstaciones } from '@/modules/carnets/api/carnetsApi'
import {
  actualizarEtiquetaArchivo,
  crearEtiquetaArchivo,
  desactivarEtiquetaArchivo,
  guardarAsignacionEtiquetas,
  listarAsignacionEtiquetas,
  listarCatalogoEtiquetas,
  reactivarEtiquetaArchivo,
} from '@/modules/archivo/api/etiquetasArchivoApi'
import { COLORES_ETIQUETA, clasesEtiqueta } from '@/modules/archivo/utils/coloresEtiqueta'

const FORMULARIO_VACIO = {
  codigo: '',
  nombre: '',
  descripcion: '',
  icono: 'label',
  color: 'primary',
  orden: 0,
}

/**
 * Administración de las etiquetas operativas de Archivo: catálogo y qué
 * etiquetas ve cada estación en /archivo/salida-hospital.
 */
export default function EtiquetasArchivoPage() {
  const { mostrarToast } = useToast()

  const [catalogo, setCatalogo] = useState([])
  const [estaciones, setEstaciones] = useState([])
  const [estacionId, setEstacionId] = useState('')
  const [seleccion, setSeleccion] = useState([])
  const [cargando, setCargando] = useState(true)
  const [cargandoAsignacion, setCargandoAsignacion] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)
  const [modal, setModal] = useState(null)
  const [formulario, setFormulario] = useState(FORMULARIO_VACIO)
  const [guardandoEtiqueta, setGuardandoEtiqueta] = useState(false)
  const [errorFormulario, setErrorFormulario] = useState(null)

  const cargarCatalogo = useCallback(async () => {
    setError(null)
    try {
      setCatalogo(await listarCatalogoEtiquetas({ estado: 'todos' }))
    } catch (fallo) {
      setError(fallo)
    }
  }, [])

  useEffect(() => {
    let cancelado = false
    setCargando(true)
    Promise.all([listarCatalogoEtiquetas({ estado: 'todos' }), listarEstaciones()])
      .then(([etiquetas, listaEstaciones]) => {
        if (cancelado) return
        setCatalogo(Array.isArray(etiquetas) ? etiquetas : [])
        setEstaciones(Array.isArray(listaEstaciones) ? listaEstaciones : [])
      })
      .catch((fallo) => {
        if (!cancelado) setError(fallo)
      })
      .finally(() => {
        if (!cancelado) setCargando(false)
      })
    return () => {
      cancelado = true
    }
  }, [])

  useEffect(() => {
    if (!estacionId) {
      setSeleccion([])
      return undefined
    }
    let cancelado = false
    setCargandoAsignacion(true)
    listarAsignacionEtiquetas(Number(estacionId))
      .then((asignadas) => {
        if (!cancelado) setSeleccion((asignadas ?? []).map((e) => e.id))
      })
      .catch((fallo) => {
        if (!cancelado) {
          setSeleccion([])
          mostrarToast({
            tone: 'error',
            title: 'No se pudieron cargar las etiquetas de la estación',
            message: fallo?.message,
          })
        }
      })
      .finally(() => {
        if (!cancelado) setCargandoAsignacion(false)
      })
    return () => {
      cancelado = true
    }
  }, [estacionId, mostrarToast])

  function abrirCrear() {
    setFormulario(FORMULARIO_VACIO)
    setErrorFormulario(null)
    setModal({ modo: 'crear' })
  }

  function abrirEditar(etiqueta) {
    setFormulario({
      codigo: etiqueta.codigo ?? '',
      nombre: etiqueta.nombre ?? '',
      descripcion: etiqueta.descripcion ?? '',
      icono: etiqueta.icono ?? 'label',
      color: etiqueta.color ?? 'primary',
      orden: etiqueta.orden ?? 0,
    })
    setErrorFormulario(null)
    setModal({ modo: 'editar', etiqueta })
  }

  async function guardarEtiqueta(evento) {
    evento.preventDefault()
    setGuardandoEtiqueta(true)
    setErrorFormulario(null)
    const datos = {
      ...formulario,
      orden: Number(formulario.orden) || 0,
    }
    try {
      if (modal?.modo === 'editar') {
        await actualizarEtiquetaArchivo(modal.etiqueta.id, datos)
      } else {
        await crearEtiquetaArchivo(datos)
      }
      setModal(null)
      await cargarCatalogo()
      mostrarToast({
        tone: 'success',
        title: modal?.modo === 'editar' ? 'Etiqueta actualizada' : 'Etiqueta creada',
      })
    } catch (fallo) {
      setErrorFormulario(fallo)
    } finally {
      setGuardandoEtiqueta(false)
    }
  }

  async function cambiarEstado(etiqueta) {
    try {
      if (etiqueta.activo) await desactivarEtiquetaArchivo(etiqueta.id)
      else await reactivarEtiquetaArchivo(etiqueta.id)
      await cargarCatalogo()
      mostrarToast({
        tone: 'success',
        title: etiqueta.activo ? 'Etiqueta desactivada' : 'Etiqueta reactivada',
      })
    } catch (fallo) {
      mostrarToast({
        tone: 'error',
        title: 'No se pudo actualizar la etiqueta',
        message: fallo?.message,
      })
    }
  }

  function alternarAsignada(id) {
    setSeleccion((actual) =>
      actual.some((valor) => String(valor) === String(id))
        ? actual.filter((valor) => String(valor) !== String(id))
        : [...actual, id],
    )
  }

  function mover(id, direccion) {
    setSeleccion((actual) => {
      const indice = actual.findIndex((valor) => String(valor) === String(id))
      if (indice < 0) return actual
      const destino = indice + direccion
      if (destino < 0 || destino >= actual.length) return actual
      const copia = [...actual]
      const [elemento] = copia.splice(indice, 1)
      copia.splice(destino, 0, elemento)
      return copia
    })
  }

  async function guardarAsignacion() {
    if (!estacionId) return
    setGuardando(true)
    const idsActivos = seleccion.filter((id) =>
      catalogo.some((e) => String(e.id) === String(id) && e.activo),
    )
    try {
      await guardarAsignacionEtiquetas(Number(estacionId), idsActivos)
      setSeleccion(idsActivos)
      mostrarToast({ tone: 'success', title: 'Etiquetas de la estación actualizadas' })
    } catch (fallo) {
      mostrarToast({
        tone: 'error',
        title: 'No se pudieron guardar las etiquetas',
        message: fallo?.message,
      })
    } finally {
      setGuardando(false)
    }
  }

  const activas = catalogo.filter((e) => e.activo)
  const seleccionadas = seleccion
    .map((id) => catalogo.find((e) => String(e.id) === String(id)))
    .filter(Boolean)
  const disponibles = activas.filter((e) => !seleccion.some((id) => String(id) === String(e.id)))

  return (
    <main className="mx-auto w-full max-w-7xl space-y-5 px-4 py-6">
      <header className="min-w-0">
        <h2 className="text-headline-md text-primary">Etiquetas de Archivo</h2>
        <p className="text-body-sm text-on-surface-variant">
          Configure el catálogo y las etiquetas que verá cada estación en la salida al Registro
          Médico. Los totales por etiqueta alimentan la estadística diaria.
        </p>
      </header>

      {error && (
        <Alert tone="error" title="No se pudieron cargar las etiquetas">
          {error.message}
        </Alert>
      )}

      {cargando ? (
        <Spinner label="Cargando etiquetas…" />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          <section
            aria-label="Catálogo de etiquetas"
            className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 shadow-card"
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-title-md text-on-surface">Catálogo</h3>
                <p className="text-label-sm text-on-surface-variant">
                  {activas.length} activa{activas.length === 1 ? '' : 's'} de {catalogo.length}
                </p>
              </div>
              <Button size="sm" onClick={abrirCrear}>
                <Icon name="add" className="text-[18px]" />
                Nueva etiqueta
              </Button>
            </div>

            {catalogo.length === 0 ? (
              <p className="text-body-sm text-on-surface-variant">
                Aún no hay etiquetas. Cree la primera para habilitarla en las estaciones.
              </p>
            ) : (
              <ul className="divide-y divide-outline-variant/60">
                {catalogo.map((etiqueta) => (
                  <li key={etiqueta.id} className="flex items-start gap-3 py-3">
                    <span
                      className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${clasesEtiqueta(
                        etiqueta.color,
                      )} ${etiqueta.activo ? '' : 'opacity-50'}`}
                    >
                      <Icon name={etiqueta.icono || 'label'} className="text-[20px]" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2 text-title-sm font-semibold text-on-surface">
                        {etiqueta.nombre}
                        <span
                          className={`rounded px-2 py-0.5 text-label-sm font-semibold ${
                            etiqueta.activo
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-200'
                              : 'bg-surface-container text-on-surface-variant'
                          }`}
                        >
                          {etiqueta.activo ? 'Activa' : 'Inactiva'}
                        </span>
                      </p>
                      <p className="font-mono text-label-sm text-on-surface-variant">
                        {etiqueta.codigo}
                      </p>
                      {etiqueta.descripcion && (
                        <p className="mt-0.5 text-label-sm text-on-surface-variant">
                          {etiqueta.descripcion}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-wrap justify-end gap-1">
                      <Button size="sm" variant="ghost" onClick={() => abrirEditar(etiqueta)}>
                        <Icon name="edit" className="text-[16px]" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant={etiqueta.activo ? 'danger' : 'secondary'}
                        onClick={() => cambiarEstado(etiqueta)}
                      >
                        {etiqueta.activo ? 'Desactivar' : 'Reactivar'}
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section
            aria-label="Etiquetas por estación"
            className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 shadow-card"
          >
            <h3 className="text-title-md text-on-surface">Etiquetas por estación</h3>
            <p className="mb-3 text-label-sm text-on-surface-variant">
              El orden define cómo aparecen en la pantalla de salida.
            </p>

            <label className="block space-y-1">
              <span className="block text-sm font-medium text-on-surface">Estación</span>
              <select
                value={estacionId}
                onChange={(evento) => setEstacionId(evento.target.value)}
                className="h-11 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="">Seleccione la estación…</option>
                {estaciones.map((estacion) => (
                  <option key={estacion.id} value={estacion.id}>
                    {estacion.codigo ? `${estacion.codigo} · ` : ''}
                    {estacion.nombre}
                  </option>
                ))}
              </select>
            </label>

            {!estacionId ? (
              <p className="mt-4 text-body-sm text-on-surface-variant">
                Seleccione una estación para configurar sus etiquetas.
              </p>
            ) : cargandoAsignacion ? (
              <div className="mt-4">
                <Spinner label="Cargando etiquetas de la estación…" />
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <div>
                  <p className="mb-2 text-label-md font-semibold uppercase tracking-wide text-on-surface-variant">
                    Habilitadas ({seleccionadas.length})
                  </p>
                  {seleccionadas.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-outline-variant px-3 py-4 text-body-sm text-on-surface-variant">
                      Esta estación no mostrará etiquetas en la salida.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {seleccionadas.map((etiqueta, indice) => (
                        <li
                          key={etiqueta.id}
                          className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2"
                        >
                          <Icon
                            name={etiqueta.icono || 'label'}
                            className="text-[18px] text-primary"
                          />
                          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-on-surface">
                            {etiqueta.nombre}
                          </span>
                          <button
                            type="button"
                            onClick={() => mover(etiqueta.id, -1)}
                            disabled={indice === 0}
                            aria-label={`Subir ${etiqueta.nombre}`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container disabled:opacity-40"
                          >
                            <Icon name="arrow_upward" className="text-[18px]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => mover(etiqueta.id, 1)}
                            disabled={indice === seleccionadas.length - 1}
                            aria-label={`Bajar ${etiqueta.nombre}`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant hover:bg-surface-container disabled:opacity-40"
                          >
                            <Icon name="arrow_downward" className="text-[18px]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => alternarAsignada(etiqueta.id)}
                            aria-label={`Quitar ${etiqueta.nombre}`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-error hover:bg-error-container"
                          >
                            <Icon name="remove_circle" className="text-[18px]" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {disponibles.length > 0 && (
                  <div>
                    <p className="mb-2 text-label-md font-semibold uppercase tracking-wide text-on-surface-variant">
                      Disponibles
                    </p>
                    <ul className="space-y-1.5">
                      {disponibles.map((etiqueta) => (
                        <li key={etiqueta.id}>
                          <button
                            type="button"
                            onClick={() => alternarAsignada(etiqueta.id)}
                            className="flex w-full items-center gap-2 rounded-lg border border-dashed border-outline-variant px-3 py-2 text-left text-sm text-on-surface-variant transition hover:border-primary hover:text-on-surface"
                          >
                            <Icon name="add_circle" className="text-[18px] text-primary" />
                            <span className="min-w-0 flex-1 truncate">{etiqueta.nombre}</span>
                            <span className="font-mono text-label-sm">{etiqueta.codigo}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button onClick={guardarAsignacion} disabled={guardando}>
                    <Icon name="save" className="text-[18px]" />
                    {guardando ? 'Guardando…' : 'Guardar etiquetas'}
                  </Button>
                </div>
              </div>
            )}
          </section>
        </div>
      )}

      <Modal
        open={Boolean(modal)}
        onClose={() => setModal(null)}
        title={modal?.modo === 'editar' ? 'Editar etiqueta' : 'Nueva etiqueta'}
        size="md"
      >
        <form onSubmit={guardarEtiqueta} className="space-y-3">
          {errorFormulario && (
            <Alert tone="error" title="No se pudo guardar la etiqueta">
              {errorFormulario.message}
            </Alert>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Nombre"
              name="nombre"
              value={formulario.nombre}
              onChange={(evento) =>
                setFormulario((actual) => ({ ...actual, nombre: evento.target.value }))
              }
              required
              maxLength={80}
            />
            <Input
              label="Código"
              name="codigo"
              value={formulario.codigo}
              onChange={(evento) =>
                setFormulario((actual) => ({ ...actual, codigo: evento.target.value }))
              }
              hint="Se normaliza a minúsculas y guiones bajos."
              required
              maxLength={40}
            />
          </div>

          <label className="block space-y-1">
            <span className="block text-sm font-medium text-on-surface">Descripción</span>
            <textarea
              value={formulario.descripcion}
              onChange={(evento) =>
                setFormulario((actual) => ({ ...actual, descripcion: evento.target.value }))
              }
              maxLength={255}
              rows={2}
              className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2.5 text-sm text-on-surface outline-none focus:border-primary-container focus:ring-2 focus:ring-secondary-fixed-dim"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-3">
            <Input
              label="Icono"
              name="icono"
              value={formulario.icono}
              onChange={(evento) =>
                setFormulario((actual) => ({ ...actual, icono: evento.target.value }))
              }
              hint="Nombre de Material Symbols."
              maxLength={40}
            />
            <label className="block space-y-1">
              <span className="block text-sm font-medium text-on-surface">Color</span>
              <select
                value={formulario.color}
                onChange={(evento) =>
                  setFormulario((actual) => ({ ...actual, color: evento.target.value }))
                }
                className="h-[42px] w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                {COLORES_ETIQUETA.map((color) => (
                  <option key={color} value={color}>
                    {color}
                  </option>
                ))}
              </select>
            </label>
            <Input
              label="Orden"
              name="orden"
              type="number"
              value={formulario.orden}
              onChange={(evento) =>
                setFormulario((actual) => ({ ...actual, orden: evento.target.value }))
              }
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setModal(null)} disabled={guardandoEtiqueta}>
              Cancelar
            </Button>
            <Button type="submit" disabled={guardandoEtiqueta}>
              {guardandoEtiqueta ? 'Guardando…' : 'Guardar'}
            </Button>
          </div>
        </form>
      </Modal>
    </main>
  )
}
