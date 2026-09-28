import { useCallback, useState } from 'react'
import Alert from '@/shared/components/ui/Alert.jsx'
import Button from '@/shared/components/ui/Button.jsx'
import Icon from '@/shared/components/ui/Icon.jsx'
import { useToast } from '@/shared/context/ToastContext.jsx'
import {
  actualizarEstacion,
  asignarSubespecialidadesEstacion,
  crearEstacion,
  desactivarEstacion,
  listarEstacionesAdmin,
  listarSubespecialidades,
} from '../api/administracionApi.js'
import useGestionCatalogo from '../hooks/useGestionCatalogo.js'
import EstacionForm from './EstacionForm.jsx'
import ModalCatalogo from './ModalCatalogo.jsx'
import ModalConfirmacion from './ModalConfirmacion.jsx'
import TablaCatalogo from './TablaCatalogo.jsx'

const MENSAJES = {
  crear: 'Estación creada',
  editar: 'Estación actualizada',
  desactivar: 'Estación desactivada',
}

export default function EstacionesTab() {
  const { mostrarToast } = useToast()
  const cargar = useCallback(() => listarEstacionesAdmin(), [])
  const gestion = useGestionCatalogo({
    cargar,
    crear: crearEstacion,
    actualizar: actualizarEstacion,
    desactivar: desactivarEstacion,
    mensajes: MENSAJES,
  })

  const [gestionando, setGestionando] = useState(null)
  const [subespecialidades, setSubespecialidades] = useState([])
  const [seleccionadas, setSeleccionadas] = useState([])
  const [cargandoSubs, setCargandoSubs] = useState(false)
  const [guardandoSubs, setGuardandoSubs] = useState(false)

  async function abrirSubespecialidades(estacion) {
    setGestionando(estacion)
    setSeleccionadas((estacion.subespecialidades ?? []).map((sub) => sub.id))
    setCargandoSubs(true)
    try {
      const lista = await listarSubespecialidades()
      setSubespecialidades(Array.isArray(lista) ? lista : [])
    } catch {
      setSubespecialidades([])
    } finally {
      setCargandoSubs(false)
    }
  }

  function cerrarSubespecialidades() {
    setGestionando(null)
    setSubespecialidades([])
    setSeleccionadas([])
  }

  function alternarSub(id) {
    setSeleccionadas((actual) =>
      actual.includes(id) ? actual.filter((valor) => valor !== id) : [...actual, id],
    )
  }

  async function guardarSubespecialidades(evento) {
    evento.preventDefault()
    if (!gestionando) return
    if (seleccionadas.length === 0) {
      mostrarToast({ title: 'Seleccione al menos una subespecialidad', tone: 'warning' })
      return
    }
    setGuardandoSubs(true)
    try {
      await asignarSubespecialidadesEstacion(gestionando.id, seleccionadas)
      mostrarToast({ title: 'Subespecialidades actualizadas', tone: 'success' })
      cerrarSubespecialidades()
      await gestion.recargar()
    } catch (fallo) {
      mostrarToast({
        title: 'No se pudo asignar',
        message: fallo?.message || 'Verifique las subespecialidades.',
        tone: 'error',
      })
    } finally {
      setGuardandoSubs(false)
    }
  }

  const COLUMNAS = [
    { key: 'codigo', label: 'Código' },
    { key: 'nombre', label: 'Estación' },
    { key: 'ubicacion', label: 'Ubicación' },
    {
      key: 'subespecialidades',
      label: 'Subespecialidades',
      render: (fila) => (
        <button
          type="button"
          onClick={() => abrirSubespecialidades(fila)}
          className="text-hro-blue hover:underline"
        >
          {fila.subespecialidades?.length ?? 0} — Gestionar
        </button>
      ),
    },
    { key: 'activo', label: 'Estado' },
  ]

  const tituloModal =
    gestion.modal?.modo === 'crear'
      ? 'Nueva estación'
      : gestion.modal?.modo === 'editar'
        ? 'Editar estación'
        : 'Detalle de la estación'

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          Puestos de enfermería. Cada estación agrupa las subespecialidades de su área y su tablero
          muestra solo esas.
        </p>
        <Button onClick={gestion.abrirCrear}>
          <Icon name="add" className="text-[18px]" />
          Agregar
        </Button>
      </div>

      <Alert tone="info">
        La subespecialidad pertenece a una sola estación (pertenencia única). Si intenta asignarla a
        otra, el backend rechazará el cambio.
      </Alert>

      <TablaCatalogo
        columnas={COLUMNAS}
        datos={gestion.datos}
        cargando={gestion.cargando}
        error={gestion.error}
        onReintentar={gestion.recargar}
        onVer={gestion.abrirVer}
        onEditar={gestion.abrirEditar}
        onDesactivar={gestion.solicitarDesactivar}
        vacioTitulo="Sin estaciones registradas"
        vacioDescripcion="Agregue la primera estación de enfermería."
      />

      <ModalCatalogo
        abierto={Boolean(gestion.modal)}
        modo={gestion.modal?.modo}
        titulo={tituloModal}
        onCerrar={gestion.cerrarModal}
        guardando={gestion.guardando}
        textoGuardar={gestion.modal?.modo === 'editar' ? 'Guardar cambios' : 'Crear'}
      >
        {gestion.modal && (
          <EstacionForm
            valoresIniciales={gestion.modal.registro}
            modo={gestion.modal.modo}
            soloLectura={gestion.modal.modo === 'consultar'}
            onSubmit={gestion.guardar}
          />
        )}
      </ModalCatalogo>

      <ModalCatalogo
        abierto={Boolean(gestionando)}
        modo="editar"
        titulo={`Subespecialidades — ${gestionando?.nombre ?? ''}`}
        onCerrar={cerrarSubespecialidades}
        guardando={guardandoSubs}
        textoGuardar="Guardar"
      >
        <form id="form-catalogo" onSubmit={guardarSubespecialidades} className="space-y-3">
          <p className="text-sm text-slate-500">
            Seleccione las subespecialidades que atenderá esta estación.
          </p>
          {cargandoSubs && <p className="text-sm text-slate-500">Cargando subespecialidades…</p>}
          {!cargandoSubs && subespecialidades.length === 0 && (
            <p className="text-sm text-slate-500">No hay subespecialidades disponibles.</p>
          )}
          {!cargandoSubs &&
            subespecialidades.map((sub) => (
              <label
                key={sub.id}
                className="flex items-center gap-2 rounded border border-slate-200 p-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={seleccionadas.includes(sub.id)}
                  onChange={() => alternarSub(sub.id)}
                />
                <span>{sub.nombre}</span>
                {sub.especialidadNombre && (
                  <span className="ml-auto text-xs text-slate-400">{sub.especialidadNombre}</span>
                )}
              </label>
            ))}
        </form>
      </ModalCatalogo>

      <ModalConfirmacion
        abierto={Boolean(gestion.porDesactivar)}
        titulo="Desactivar estación"
        mensaje={`¿Deseas desactivar esta estación? Estación: ${
          gestion.porDesactivar?.nombre ?? ''
        }`}
        onConfirmar={gestion.confirmarDesactivar}
        onCancelar={gestion.cancelarDesactivar}
        procesando={gestion.desactivando}
      />
    </div>
  )
}
