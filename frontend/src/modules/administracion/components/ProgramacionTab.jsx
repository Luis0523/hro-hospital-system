import { useCallback, useEffect, useState } from 'react'
import Alert from '@/shared/components/ui/Alert.jsx'
import Button from '@/shared/components/ui/Button.jsx'
import Icon from '@/shared/components/ui/Icon.jsx'
import Select from '@/shared/components/ui/Select.jsx'
import { useToast } from '@/shared/context/ToastContext.jsx'
import {
  actualizarProgramacion,
  crearProgramacion,
  desactivarProgramacion,
  listarMedicos,
  listarProgramaciones,
  listarSubespecialidades,
  reactivarProgramacion,
} from '../api/administracionApi.js'
import { DIAS_SEMANA, horaCorta, nombreDia } from '../utils/dias.js'
import useGestionCatalogo from '../hooks/useGestionCatalogo.js'
import FiltroEstado from './FiltroEstado.jsx'
import ModalCatalogo from './ModalCatalogo.jsx'
import ModalConfirmacion from './ModalConfirmacion.jsx'
import ProgramacionForm from './ProgramacionForm.jsx'
import TablaCatalogo from './TablaCatalogo.jsx'

const COLUMNAS = [
  {
    key: 'medicoNombre',
    label: 'Médico',
    render: (fila) => (
      <span className="block">
        <span className="block text-on-surface">{fila.medicoNombre}</span>
        {fila.numeroColegiado && (
          <span className="block text-xs text-outline">Colegiado: {fila.numeroColegiado}</span>
        )}
      </span>
    ),
  },
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
  editar: 'Programación actualizada',
  desactivar: 'Programación desactivada',
  reactivar: 'Programación reactivada',
}

const ESTADO_INICIAL_FILTROS = { medicoId: '', subespecialidadId: '', diaSemana: '' }

