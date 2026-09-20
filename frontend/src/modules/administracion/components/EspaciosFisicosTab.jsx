import { useCallback } from 'react'
import Alert from '@/shared/components/ui/Alert.jsx'
import Button from '@/shared/components/ui/Button.jsx'
import Icon from '@/shared/components/ui/Icon.jsx'
import {
  actualizarEspacioFisico,
  crearEspacioFisico,
  desactivarEspacioFisico,
  listarEspaciosFisicos,
} from '../api/administracionApi.js'
import useGestionCatalogo from '../hooks/useGestionCatalogo.js'
import EspacioFisicoForm from './EspacioFisicoForm.jsx'
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
}

export default function EspaciosFisicosTab() {
  const cargar = useCallback(() => listarEspaciosFisicos(), [])
  const gestion = useGestionCatalogo({
    cargar,
    crear: crearEspacioFisico,
    actualizar: actualizarEspacioFisico,
    desactivar: desactivarEspacioFisico,
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          Salas y consultorios del hospital. La especialidad atendida en cada espacio se asigna
          según la programación diaria.
        </p>
        <Button onClick={gestion.abrirCrear}>
          <Icon name="add" className="text-[18px]" />
          Agregar
        </Button>
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
    </div>
  )
}
