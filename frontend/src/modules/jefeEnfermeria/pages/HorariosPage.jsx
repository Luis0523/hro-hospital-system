import { useCallback, useEffect, useState } from 'react'
import Alert from '@/shared/components/ui/Alert.jsx'
import Button from '@/shared/components/ui/Button.jsx'
import Spinner from '@/shared/components/ui/Spinner.jsx'
import Modal from '@/shared/components/ui/Modal.jsx'
import Icon from '@/shared/components/ui/Icon.jsx'
import { useToast } from '@/shared/context/ToastContext.jsx'
import {
  actualizarHorario,
  crearHorario,
  desactivarHorario,
  listarHorarios,
  listarSubespecialidades,
  reactivarHorario,
} from '../api/jefeEnfermeriaApi'
import HorarioForm from '../components/HorarioForm.jsx'

function hora(valor) {
  return String(valor ?? '').slice(0, 5)
}

export default function HorariosPage() {
  const { mostrarToast } = useToast()

  const [subespecialidades, setSubespecialidades] = useState([])
  const [subespecialidadId, setSubespecialidadId] = useState('')
  const [horarios, setHorarios] = useState([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)
  const [modal, setModal] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [porDesactivar, setPorDesactivar] = useState(null)

  useEffect(() => {
    listarSubespecialidades()
      .then((lista) => {
        const items = Array.isArray(lista) ? lista : []
        setSubespecialidades(items)
        if (items.length > 0) setSubespecialidadId((actual) => actual || String(items[0].id))
      })
      .catch(() => setSubespecialidades([]))
  }, [])

  const cargarHorarios = useCallback(async () => {
    if (!subespecialidadId) {
      setHorarios([])
      return
    }
    setCargando(true)
    setError(null)
    try {
      const lista = await listarHorarios(subespecialidadId)
      setHorarios(Array.isArray(lista) ? lista : [])
    } catch (fallo) {
      setError(fallo?.message || 'No se pudieron cargar los horarios.')
      setHorarios([])
    } finally {
      setCargando(false)
    }
  }, [subespecialidadId])

  useEffect(() => {
    cargarHorarios()
  }, [cargarHorarios])

  async function guardar(valores) {
    if (!modal) return
    setGuardando(true)
    try {
      if (modal.modo === 'crear') {
        await crearHorario({ subespecialidadId: Number(subespecialidadId), ...valores })
      } else {
        await actualizarHorario(modal.registro.id, valores)
      }
      setModal(null)
      await cargarHorarios()
      mostrarToast({
        tone: 'success',
        title: modal.modo === 'crear' ? 'Horario creado' : 'Horario actualizado',
      })
    } catch (fallo) {
      setError(fallo?.message || 'No se pudo guardar el horario.')
    } finally {
      setGuardando(false)
    }
  }

  async function confirmarDesactivar() {
    if (!porDesactivar) return
    setGuardando(true)
    try {
      await desactivarHorario(porDesactivar.id)
      setPorDesactivar(null)
      await cargarHorarios()
      mostrarToast({ tone: 'info', title: 'Horario desactivado' })
    } catch (fallo) {
      setError(fallo?.message || 'No se pudo desactivar el horario.')
    } finally {
      setGuardando(false)
    }
  }

  async function reactivar(horario) {
    try {
      await reactivarHorario(horario.id)
      await cargarHorarios()
      mostrarToast({ tone: 'success', title: 'Horario reactivado' })
    } catch (fallo) {
      setError(fallo?.message || 'No se pudo reactivar el horario.')
    }
  }

  function enviarFormulario() {
    const formulario = document.getElementById('form-horario')
    if (formulario?.requestSubmit) formulario.requestSubmit()
  }

  const subActual = subespecialidades.find((s) => String(s.id) === String(subespecialidadId))
  const tituloModal =
    modal?.modo === 'crear'
      ? 'Nuevo horario'
      : modal?.modo === 'editar'
        ? 'Editar horario'
        : 'Detalle del horario'

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-headline-lg text-on-surface">Horario por subespecialidad</h2>
          <p className="text-body-md text-on-surface-variant">
            Días, horas, capacidad y duración de consulta por subespecialidad.
          </p>
        </div>
        <Button
          onClick={() => setModal({ modo: 'crear', registro: null })}
          disabled={!subespecialidadId}
        >
          <Icon name="add" className="text-[18px]" />
          Nuevo horario
        </Button>
      </header>

      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest p-3 shadow-card">
        <label className="flex flex-col gap-1">
          <span className="text-label-sm uppercase tracking-wide text-on-surface-variant">
            Subespecialidad
          </span>
          <select
            value={subespecialidadId}
            onChange={(evento) => setSubespecialidadId(evento.target.value)}
            className="h-10 min-w-[16rem] rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-body-md text-on-surface outline-none focus:border-primary-container focus:ring-2 focus:ring-secondary-fixed-dim"
          >
            {subespecialidades.length === 0 && <option value="">Sin subespecialidades</option>}
            {subespecialidades.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.nombre} — {sub.especialidadNombre}
              </option>
            ))}
          </select>
        </label>
        {subActual && (
          <span className="rounded-lg bg-surface-container px-3 py-1.5 text-label-sm uppercase tracking-wide text-on-surface-variant">
            {horarios.length} día(s) configurado(s)
          </span>
        )}
      </div>

      {error && (
        <Alert tone="error" title="Atención">
          {error}
        </Alert>
      )}

      {cargando ? (
        <div className="flex justify-center py-16">
          <Spinner label="Cargando horarios…" />
        </div>
      ) : horarios.length === 0 ? (
        <p className="rounded-lg border border-dashed border-outline-variant bg-surface-container-low px-3 py-8 text-center text-body-md text-on-surface-variant">
          Esta subespecialidad no tiene horarios configurados.
        </p>
      ) : (
        <>
          {/* Escritorio */}
          <div className="hidden overflow-x-auto rounded-xl border border-outline-variant bg-surface-container-lowest xl:block">
            <table className="w-full">
              <thead className="bg-surface-container">
                <tr className="text-left text-label-sm uppercase tracking-wide text-on-surface-variant">
                  <th className="px-4 py-2">Día</th>
                  <th className="px-4 py-2">Horario</th>
                  <th className="px-4 py-2">Capacidad</th>
                  <th className="px-4 py-2">Duración</th>
                  <th className="px-4 py-2">Estado</th>
                  <th className="px-4 py-2 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {horarios.map((h) => (
                  <tr key={h.id} className="text-body-md text-on-surface">
                    <td className="px-4 py-3 font-semibold">{h.diaSemanaNombre}</td>
                    <td className="px-4 py-3 tabular-nums">
                      {hora(h.horaInicio)} – {hora(h.horaFin)}
                    </td>
                    <td className="px-4 py-3 tabular-nums">{h.capacidadMaxima}</td>
                    <td className="px-4 py-3 tabular-nums">{h.duracionConsultaMinutos} min</td>
                    <td className="px-4 py-3">
                      <Estado activo={h.activo} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="secondary" onClick={() => setModal({ modo: 'editar', registro: h })}>
                          Editar
                        </Button>
                        {h.activo ? (
                          <Button size="sm" variant="danger" onClick={() => setPorDesactivar(h)}>
                            Desactivar
                          </Button>
                        ) : (
                          <Button size="sm" variant="secondary" onClick={() => reactivar(h)}>
                            Reactivar
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Móvil */}
          <div className="space-y-3 xl:hidden">
            {horarios.map((h) => (
              <div
                key={h.id}
                className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-card"
              >
                <div className="flex items-center justify-between">
                  <span className="text-title-md font-semibold text-on-surface">
                    {h.diaSemanaNombre}
                  </span>
                  <Estado activo={h.activo} />
                </div>
                <p className="mt-1 text-body-md text-on-surface-variant">
                  {hora(h.horaInicio)} – {hora(h.horaFin)} · {h.capacidadMaxima} cupos ·{' '}
                  {h.duracionConsultaMinutos} min
                </p>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setModal({ modo: 'editar', registro: h })}>
                    Editar
                  </Button>
                  {h.activo ? (
                    <Button size="sm" variant="danger" onClick={() => setPorDesactivar(h)}>
                      Desactivar
                    </Button>
                  ) : (
                    <Button size="sm" variant="secondary" onClick={() => reactivar(h)}>
                      Reactivar
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modal crear/editar */}
      <Modal
        open={Boolean(modal)}
        onClose={() => setModal(null)}
        title={tituloModal}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(null)} disabled={guardando}>
              Cancelar
            </Button>
            <Button onClick={enviarFormulario} disabled={guardando}>
              {guardando ? 'Guardando…' : modal?.modo === 'editar' ? 'Guardar cambios' : 'Crear'}
            </Button>
          </>
        }
      >
        {modal && <HorarioForm valoresIniciales={modal.registro} onSubmit={guardar} />}
      </Modal>

      {/* Confirmar desactivar */}
      <Modal
        open={Boolean(porDesactivar)}
        onClose={() => setPorDesactivar(null)}
        title="Desactivar horario"
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
          ¿Desactivar el horario del <b>{porDesactivar?.diaSemanaNombre}</b>? Se podrá reactivar
          después.
        </p>
      </Modal>
    </section>
  )
}

function Estado({ activo }) {
  return (
    <span
      className={`rounded px-2 py-0.5 text-label-sm font-semibold ${
        activo
          ? 'bg-secondary-fixed text-on-secondary-container'
          : 'bg-surface-container-high text-on-surface-variant'
      }`}
    >
      {activo ? 'Activo' : 'Inactivo'}
    </span>
  )
}
