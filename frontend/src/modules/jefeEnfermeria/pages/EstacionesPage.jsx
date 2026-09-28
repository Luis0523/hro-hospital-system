import { useCallback, useEffect, useMemo, useState } from 'react'
import Alert from '@/shared/components/ui/Alert.jsx'
import Button from '@/shared/components/ui/Button.jsx'
import Spinner from '@/shared/components/ui/Spinner.jsx'
import Modal from '@/shared/components/ui/Modal.jsx'
import Icon from '@/shared/components/ui/Icon.jsx'
import { useToast } from '@/shared/context/ToastContext.jsx'
import {
  actualizarEstacion,
  asignarSubespecialidadesEstacion,
  crearEstacion,
  desactivarEstacion,
  listarAccesosEstacion,
  listarEstaciones,
  listarSubespecialidades,
} from '../api/jefeEnfermeriaApi'

const claseCampo =
  'h-11 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-body-md text-on-surface outline-none focus:border-primary-container focus:ring-2 focus:ring-secondary-fixed-dim'

function esHoy(iso) {
  if (!iso) return false
  return new Date(iso).toDateString() === new Date().toDateString()
}

function horaCorta(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })
}

export default function EstacionesPage() {
  const { mostrarToast } = useToast()

  const [estaciones, setEstaciones] = useState([])
  const [accesos, setAccesos] = useState({})
  const [subespecialidades, setSubespecialidades] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  const [modalEstacion, setModalEstacion] = useState(null)
  const [form, setForm] = useState({ codigo: '', nombre: '', ubicacion: '' })
  const [guardando, setGuardando] = useState(false)

  const [gestionando, setGestionando] = useState(null)
  const [seleccionadas, setSeleccionadas] = useState([])

  const [porDesactivar, setPorDesactivar] = useState(null)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const [lista, subs] = await Promise.all([listarEstaciones(), listarSubespecialidades()])
      const estacionesLista = Array.isArray(lista) ? lista : []
      setEstaciones(estacionesLista)
      setSubespecialidades(Array.isArray(subs) ? subs : [])

      const pares = await Promise.all(
        estacionesLista.map(async (e) => [e.id, await listarAccesosEstacion(e.id)]),
      )
      setAccesos(Object.fromEntries(pares))
    } catch (fallo) {
      setError(fallo?.message || 'No se pudieron cargar las estaciones.')
      setEstaciones([])
      setAccesos({})
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargar()
  }, [cargar])

  const resumen = useMemo(() => {
    const ahora = (id) => (accesos[id] ?? []).filter((a) => !a.salidoEn)
    const movimientosHoy = (id) => (accesos[id] ?? []).filter((a) => esHoy(a.entradoEn)).length
    const cubiertas = estaciones.filter((e) => ahora(e.id).length > 0).length
    return { ahora, movimientosHoy, cubiertas }
  }, [accesos, estaciones])

  function abrirCrear() {
    setForm({ codigo: '', nombre: '', ubicacion: '' })
    setModalEstacion({ modo: 'crear', registro: null })
  }

  function abrirEditar(estacion) {
    setForm({
      codigo: estacion.codigo ?? '',
      nombre: estacion.nombre ?? '',
      ubicacion: estacion.ubicacion ?? '',
    })
    setModalEstacion({ modo: 'editar', registro: estacion })
  }

  async function guardarEstacion(evento) {
    evento.preventDefault()
    const codigo = form.codigo.trim()
    const nombre = form.nombre.trim()
    if (!codigo || !nombre) {
      setError('El código y el nombre son obligatorios.')
      return
    }
    setGuardando(true)
    try {
      if (modalEstacion?.modo === 'editar') {
        await actualizarEstacion(modalEstacion.registro.id, {
          codigo,
          nombre,
          ubicacion: form.ubicacion.trim() || null,
          activo: modalEstacion.registro.activo,
        })
      } else {
        await crearEstacion({ codigo, nombre, ubicacion: form.ubicacion.trim() || null })
      }
      setModalEstacion(null)
      await cargar()
      mostrarToast({
        tone: 'success',
        title: modalEstacion?.modo === 'editar' ? 'Estación actualizada' : 'Estación creada',
      })
    } catch (fallo) {
      setError(fallo?.message || 'No se pudo guardar la estación.')
    } finally {
      setGuardando(false)
    }
  }

  async function confirmarDesactivar() {
    if (!porDesactivar) return
    setGuardando(true)
    try {
      await desactivarEstacion(porDesactivar.id)
      setPorDesactivar(null)
      await cargar()
      mostrarToast({ tone: 'info', title: 'Estación desactivada' })
    } catch (fallo) {
      setError(fallo?.message || 'No se pudo desactivar la estación.')
    } finally {
      setGuardando(false)
    }
  }

  function abrirGestion(estacion) {
    setGestionando(estacion)
    setSeleccionadas((estacion.subespecialidades ?? []).map((s) => s.id))
  }

  function alternarSub(id) {
    setSeleccionadas((actual) =>
      actual.includes(id) ? actual.filter((v) => v !== id) : [...actual, id],
    )
  }

  async function guardarSubespecialidades(evento) {
    evento.preventDefault()
    if (!gestionando) return
    if (seleccionadas.length === 0) {
      setError('Seleccione al menos una subespecialidad.')
      return
    }
    setGuardando(true)
    try {
      await asignarSubespecialidadesEstacion(gestionando.id, seleccionadas)
      setGestionando(null)
      await cargar()
      mostrarToast({ tone: 'success', title: 'Subespecialidades actualizadas' })
    } catch (fallo) {
      setError(fallo?.message || 'No se pudieron asignar las subespecialidades.')
    } finally {
      setGuardando(false)
    }
  }

  function enviarEstacion() {
    document.getElementById('form-estacion')?.requestSubmit()
  }

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-headline-lg text-on-surface">Estaciones de Enfermería</h2>
          <p className="text-body-md text-on-surface-variant">
            Subespecialidades a cargo de cada estación y cobertura del personal.
          </p>
        </div>
        <Button onClick={abrirCrear}>
          <Icon name="add" className="text-[18px]" />
          Nueva estación
        </Button>
      </header>

      {error && (
        <Alert tone="error" title="Atención">
          {error}
        </Alert>
      )}

      {cargando ? (
        <div className="flex justify-center py-16">
          <Spinner label="Cargando estaciones…" />
        </div>
      ) : estaciones.length === 0 ? (
        <p className="rounded-lg border border-dashed border-outline-variant bg-surface-container-low px-3 py-8 text-center text-body-md text-on-surface-variant">
          No hay estaciones configuradas.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {estaciones.map((estacion) => {
              return (
                <article
                  key={estacion.id}
                  data-testid={`estacion-${estacion.codigo}`}
                  className="flex flex-col gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-card"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex items-center gap-2">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-container text-on-primary">
                        <Icon name="point_of_sale" className="text-[20px]" />
                      </span>
                      <span>
                        <span className="block text-title-md font-semibold text-on-surface">
                          {estacion.codigo}
                        </span>
                        <span className="block text-label-sm uppercase text-on-surface-variant">
                          {estacion.ubicacion ?? 'Sin ubicación'}
                        </span>
                      </span>
                    </span>
                    <span
                      className={`rounded px-2 py-0.5 text-label-sm font-semibold ${
                        estacion.activo
                          ? 'bg-secondary-fixed text-on-secondary-container'
                          : 'bg-surface-container-high text-on-surface-variant'
                      }`}
                    >
                      {estacion.activo ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>

                  <p className="text-body-md font-semibold text-on-surface">{estacion.nombre}</p>

                  <p className="text-body-sm text-on-surface-variant">
                    {estacion.subespecialidades?.length ?? 0} subespecialidad(es)
                  </p>

                  <div className="mt-auto flex flex-wrap gap-2">
                    <Button size="sm" variant="secondary" onClick={() => abrirEditar(estacion)}>
                      Editar
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => abrirGestion(estacion)}>
                      Subespecialidades
                    </Button>
                    {estacion.activo && (
                      <Button size="sm" variant="danger" onClick={() => setPorDesactivar(estacion)}>
                        Desactivar
                      </Button>
                    )}
                  </div>
                </article>
              )
            })}
          </div>

          <section className="space-y-3 rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="flex items-center gap-2 text-title-md uppercase text-on-surface">
                <Icon name="groups" className="text-[20px] text-primary" />
                Cobertura y rotación de hoy
              </h3>
              <span className="rounded bg-surface-container px-2 py-0.5 text-label-sm text-on-surface-variant">
                {resumen.cubiertas} de {estaciones.length} con personal
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {estaciones.map((estacion) => {
                const enServicio = resumen.ahora(estacion.id)
                return (
                  <div
                    key={estacion.id}
                    className="rounded-lg border border-outline-variant bg-surface-container-low p-3"
                  >
                    <p className="text-label-sm uppercase tracking-wide text-on-surface-variant">
                      {estacion.codigo}
                    </p>
                    <p className="mt-1 text-metric-sub text-primary">
                      {enServicio.length > 0 ? `${enServicio.length} en servicio` : 'Sin personal'}
                    </p>
                    {enServicio.length > 0 ? (
                      <ul className="mt-1 space-y-0.5 text-body-sm text-on-surface">
                        {enServicio.map((acceso) => (
                          <li key={acceso.id} className="flex items-center justify-between gap-2">
                            <span className="truncate">{acceso.usuarioNombre}</span>
                            <span className="shrink-0 text-label-sm text-on-surface-variant">
                              {horaCorta(acceso.entradoEn)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-1 text-body-sm text-on-surface-variant">
                        Nadie ha ingresado aún.
                      </p>
                    )}
                    <p className="mt-2 text-label-sm text-on-surface-variant">
                      Movimientos hoy: {resumen.movimientosHoy(estacion.id)}
                    </p>
                  </div>
                )
              })}
            </div>
          </section>
        </>
      )}

      {/* Modal estación */}
      <Modal
        open={Boolean(modalEstacion)}
        onClose={() => setModalEstacion(null)}
        title={modalEstacion?.modo === 'editar' ? 'Editar estación' : 'Nueva estación'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalEstacion(null)} disabled={guardando}>
              Cancelar
            </Button>
            <Button onClick={enviarEstacion} disabled={guardando}>
              {guardando ? 'Guardando…' : modalEstacion?.modo === 'editar' ? 'Guardar' : 'Crear'}
            </Button>
          </>
        }
      >
        <form id="form-estacion" onSubmit={guardarEstacion} className="space-y-4" noValidate>
          <label className="flex flex-col gap-1">
            <span className="text-label-sm uppercase tracking-wide text-on-surface-variant">
              Código
            </span>
            <input
              value={form.codigo}
              onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value }))}
              placeholder="EST-05"
              className={claseCampo}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-label-sm uppercase tracking-wide text-on-surface-variant">
              Nombre
            </span>
            <input
              value={form.nombre}
              onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              placeholder="Medicina y Cardiología"
              className={claseCampo}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-label-sm uppercase tracking-wide text-on-surface-variant">
              Ubicación (opcional)
            </span>
            <input
              value={form.ubicacion}
              onChange={(e) => setForm((f) => ({ ...f, ubicacion: e.target.value }))}
              placeholder="Nivel 1"
              className={claseCampo}
            />
          </label>
        </form>
      </Modal>

      {/* Modal subespecialidades */}
      <Modal
        open={Boolean(gestionando)}
        onClose={() => setGestionando(null)}
        title={`Subespecialidades — ${gestionando?.codigo ?? ''}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setGestionando(null)} disabled={guardando}>
              Cancelar
            </Button>
            <Button
              onClick={() => document.getElementById('form-estacion-subs')?.requestSubmit()}
              disabled={guardando}
            >
              {guardando ? 'Guardando…' : 'Guardar'}
            </Button>
          </>
        }
      >
        <form id="form-estacion-subs" onSubmit={guardarSubespecialidades} className="space-y-2">
          <p className="text-body-sm text-on-surface-variant">
            La subespecialidad pertenece a una sola estación (pertenencia única).
          </p>
          {subespecialidades.map((sub) => (
            <label
              key={sub.id}
              className="flex items-center gap-2 rounded border border-outline-variant p-2 text-body-sm text-on-surface"
            >
              <input
                type="checkbox"
                checked={seleccionadas.includes(sub.id)}
                onChange={() => alternarSub(sub.id)}
              />
              <span>{sub.nombre}</span>
              <span className="ml-auto text-label-sm text-on-surface-variant">
                {sub.especialidadNombre}
              </span>
            </label>
          ))}
        </form>
      </Modal>

      {/* Confirmar desactivar */}
      <Modal
        open={Boolean(porDesactivar)}
        onClose={() => setPorDesactivar(null)}
        title="Desactivar estación"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPorDesactivar(null)} disabled={guardando}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={confirmarDesactivar} disabled={guardando}>
              Sí, desactivar
            </Button>
          </>
        }
      >
        <p className="text-body-md text-on-surface-variant">
          ¿Desactivar <b>{porDesactivar?.codigo}</b> ({porDesactivar?.nombre})?
        </p>
      </Modal>
    </section>
  )
}
