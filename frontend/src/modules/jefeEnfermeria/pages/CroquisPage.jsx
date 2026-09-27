import { useCallback, useEffect, useMemo, useState } from 'react'
import Alert from '@/shared/components/ui/Alert.jsx'
import Button from '@/shared/components/ui/Button.jsx'
import Spinner from '@/shared/components/ui/Spinner.jsx'
import Modal from '@/shared/components/ui/Modal.jsx'
import Icon from '@/shared/components/ui/Icon.jsx'
import { hoyIso } from '@/shared/utils/fecha'
import {
  eliminarAsignacion,
  guardarAsignacion,
  listarSubespecialidades,
  listarVistaAsignacion,
} from '../api/jefeEnfermeriaApi'
import TarjetaSala from '../components/TarjetaSala.jsx'

const NIVELES = [1, 2, 3, 4]

export default function CroquisPage() {
  const [fecha, setFecha] = useState(hoyIso())
  const [nivel, setNivel] = useState('')
  const [items, setItems] = useState([])
  const [subespecialidades, setSubespecialidades] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [seleccion, setSeleccion] = useState(null)
  const [subElegida, setSubElegida] = useState('')
  const [guardando, setGuardando] = useState(false)

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const data = await listarVistaAsignacion({ fecha, nivel: nivel || undefined })
      setItems(Array.isArray(data) ? data : [])
    } catch (fallo) {
      setError(fallo?.message || 'No se pudo cargar la asignación del día.')
      setItems([])
    } finally {
      setCargando(false)
    }
  }, [fecha, nivel])

  useEffect(() => {
    cargar()
  }, [cargar])

  useEffect(() => {
    listarSubespecialidades()
      .then((lista) => setSubespecialidades(Array.isArray(lista) ? lista : []))
      .catch(() => setSubespecialidades([]))
  }, [])

  const resumen = useMemo(() => {
    const total = items.length
    const asignadas = items.filter((item) => item.asignacionId).length
    return { total, asignadas, sinAsignar: total - asignadas }
  }, [items])

  function abrir(item) {
    setSeleccion(item)
    setSubElegida(item.subespecialidadId ? String(item.subespecialidadId) : '')
  }

  function cerrar() {
    setSeleccion(null)
    setSubElegida('')
  }

  async function guardar() {
    if (!seleccion || !subElegida) return
    setGuardando(true)
    try {
      await guardarAsignacion({
        espacioFisicoId: seleccion.espacioFisicoId,
        subespecialidadId: Number(subElegida),
        fecha,
      })
      cerrar()
      await cargar()
    } catch (fallo) {
      setError(fallo?.message || 'No se pudo guardar la asignación.')
    } finally {
      setGuardando(false)
    }
  }

  async function quitar() {
    if (!seleccion?.asignacionId) return
    setGuardando(true)
    try {
      await eliminarAsignacion(seleccion.asignacionId)
      cerrar()
      await cargar()
    } catch (fallo) {
      setError(fallo?.message || 'No se pudo quitar la asignación.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-headline-lg text-on-surface">Croquis del Día</h2>
          <p className="text-body-md text-on-surface-variant">
            Asignación de subespecialidad por espacio físico para la fecha seleccionada.
          </p>
        </div>
      </header>

      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest p-3 shadow-card">
        <label className="flex flex-col gap-1">
          <span className="text-label-sm uppercase tracking-wide text-on-surface-variant">
            Fecha
          </span>
          <input
            type="date"
            value={fecha}
            onChange={(evento) => setFecha(evento.target.value)}
            className="h-10 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-body-md text-on-surface outline-none focus:border-primary-container focus:ring-2 focus:ring-secondary-fixed-dim"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-label-sm uppercase tracking-wide text-on-surface-variant">
            Nivel
          </span>
          <select
            value={nivel}
            onChange={(evento) => setNivel(evento.target.value)}
            className="h-10 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-body-md text-on-surface outline-none focus:border-primary-container focus:ring-2 focus:ring-secondary-fixed-dim"
          >
            <option value="">Todos</option>
            {NIVELES.map((numero) => (
              <option key={numero} value={numero}>
                Nivel {numero}
              </option>
            ))}
          </select>
        </label>

        <Button variant="secondary" onClick={() => setFecha(hoyIso())}>
          <Icon name="today" className="text-[18px]" />
          Hoy
        </Button>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Contador etiqueta="Salas" valor={resumen.total} />
          <Contador etiqueta="Asignadas" valor={resumen.asignadas} tono="ok" />
          <Contador etiqueta="Sin asignar" valor={resumen.sinAsignar} tono="warn" />
        </div>
      </div>

      {error && <Alert tone="error" title="Atención">{error}</Alert>}

      {cargando ? (
        <div className="flex justify-center py-16">
          <Spinner label="Cargando asignación del día…" />
        </div>
      ) : items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-outline-variant bg-surface-container-low px-3 py-8 text-center text-body-md text-on-surface-variant">
          No hay espacios físicos para esta fecha/nivel.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {items.map((item) => (
            <TarjetaSala key={item.espacioFisicoId} item={item} onClick={abrir} />
          ))}
        </div>
      )}

      <Modal
        open={Boolean(seleccion)}
        onClose={cerrar}
        title={seleccion ? `Sala ${seleccion.numero}` : ''}
        footer={
          <>
            {seleccion?.asignacionId && (
              <Button variant="danger" onClick={quitar} disabled={guardando}>
                <Icon name="delete" className="text-[18px]" />
                Quitar
              </Button>
            )}
            <Button variant="secondary" onClick={cerrar} disabled={guardando}>
              Cancelar
            </Button>
            <Button onClick={guardar} disabled={guardando || !subElegida}>
              {guardando ? 'Guardando…' : 'Guardar'}
            </Button>
          </>
        }
      >
        {seleccion && (
          <div className="space-y-3">
            <p className="text-body-sm text-on-surface-variant">
              Nivel {seleccion.nivel} · {fecha}
            </p>
            <label className="flex flex-col gap-1">
              <span className="text-label-sm uppercase tracking-wide text-on-surface-variant">
                Subespecialidad
              </span>
              <select
                value={subElegida}
                onChange={(evento) => setSubElegida(evento.target.value)}
                className="h-11 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-body-md text-on-surface outline-none focus:border-primary-container focus:ring-2 focus:ring-secondary-fixed-dim"
              >
                <option value="">Seleccione una subespecialidad…</option>
                {subespecialidades.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.nombre} — {sub.especialidadNombre}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
      </Modal>
    </section>
  )
}

function Contador({ etiqueta, valor, tono = 'neutral' }) {
  const estilos = {
    neutral: 'bg-surface-container text-on-surface-variant',
    ok: 'bg-secondary-fixed text-on-secondary-container',
    warn: 'bg-tertiary-container text-on-tertiary-container',
  }
  return (
    <span
      className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-label-sm uppercase tracking-wide ${estilos[tono]}`}
    >
      {etiqueta}
      <b className="text-title-md">{valor}</b>
    </span>
  )
}
