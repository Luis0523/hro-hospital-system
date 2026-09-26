import { useState } from 'react'
import Input from '@/shared/components/ui/Input.jsx'
import Select from '@/shared/components/ui/Select.jsx'
import { DIAS_SEMANA, horaCorta, nombreDia, normalizarHora } from '../utils/dias.js'

export default function ProgramacionForm({
  medicos = [],
  subespecialidades = [],
  medicoFijoId,
  subespecialidadFijaId,
  valoresIniciales,
  soloLectura = false,
  onSubmit,
}) {
  const [medicoId, setMedicoId] = useState(valoresIniciales?.medicoId ?? medicoFijoId ?? '')
  const [subespecialidadId, setSubespecialidadId] = useState(
    valoresIniciales?.subespecialidadId ?? subespecialidadFijaId ?? '',
  )
  const [diaSemana, setDiaSemana] = useState(valoresIniciales?.diaSemana ?? '')
  const [horaInicio, setHoraInicio] = useState(horaCorta(valoresIniciales?.horaInicio))
  const [horaFin, setHoraFin] = useState(horaCorta(valoresIniciales?.horaFin))
  const [capacidadMaxima, setCapacidadMaxima] = useState(valoresIniciales?.capacidadMaxima ?? '')
  const [duracionConsultaMinutos, setDuracionConsultaMinutos] = useState(
    valoresIniciales?.duracionConsultaMinutos ?? 35,
  )
  const [errores, setErrores] = useState({})

  const opcionesMedicos = medicos.map((medico) => ({
    value: medico.id,
    label: medico.nombres,
  }))
  const opcionesSubespecialidades = subespecialidades.map((subespecialidad) => ({
    value: subespecialidad.id,
    label: subespecialidad.nombre,
  }))
  const opcionesDias = DIAS_SEMANA.map((dia) => ({ value: dia.value, label: dia.label }))

  const manejarEnvio = (evento) => {
    evento.preventDefault()
    const nuevos = {}

    if (!medicoId) nuevos.medicoId = 'Seleccione un médico'
    if (!subespecialidadId) nuevos.subespecialidadId = 'Seleccione una subespecialidad'
    if (!diaSemana) nuevos.diaSemana = 'Seleccione un día'
    if (!horaInicio) nuevos.horaInicio = 'Indique la hora de inicio'
    if (!horaFin) nuevos.horaFin = 'Indique la hora de fin'

    const capacidad = Number(capacidadMaxima)
    if (capacidadMaxima === '' || Number.isNaN(capacidad) || capacidad < 1) {
      nuevos.capacidadMaxima = 'La capacidad debe ser al menos 1'
    }

    const duracion = Number(duracionConsultaMinutos)
    if (duracionConsultaMinutos === '' || Number.isNaN(duracion) || duracion < 5) {
      nuevos.duracionConsultaMinutos = 'La duración debe ser al menos 5 minutos'
    }

    setErrores(nuevos)
    if (Object.keys(nuevos).length > 0) return

    onSubmit({
      medicoId,
      subespecialidadId,
      diaSemana: Number(diaSemana),
      horaInicio: normalizarHora(horaInicio),
      horaFin: normalizarHora(horaFin),
      capacidadMaxima: capacidad,
      duracionConsultaMinutos: duracion,
    })
  }

  if (soloLectura) {
    return (
      <div className="space-y-4">
        <Input label="Médico" value={valoresIniciales?.medicoNombre ?? ''} disabled />
        <Input
          label="Subespecialidad"
          value={valoresIniciales?.subespecialidadNombre ?? ''}
          disabled
        />
        <Input
          label="Día"
          value={valoresIniciales?.diaSemanaNombre ?? nombreDia(valoresIniciales?.diaSemana) ?? ''}
          disabled
        />
        <Input label="Hora de inicio" value={horaCorta(valoresIniciales?.horaInicio)} disabled />
        <Input label="Hora de fin" value={horaCorta(valoresIniciales?.horaFin)} disabled />
        <Input label="Capacidad máxima" value={valoresIniciales?.capacidadMaxima ?? ''} disabled />
        <Input
          label="Duración estimada (minutos)"
          value={valoresIniciales?.duracionConsultaMinutos ?? ''}
          disabled
        />
      </div>
    )
  }

  return (
    <form id="form-catalogo" onSubmit={manejarEnvio} className="space-y-4" noValidate>
      <div>
        <Select
          label="Médico"
          value={medicoId}
          onChange={setMedicoId}
          options={opcionesMedicos}
          placeholder="Seleccione un médico"
        />
        {errores.medicoId && (
          <span className="mt-1 block text-xs text-red-600">{errores.medicoId}</span>
        )}
      </div>

      <div>
        <Select
          label="Subespecialidad"
          value={subespecialidadId}
          onChange={setSubespecialidadId}
          options={opcionesSubespecialidades}
          placeholder="Seleccione una subespecialidad"
        />
        {errores.subespecialidadId && (
          <span className="mt-1 block text-xs text-red-600">{errores.subespecialidadId}</span>
        )}
      </div>

      <div>
        <Select
          label="Día"
          value={diaSemana}
          onChange={setDiaSemana}
          options={opcionesDias}
          placeholder="Seleccione un día"
        />
        {errores.diaSemana && (
          <span className="mt-1 block text-xs text-red-600">{errores.diaSemana}</span>
        )}
      </div>

      <Input
        name="horaInicio"
        type="time"
        label="Hora de inicio"
        value={horaInicio}
        onChange={(evento) => setHoraInicio(evento.target.value)}
        error={errores.horaInicio}
      />
      <Input
        name="horaFin"
        type="time"
        label="Hora de fin"
        value={horaFin}
        onChange={(evento) => setHoraFin(evento.target.value)}
        error={errores.horaFin}
      />
      <Input
        name="capacidadMaxima"
        type="number"
        min={1}
        label="Capacidad máxima"
        hint="Cantidad máxima de consultas configuradas para esta programación."
        value={capacidadMaxima}
        onChange={(evento) => setCapacidadMaxima(evento.target.value)}
        error={errores.capacidadMaxima}
      />
      <Input
        name="duracionConsultaMinutos"
        type="number"
        min={5}
        label="Duración estimada (minutos)"
        hint="Duración prevista de una consulta."
        value={duracionConsultaMinutos}
        onChange={(evento) => setDuracionConsultaMinutos(evento.target.value)}
        error={errores.duracionConsultaMinutos}
      />
    </form>
  )
}
