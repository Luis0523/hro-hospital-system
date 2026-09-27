import { useCallback, useState } from 'react'
import Alert from '@/shared/components/ui/Alert.jsx'
import Button from '@/shared/components/ui/Button.jsx'
import Icon from '@/shared/components/ui/Icon.jsx'
import {
  actualizarEspacioFisico,
  crearEspacioFisico,
  desactivarEspacioFisico,
  listarEspaciosFisicos,
  reactivarEspacioFisico,
} from '../api/administracionApi.js'
import useGestionCatalogo from '../hooks/useGestionCatalogo.js'
import EspacioFisicoForm from './EspacioFisicoForm.jsx'
import FiltroEstado from './FiltroEstado.jsx'
import ModalCatalogo from './ModalCatalogo.jsx'
import ModalConfirmacion from './ModalConfirmacion.jsx'
import TablaCatalogo from './TablaCatalogo.jsx'

const COLUMNAS = [
  { key: 'numero', label: 'Número' },
  { key: 'nombre', label: 'Espacio físico' },
  { key: 'nivel', label: 'Nivel' },
  { key: 'capacidadCamillas', label: 'Capacidad de camillas' },
  { key: 'activo', label: 'Estado' },
]

const MENSAJES = {
  crear: 'Espacio físico creado',
  editar: 'Espacio físico actualizado',
  desactivar: 'Espacio físico desactivado',
  reactivar: 'Espacio físico reactivado',
}

export default function EspaciosFisicosTab() {
  const [estado, setEstado] = useState('activos')
  const cargar = useCallback(() => listarEspaciosFisicos(undefined, estado), [estado])
  const gestion = useGestionCatalogo({
    cargar,
    crear: crearEspacioFisico,
    actualizar: actualizarEspacioFisico,
    desactivar: desactivarEspacioFisico,
    reactivar: reactivarEspacioFisico,
    mensajes: MENSAJES,
  })

  const tituloModal =
    gestion.modal?.modo === 'crear'
      ? 'Nuevo espacio físico'
      : gestion.modal?.modo === 'editar'
        ? 'Editar espacio físico'
        : 'Detalle del espacio físico'

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="max-w-md text-sm text-outline">
          Salas y consultorios del hospital. La especialidad atendida en cada espacio se asigna
          según la programación diaria.
        </p>
        <div className="flex w-full flex-wrap items-end justify-end gap-3 sm:w-auto">
          <FiltroEstado valor={estado} onChange={setEstado} className="w-full sm:w-48" />
          <Button onClick={gestion.abrirCrear}>
            <Icon name="add" className="text-[18px]" />
            Agregar
          </Button>
        </div>
      </div>

      <Alert tone="info">
        La capacidad de camillas es una capacidad física del espacio; no representa cupos de citas
        ni la capacidad de atención de un médico.
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
        onReactivar={gestion.solicitarReactivar}
        vacioTitulo="Sin espacios físicos registrados"
        vacioDescripcion="Agregue la primera sala o consultorio del hospital."
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
          <EspacioFisicoForm
            valoresIniciales={gestion.modal.registro}
            modo={gestion.modal.modo}
            soloLectura={gestion.modal.modo === 'consultar'}
            onSubmit={gestion.guardar}
          />
        )}
      </ModalCatalogo>

      <ModalConfirmacion
        abierto={Boolean(gestion.porDesactivar)}
        titulo="Desactivar espacio físico"
        mensaje={`¿Deseas desactivar este registro? Espacio físico: ${
          gestion.porDesactivar?.nombre ?? ''
        }`}
        onConfirmar={gestion.confirmarDesactivar}
        onCancelar={gestion.cancelarDesactivar}
        procesando={gestion.desactivando}
      />

      <ModalConfirmacion
        abierto={Boolean(gestion.porReactivar)}
        titulo="Reactivar espacio físico"
        mensaje={`¿Deseas reactivar este registro? Espacio físico: ${
          gestion.porReactivar?.nombre ?? ''
        }`}
        textoConfirmar="Sí, reactivar"
        onConfirmar={gestion.confirmarReactivar}
        onCancelar={gestion.cancelarReactivar}
        procesando={gestion.reactivando}
      />
    </div>
  )
}
