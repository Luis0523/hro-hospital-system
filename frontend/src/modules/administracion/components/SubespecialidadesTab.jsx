import { useCallback, useEffect, useState } from 'react'
import Button from '@/shared/components/ui/Button.jsx'
import Icon from '@/shared/components/ui/Icon.jsx'
import Select from '@/shared/components/ui/Select.jsx'
import {
  actualizarSubespecialidad,
  crearSubespecialidad,
  desactivarSubespecialidad,
  listarEspecialidades,
  listarSubespecialidades,
} from '../api/administracionApi.js'
import useGestionCatalogo from '../hooks/useGestionCatalogo.js'
import ModalCatalogo from './ModalCatalogo.jsx'
import ModalConfirmacion from './ModalConfirmacion.jsx'
import SubespecialidadForm from './SubespecialidadForm.jsx'
import TablaCatalogo from './TablaCatalogo.jsx'

const COLUMNAS = [
  { key: 'nombre', label: 'Subespecialidad' },
  { key: 'especialidadNombre', label: 'Especialidad' },
  { key: 'activo', label: 'Estado' },
]

const MENSAJES = {
  crear: 'Subespecialidad creada',
  editar: 'Subespecialidad actualizada',
  desactivar: 'Subespecialidad desactivada',
}

export default function SubespecialidadesTab() {
  const [especialidades, setEspecialidades] = useState([])
  const [filtroEspecialidad, setFiltroEspecialidad] = useState('')

  useEffect(() => {
    let vigente = true
    listarEspecialidades()
      .then((lista) => {
        if (vigente) setEspecialidades(Array.isArray(lista) ? lista : [])
      })
      .catch(() => {
        if (vigente) setEspecialidades([])
      })
    return () => {
      vigente = false
    }
  }, [])

  const cargar = useCallback(
    () => listarSubespecialidades(filtroEspecialidad || undefined),
    [filtroEspecialidad],
  )

  const gestion = useGestionCatalogo({
    cargar,
    crear: crearSubespecialidad,
    actualizar: actualizarSubespecialidad,
    desactivar: desactivarSubespecialidad,
    mensajes: MENSAJES,
  })

  const opcionesFiltro = [
    { value: '', label: 'Todas las especialidades' },
    ...especialidades.map((especialidad) => ({
      value: especialidad.id,
      label: especialidad.nombre,
    })),
  ]

  const tituloModal =
    gestion.modal?.modo === 'crear'
      ? 'Nueva subespecialidad'
      : gestion.modal?.modo === 'editar'
        ? 'Editar subespecialidad'
        : 'Detalle de subespecialidad'

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="w-full max-w-xs">
          <Select
            label="Filtrar por especialidad"
            value={filtroEspecialidad}
            onChange={setFiltroEspecialidad}
            options={opcionesFiltro}
          />
        </div>
        <Button onClick={gestion.abrirCrear}>
          <Icon name="add" className="text-[18px]" />
          Agregar
        </Button>
      </div>

      <TablaCatalogo
        columnas={COLUMNAS}
        datos={gestion.datos}
        cargando={gestion.cargando}
        error={gestion.error}
        onReintentar={gestion.recargar}
        onVer={gestion.abrirVer}
        onEditar={gestion.abrirEditar}
        onDesactivar={gestion.solicitarDesactivar}
        vacioTitulo="Sin subespecialidades registradas"
        vacioDescripcion="Agregue la primera subespecialidad y asígnela a una especialidad."
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
          <SubespecialidadForm
            especialidades={especialidades}
            valoresIniciales={gestion.modal.registro}
            soloLectura={gestion.modal.modo === 'consultar'}
            onSubmit={gestion.guardar}
          />
        )}
      </ModalCatalogo>

      <ModalConfirmacion
        abierto={Boolean(gestion.porDesactivar)}
        titulo="Desactivar subespecialidad"
        mensaje={`¿Deseas desactivar este registro? Subespecialidad: ${
          gestion.porDesactivar?.nombre ?? ''
        }`}
        onConfirmar={gestion.confirmarDesactivar}
        onCancelar={gestion.cancelarDesactivar}
        procesando={gestion.desactivando}
      />
    </div>
  )
}
