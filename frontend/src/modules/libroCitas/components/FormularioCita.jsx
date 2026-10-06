import { useRef, useState } from 'react'
import { Button, Icon, Input, Select } from '@/shared/components/ui'
import { buscarPacientePorExpediente } from '../api/libroCitasApi'
import { ESPECIALIDADES } from '../api/catalogos'
import { esExpedienteValido, normalizarExpediente } from '../utils/expediente'

const OPCIONES_ESPECIALIDAD = ESPECIALIDADES.map((especialidad) => ({
  value: String(especialidad.id),
  label: especialidad.nombre,
}))

const MENSAJE_FORMATO = 'El número de expediente debe contener solo números.'
const MENSAJE_CONSULTA = 'No se pudo consultar el expediente. Intente de nuevo.'

export default function FormularioCita({ onAgregar }) {
  const [fecha, setFecha] = useState('')
  const [especialidadId, setEspecialidadId] = useState('')
  const [numeroExpediente, setNumeroExpediente] = useState('')
  const [paciente, setPaciente] = useState(null)
  const [buscando, setBuscando] = useState(false)
  const [noEncontrado, setNoEncontrado] = useState(false)
  const [errorConsulta, setErrorConsulta] = useState(null)
  // Descarta respuestas de búsquedas anteriores cuando el expediente cambia.
  const secuenciaRef = useRef(0)

  const expedienteNormalizado = normalizarExpediente(numeroExpediente)
  const formatoValido = esExpedienteValido(expedienteNormalizado)
  const mostrarFormatoInvalido = expedienteNormalizado !== '' && !formatoValido
  const puedeBuscar = formatoValido && !buscando

  async function buscarExpediente(expediente) {
    const secuencia = ++secuenciaRef.current
    setBuscando(true)
    setErrorConsulta(null)

    try {
      const encontrado = await buscarPacientePorExpediente(expediente)
      if (secuencia !== secuenciaRef.current) return

      setBuscando(false)
      if (encontrado) {
        setPaciente(encontrado)
        setNoEncontrado(false)
      } else {
        setPaciente(null)
        setNoEncontrado(true)
      }
    } catch (error) {
      if (secuencia !== secuenciaRef.current) return
      setBuscando(false)
      setPaciente(null)
      setNoEncontrado(false)
      setErrorConsulta(error?.message ?? MENSAJE_CONSULTA)
    }
  }

  // Escribir NO consulta al API: solo actualiza el valor e invalida el estado.
  function manejarCambioExpediente(event) {
    setNumeroExpediente(event.target.value)
    setPaciente(null)
    setNoEncontrado(false)
    setErrorConsulta(null)
    setBuscando(false)
    secuenciaRef.current += 1
  }

  // Acción explícita del usuario: exactamente una consulta por click.
  function manejarBuscar() {
    if (!puedeBuscar) return
    buscarExpediente(expedienteNormalizado)
  }

  const completo =
    Boolean(fecha) &&
    Boolean(especialidadId) &&
    formatoValido &&
    Boolean(paciente) &&
    !buscando &&
    !errorConsulta

  function manejarEnvio(event) {
    event.preventDefault()
    if (!completo || !paciente) return

    const especialidad = ESPECIALIDADES.find(
      (item) => String(item.id) === String(especialidadId),
    )

    const agregado = onAgregar({
      numeroExpediente: expedienteNormalizado,
      nombrePaciente: paciente.nombre,
      fecha,
      especialidadId: especialidad.id,
      especialidadNombre: especialidad.nombre,
    })

    // Solo se limpia el expediente si la fila fue aceptada. Mantiene fecha y
    // especialidad para capturar varios expedientes de la misma jornada.
    if (agregado) {
      secuenciaRef.current += 1
      setNumeroExpediente('')
      setPaciente(null)
      setNoEncontrado(false)
      setErrorConsulta(null)
      setBuscando(false)
    }
  }

  function contenidoEstado() {
    if (buscando) {
      return <span className="text-on-surface-variant">Buscando…</span>
    }
    if (paciente) {
      return (
        <span data-testid="nombre-paciente" className="text-on-surface">
          {paciente.nombre}
        </span>
      )
    }
    if (noEncontrado) {
      return <span className="text-error">Expediente no encontrado</span>
    }
    if (errorConsulta) {
      return (
        <span role="alert" className="text-error">
          {errorConsulta}
        </span>
      )
    }
    return (
      <span className="text-on-surface-variant">Se mostrará al ingresar el expediente</span>
    )
  }

  return (
    <form onSubmit={manejarEnvio} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Input
          id="libro-citas-fecha"
          name="fecha"
          type="date"
          label="Fecha de la cita"
          value={fecha}
          onChange={(event) => setFecha(event.target.value)}
        />

        <Select
          label="Especialidad"
          value={especialidadId}
          onChange={setEspecialidadId}
          options={OPCIONES_ESPECIALIDAD}
          placeholder="Seleccione una especialidad"
        />

        <div className="space-y-2">
          <Input
            id="libro-citas-expediente"
            name="numeroExpediente"
            label="Número de expediente"
            placeholder="Ingrese el número de expediente"
            hint="Solo números"
            inputMode="numeric"
            error={mostrarFormatoInvalido ? MENSAJE_FORMATO : undefined}
            value={numeroExpediente}
            onChange={manejarCambioExpediente}
            autoComplete="off"
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="w-full"
            onClick={manejarBuscar}
            disabled={!puedeBuscar}
          >
            <Icon name="search" className="text-[18px]" />
            Buscar expediente
          </Button>
        </div>
      </div>

      <div className="space-y-1">
        <span className="block text-sm font-medium text-on-surface">Nombre del paciente</span>
        <div className="flex min-h-[2.75rem] items-center rounded-lg border border-outline-variant bg-surface-container-low px-4 py-2.5 text-sm">
          {contenidoEstado()}
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={!completo}>
          <Icon name="playlist_add" className="text-[18px]" />
          Agregar a la lista
        </Button>
      </div>
    </form>
  )
}
