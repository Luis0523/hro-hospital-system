import { useCallback } from 'react'
import Button from '@/shared/components/ui/Button.jsx'
import Icon from '@/shared/components/ui/Icon.jsx'
import {
  actualizarMedico,
  crearMedico,
  desactivarMedico,
  listarMedicos,
} from '../api/administracionApi.js'
import useGestionCatalogo from '../hooks/useGestionCatalogo.js'
import MedicoForm from './MedicoForm.jsx'
import ModalCatalogo from './ModalCatalogo.jsx'
import ModalConfirmacion from './ModalConfirmacion.jsx'
import TablaCatalogo from './TablaCatalogo.jsx'

const COLUMNAS = [
  { key: 'nombres', label: 'Médico' },
  { key: 'numeroColegiado', label: 'Número de colegiado' },
  { key: 'activo', label: 'Estado' },
]

const MENSAJES = {
  crear: 'Médico registrado',
  editar: 'Médico actualizado',
  desactivar: 'Médico desactivado',
}

export default function MedicosTab() {
  const cargar = useCallback(() => listarMedicos(), [])
  const gestion = useGestionCatalogo({
    cargar,
    crear: crearMedico,
    actualizar: actualizarMedico,
    desactivar: desactivarMedico,
    mensajes: MENSAJES,
  })

  const tituloModal =
    gestion.modal?.modo === 'crear'
      ? 'Nuevo médico'
      : gestion.modal?.modo === 'editar'
        ? 'Editar médico'
        : 'Detalle del médico'

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          Médicos especialistas activos. La desactivación es una baja lógica.
        </p>
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
        vacioTitulo="Sin médicos registrados"
        vacioDescripcion="Registre el primer médico especialista del hospital."
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
          <MedicoForm
            valoresIniciales={gestion.modal.registro}
            modo={gestion.modal.modo}
            soloLectura={gestion.modal.modo === 'consultar'}
            onSubmit={gestion.guardar}
          />
        )}
      </ModalCatalogo>

      <ModalConfirmacion
        abierto={Boolean(gestion.porDesactivar)}
        titulo="Desactivar médico"
        mensaje={`¿Deseas desactivar este registro? Médico: ${
          gestion.porDesactivar?.nombres ?? ''
        }`}
        onConfirmar={gestion.confirmarDesactivar}
        onCancelar={gestion.cancelarDesactivar}
        procesando={gestion.desactivando}
      />
    </div>
  )
}