export default function ProgramacionTab() {
  const { mostrarToast } = useToast()
  const [medicos, setMedicos] = useState([])
  const [subespecialidades, setSubespecialidades] = useState([])
  const [filtros, setFiltros] = useState(ESTADO_INICIAL_FILTROS)
  const [estado, setEstado] = useState('activos')

  // Alta multidía: orquestación secuencial en el frontend (sin endpoint batch).
  const [procesandoAlta, setProcesandoAlta] = useState(false)
  const [resultados, setResultados] = useState(null)
  const [valoresReintento, setValoresReintento] = useState(null)
  const [claveForm, setClaveForm] = useState(0)

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

  const { medicoId, subespecialidadId, diaSemana } = filtros

  const cargar = useCallback(
    () =>
      listarProgramaciones({
        medicoId: medicoId || undefined,
        subespecialidadId: subespecialidadId || undefined,
        diaSemana: diaSemana ? Number(diaSemana) : undefined,
        estado,
      }),
    [medicoId, subespecialidadId, diaSemana, estado],
  )

  const gestion = useGestionCatalogo({
    cargar,
    crear: crearProgramacion,
    actualizar: actualizarProgramacion,
    desactivar: desactivarProgramacion,
    reactivar: reactivarProgramacion,
    mensajes: MENSAJES,
  })

  const actualizarFiltro = (clave, valor) => setFiltros((previo) => ({ ...previo, [clave]: valor }))

  const limpiarFiltros = () => {
    setFiltros(ESTADO_INICIAL_FILTROS)
    setEstado('activos')
  }

  const restablecerResultados = () => {
    setResultados(null)
    setValoresReintento(null)
  }

  const abrirCrear = () => {
    restablecerResultados()
    setClaveForm((valor) => valor + 1)
    gestion.abrirCrear()
  }

  const cerrarModal = () => {
    restablecerResultados()
    gestion.cerrarModal()
  }

  // Alta multidía: N POST secuenciales, uno por día. Sin Promise.all ni rollback.
  const crearPorDias = async (valores) => {
    const { diasSemana = [], ...compartidos } = valores
    setProcesandoAlta(true)
    setResultados(null)

    const nuevos = []
    for (const diaSemana of diasSemana) {
      try {
        const data = await crearProgramacion({ ...compartidos, diaSemana })
        nuevos.push({ diaSemana, nombreDia: nombreDia(diaSemana), success: true, data })
      } catch (fallo) {
        nuevos.push({
          diaSemana,
          nombreDia: nombreDia(diaSemana),
          success: false,
          error: fallo?.message || 'No se pudo crear la programación',
        })
      }
    }

    setResultados(nuevos)
    await gestion.recargar()

    const fallidos = nuevos.filter((item) => !item.success)
    if (fallidos.length === 0) {
      mostrarToast({ title: MENSAJES.crear, tone: 'success' })
      restablecerResultados()
      gestion.cerrarModal()
    } else {
      // Solo se conservan seleccionados los días fallidos para el reintento.
      setValoresReintento({ ...compartidos, diasSemana: fallidos.map((item) => item.diaSemana) })
      setClaveForm((valor) => valor + 1)
    }
    setProcesandoAlta(false)
  }

  const manejarSubmit = (valores) => {
    if (gestion.modal?.modo === 'editar') return gestion.guardar(valores)
    return crearPorDias(valores)
  }

  const tituloModal =
    gestion.modal?.modo === 'crear'
      ? 'Nueva programación'
      : gestion.modal?.modo === 'editar'
        ? 'Editar programación'
        : 'Detalle de programación'

  const opcionesMedicos = [
    { value: '', label: 'Todos los médicos' },
    ...medicos.map((medico) => ({ value: medico.id, label: medico.nombres })),
  ]
  const opcionesSubespecialidades = [
    { value: '', label: 'Todas las subespecialidades' },
    ...subespecialidades.map((subespecialidad) => ({
      value: subespecialidad.id,
      label: subespecialidad.nombre,
    })),
  ]
  const opcionesDias = [{ value: '', label: 'Todos los días' }, ...DIAS_SEMANA]

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-outline-variant/60 bg-surface-container-lowest p-3 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5 xl:items-end">
          <Select
            label="Subespecialidad"
            value={subespecialidadId}
            onChange={(valor) => actualizarFiltro('subespecialidadId', valor)}
            options={opcionesSubespecialidades}
            placeholder="Todas las subespecialidades"
          />
          <Select
            label="Médico"
            value={medicoId}
            onChange={(valor) => actualizarFiltro('medicoId', valor)}
            options={opcionesMedicos}
            placeholder="Todos los médicos"
          />
          <Select
            label="Día"
            value={diaSemana}
            onChange={(valor) => actualizarFiltro('diaSemana', valor)}
            options={opcionesDias}
            placeholder="Todos los días"
          />
          <FiltroEstado valor={estado} onChange={setEstado} />
          <Button variant="secondary" onClick={limpiarFiltros}>
            <Icon name="filter_alt_off" className="text-[18px]" />
            Limpiar filtros
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-md text-sm text-outline">
          Programación semanal del médico por subespecialidad. Los filtros son opcionales.
        </p>
        <Button onClick={abrirCrear}>
          <Icon name="add" className="text-[18px]" />
          Agregar
        </Button>
      </div>

      <Alert tone="info">
        La capacidad máxima es la cantidad de consultas configuradas para esta programación y la
        duración estimada es el tiempo previsto de una consulta. La disponibilidad diaria y los
        cupos ocupados son gestionados por el sistema, no desde este panel.
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
        vacioTitulo="Sin programación registrada"
        vacioDescripcion="Cree la primera programación del médico por subespecialidad."
      />

      <ModalCatalogo
        abierto={Boolean(gestion.modal)}
        modo={gestion.modal?.modo}
        titulo={tituloModal}
        onCerrar={cerrarModal}
        guardando={gestion.guardando || procesandoAlta}
        textoGuardar={
          gestion.modal?.modo === 'editar'
            ? 'Guardar cambios'
            : valoresReintento
              ? 'Reintentar días fallidos'
              : 'Crear'
        }
      >
        {gestion.modal && (
          <>
            <ProgramacionForm
              key={claveForm}
              medicos={medicos}
              subespecialidades={subespecialidades}
              valoresIniciales={valoresReintento ?? gestion.modal.registro}
              modo={gestion.modal.modo}
              soloLectura={gestion.modal.modo === 'consultar'}
              onSubmit={manejarSubmit}
            />

            {resultados && resultados.length > 0 && (
              <div
                role="status"
                aria-live="polite"
                className="mt-4 space-y-1 rounded-lg border border-outline-variant bg-surface-container-low p-3"
              >
                <p className="text-sm font-semibold text-on-surface">Programación procesada</p>
                <ul className="space-y-1 text-sm">
                  {resultados.map((resultado) => (
                    <li
                      key={resultado.diaSemana}
                      className={resultado.success ? 'text-emerald-700' : 'text-red-700'}
                    >
                      {resultado.success ? '✓' : '✕'} {resultado.nombreDia} —{' '}
                      {resultado.success ? 'creada' : resultado.error}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
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

      <ModalConfirmacion
        abierto={Boolean(gestion.porReactivar)}
        titulo="Reactivar programación"
        mensaje={`¿Deseas reactivar este registro? Programación de ${
          gestion.porReactivar?.medicoNombre ?? ''
        }`}
        textoConfirmar="Sí, reactivar"
        onConfirmar={gestion.confirmarReactivar}
        onCancelar={gestion.cancelarReactivar}
        procesando={gestion.reactivando}
      />
    </div>
  )
}
