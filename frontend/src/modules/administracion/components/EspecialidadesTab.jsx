import { useCallback } from 'react'
import Button from '@/shared/components/ui/Button.jsx'
import Icon from '@/shared/components/ui/Icon.jsx'
import {
  actualizarEspecialidad,
  crearEspecialidad,
  desactivarEspecialidad,
  listarEspecialidades,
} from '../api/administracionApi.js'
import useGestionCatalogo from '../hooks/useGestionCatalogo.js'
import EspecialidadForm from './EspecialidadForm.jsx'
import ModalCatalogo from './ModalCatalogo.jsx'
import ModalConfirmacion from './ModalConfirmacion.jsx'
import TablaCatalogo from './TablaCatalogo.jsx'

const COLUMNAS = [
  { key: 'nombre', label: 'Especialidad' },
  { key: 'activo', label: 'Estado' },
]

const MENSAJES = {
  crear: 'Especialidad creada',
  editar: 'Especialidad actualizada',
  desactivar: 'Especialidad desactivada',
}

export default function EspecialidadesTab() {
  const cargar = useCallback(() => listarEspecialidades(), [])
  const gestion = useGestionCatalogo({
    cargar,
    crear: crearEspecialidad,
    actualizar: actualizarEspecialidad,
    desactivar: desactivarEspecialidad,
    mensajes: MENSAJES,
  })

  const tituloModal =
    gestion.modal?.modo === 'crear'
      ? 'Nueva especialidad'
      : gestion.modal?.modo === 'editar'
        ? 'Editar especialidad'
        : 'Detalle de especialidad'

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">Especialidades médicas registradas.</p>
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
        vacioTitulo="Sin especialidades registradas"
        vacioDescripcion="Agregue la primera especialidad médica."
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
          <EspecialidadForm
            valoresIniciales={gestion.modal.registro}
            soloLectura={gestion.modal.modo === 'consultar'}
            onSubmit={gestion.guardar}
          />
        )}
      </ModalCatalogo>

      <ModalConfirmacion
        abierto={Boolean(gestion.porDesactivar)}
        titulo="Desactivar especialidad"
        mensaje={`¿Deseas desactivar este registro? Especialidad: ${
          gestion.porDesactivar?.nombre ?? ''
        }`}
        onConfirmar={gestion.confirmarDesactivar}
        onCancelar={gestion.cancelarDesactivar}
        procesando={gestion.desactivando}
      />
    </div>
  )
}
