import { useCallback, useEffect, useState } from 'react'
import Alert from '@/shared/components/ui/Alert.jsx'
import Button from '@/shared/components/ui/Button.jsx'
import Icon from '@/shared/components/ui/Icon.jsx'
import Select from '@/shared/components/ui/Select.jsx'
import {
  crearProgramacion,
  desactivarProgramacion,
  listarMedicos,
  listarProgramacionesPorMedico,
  listarProgramacionesPorSubespecialidad,
  listarSubespecialidades,
} from '../api/administracionApi.js'
import { horaCorta } from '../utils/dias.js'
import useGestionCatalogo from '../hooks/useGestionCatalogo.js'
import ModalCatalogo from './ModalCatalogo.jsx'
import ModalConfirmacion from './ModalConfirmacion.jsx'
import ProgramacionForm from './ProgramacionForm.jsx'
import TablaCatalogo from './TablaCatalogo.jsx'

const COLUMNAS = [
  { key: 'medicoNombre', label: 'Médico' },
  { key: 'subespecialidadNombre', label: 'Subespecialidad' },
  { key: 'diaSemanaNombre', label: 'Día' },
  {
    key: 'horario',
    label: 'Horario',
    render: (fila) => `${horaCorta(fila.horaInicio)} - ${horaCorta(fila.horaFin)}`,
  },
  { key: 'capacidadMaxima', label: 'Capacidad máxima' },
  { key: 'duracionConsultaMinutos', label: 'Duración estimada' },
  { key: 'activo', label: 'Estado' },
]

const MENSAJES = {
  crear: 'Programación creada',
  desactivar: 'Programación desactivada',
}

const MODOS_FILTRO = [
  { value: 'medico', label: 'Médico' },
  { value: 'subespecialidad', label: 'Subespecialidad' },
]

export default function ProgramacionTab() {
  const [medicos, setMedicos] = useState([])
  const [subespecialidades, setSubespecialidades] = useState([])
  const [modoFiltro, setModoFiltro] = useState('medico')
  const [medicoId, setMedicoId] = useState('')
  const [subespecialidadId, setSubespecialidadId] = useState('')

  useEffect(() => {
    let vigente = true
    Promise.all([listarMedicos(), listarSubespecialidades()])
      .then(([listaMedicos, listaSubespecialidades]) => {
        if (!vigente) return
        setMedicos(Array.isArray(listaMedicos) ? listaMedicos : [])
        setSubespecialidades(Array.isArray(listaSubespecialidades) ? listaSubespecialidades : [])
      })
      .catch(() => {
        if (!vigente) return
        setMedicos([])
        setSubespecialidades([])
      })
    return () => {
      vigente = false
    }
  }, [])

  const cargar = useCallback(() => {
    if (modoFiltro === 'medico') {
      return medicoId ? listarProgramacionesPorMedico(medicoId) : Promise.resolve([])
    }
    return subespecialidadId
      ? listarProgramacionesPorSubespecialidad(subespecialidadId)
      : Promise.resolve([])
  }, [modoFiltro, medicoId, subespecialidadId])

  const gestion = useGestionCatalogo({
    cargar,
    crear: crearProgramacion,
    desactivar: desactivarProgramacion,
    mensajes: MENSAJES,
  })

  const tituloModal =
    gestion.modal?.modo === 'consultar' ? 'Detalle de programación' : 'Nueva programación'

  const opcionesMedicos = medicos.map((medico) => ({
    value: medico.id,
    label: medico.nombres,
  }))
  const opcionesSubespecialidades = subespecialidades.map((subespecialidad) => ({
    value: subespecialidad.id,
    label: subespecialidad.nombre,
  }))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex w-full flex-wrap items-end gap-3">
          <div className="w-full max-w-[200px]">
            <Select
              label="Ver por"
              value={modoFiltro}
              onChange={setModoFiltro}
              options={MODOS_FILTRO}
              placeholder="Ver por"
            />
          </div>
          {modoFiltro === 'medico' ? (
            <div className="w-full max-w-xs">
              <Select
                label="Médico"
                value={medicoId}
                onChange={setMedicoId}
                options={opcionesMedicos}
                placeholder="Filtrar por médico"
              />
            </div>
          ) : (
            <div className="w-full max-w-xs">
              <Select
                label="Subespecialidad"
                value={subespecialidadId}
                onChange={setSubespecialidadId}
                options={opcionesSubespecialidades}
                placeholder="Filtrar por subespecialidad"
              />
            </div>
          )}
        </div>
        <Button onClick={gestion.abrirCrear}>
          <Icon name="add" className="text-[18px]" />
          Agregar
        </Button>
      </div>

      <Alert tone="info">
        La capacidad máxima es la cantidad de consultas configuradas para esta programación y la
        duración estimada es el tiempo previsto de una consulta. La disponibilidad diaria y los
        cupos ocupados son gestionados por el sistema, no desde este panel.
      </Alert>

      {medicoId === '' && modoFiltro === 'medico' && (
        <Alert tone="warning">Seleccione un médico para consultar su programación.</Alert>
      )}
      {subespecialidadId === '' && modoFiltro === 'subespecialidad' && (
        <Alert tone="warning">Seleccione una subespecialidad para consultar su programación.</Alert>
      )}

      <TablaCatalogo
        columnas={COLUMNAS}
        datos={gestion.datos}
        cargando={gestion.cargando}
        error={gestion.error}
        onReintentar={gestion.recargar}
        onVer={gestion.abrirVer}
        onDesactivar={gestion.solicitarDesactivar}
        permitirEditar={false}
        vacioTitulo="Sin programación registrada"
        vacioDescripcion="La programación del médico por subespecialidad no tiene edición: el backend vigente solo ofrece crear y desactivar."
      />

      <ModalCatalogo
        abierto={Boolean(gestion.modal)}
        modo={gestion.modal?.modo}
        titulo={tituloModal}
        onCerrar={gestion.cerrarModal}
        guardando={gestion.guardando}
        textoGuardar="Crear"
      >
        {gestion.modal && (
          <ProgramacionForm
            medicos={medicos}
            subespecialidades={subespecialidades}
            medicoFijoId={modoFiltro === 'medico' ? medicoId : ''}
            subespecialidadFijaId={modoFiltro === 'subespecialidad' ? subespecialidadId : ''}
            valoresIniciales={gestion.modal.registro}
            soloLectura={gestion.modal.modo === 'consultar'}
            onSubmit={gestion.guardar}
          />
        )}
      </ModalCatalogo>

      <ModalConfirmacion
        abierto={Boolean(gestion.porDesactivar)}
        titulo="Desactivar programación"
        mensaje={`¿Deseas desactivar este registro? Programación de ${
          gestion.porDesactivar?.medicoNombre ?? ''
        }`}
        onConfirmar={gestion.confirmarDesactivar}
        onCancelar={gestion.cancelarDesactivar}
        procesando={gestion.desactivando}
      />
    </div>
  )
}
