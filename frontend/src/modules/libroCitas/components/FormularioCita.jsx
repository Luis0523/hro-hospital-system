import { useRef, useState } from 'react'
import { Button, Icon, Input, Select } from '@/shared/components/ui'
import { buscarPacientePorExpediente } from '../api/libroCitasApi'
import { ESPECIALIDADES } from '../api/mockData'
import { esExpedienteValido, normalizarExpediente } from '../utils/expediente'

const OPCIONES_ESPECIALIDAD = ESPECIALIDADES.map((especialidad) => ({
  value: String(especialidad.id),
  label: especialidad.nombre,
}))

const MENSAJE_FORMATO = 'Formato inválido. Use NNNN-NN (ej. 1323-23).'

export default function FormularioCita({ onAgregar }) {
  const [fecha, setFecha] = useState('')
  const [especialidadId, setEspecialidadId] = useState('')
  const [numeroExpediente, setNumeroExpediente] = useState('')
  const [paciente, setPaciente] = useState(null)
  const [buscando, setBuscando] = useState(false)
  const [noEncontrado, setNoEncontrado] = useState(false)
  // Descarta respuestas de búsquedas anteriores cuando el expediente cambia.
  const secuenciaRef = useRef(0)

  const expedienteNormalizado = normalizarExpediente(numeroExpediente)
  const formatoValido = esExpedienteValido(expedienteNormalizado)
  const mostrarFormatoInvalido = expedienteNormalizado !== '' && !formatoValido

  async function buscarExpediente(expediente) {
    const secuencia = ++secuenciaRef.current
    setBuscando(true)
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
  }

  function manejarCambioExpediente(event) {
    const valor = event.target.value
    setNumeroExpediente(valor)
    setPaciente(null)
    setNoEncontrado(false)
    secuenciaRef.current += 1

    const expediente = normalizarExpediente(valor)
    if (!esExpedienteValido(expediente)) {
      setBuscando(false)
      return
    }
    buscarExpediente(expediente)
  }

  const completo =
    Boolean(fecha) &&
    Boolean(especialidadId) &&
    formatoValido &&
    Boolean(paciente) &&
    !buscando

  function manejarEnvio(event) {
    event.preventDefault()
    if (!completo || !paciente) return

    const especialidad = ESPECIALIDADES.find(
      (item) => String(item.id) === String(especialidadId),
    )

    const agregado = onAgregar({
      numeroExpediente: expedienteNormalizado,
      pacienteId: paciente.id,
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
      setBuscando(false)
    }
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

        <Input
          id="libro-citas-expediente"
          name="numeroExpediente"
          label="Número de expediente"
          placeholder="1323-23"
          hint="Formato NNNN-NN"
          error={mostrarFormatoInvalido ? MENSAJE_FORMATO : undefined}
          value={numeroExpediente}
          onChange={manejarCambioExpediente}
          autoComplete="off"
        />
      </div>

      <div className="space-y-1">
        <span className="block text-sm font-medium text-on-surface">Nombre del paciente</span>
        <div className="flex min-h-[2.75rem] items-center rounded-lg border border-outline-variant bg-surface-container-low px-4 py-2.5 text-sm">
          {buscando ? (
            <span className="text-on-surface-variant">Buscando…</span>
          ) : paciente ? (
            <span data-testid="nombre-paciente" className="text-on-surface">
              {paciente.nombre}
            </span>
          ) : noEncontrado ? (
            <span className="text-error">Expediente no encontrado</span>
          ) : (
            <span className="text-on-surface-variant">
              Se mostrará al ingresar el expediente
            </span>
          )}
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
