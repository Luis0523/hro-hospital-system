import { useState } from 'react'
import Input from '@/shared/components/ui/Input.jsx'
import Select from '@/shared/components/ui/Select.jsx'

export default function SubespecialidadForm({
  especialidades = [],
  valoresIniciales,
  soloLectura = false,
  onSubmit,
}) {
  const [especialidadId, setEspecialidadId] = useState(valoresIniciales?.especialidadId ?? '')
  const [nombre, setNombre] = useState(valoresIniciales?.nombre ?? '')
  const [errorEspecialidad, setErrorEspecialidad] = useState('')
  const [errorNombre, setErrorNombre] = useState('')

  const opciones = especialidades.map((especialidad) => ({
    value: especialidad.id,
    label: especialidad.nombre,
  }))

  const manejarEnvio = (evento) => {
    evento.preventDefault()
    let valido = true

    if (!especialidadId) {
      setErrorEspecialidad('Seleccione una especialidad')
      valido = false
    } else {
      setErrorEspecialidad('')
    }

    const limpio = nombre.trim()
    if (!limpio) {
      setErrorNombre('El nombre es obligatorio')
      valido = false
    } else if (limpio.length > 150) {
      setErrorNombre('El nombre no puede exceder 150 caracteres')
      valido = false
    } else {
      setErrorNombre('')
    }

    if (!valido) return
    onSubmit({ especialidadId, nombre: limpio })
  }

  return (
    <form id="form-catalogo" onSubmit={manejarEnvio} className="space-y-4" noValidate>
      {soloLectura ? (
        <Input
          name="especialidadNombre"
          label="Especialidad"
          value={valoresIniciales?.especialidadNombre ?? ''}
          disabled
        />
      ) : (
        <div>
          <Select
            label="Especialidad"
            value={especialidadId}
            onChange={setEspecialidadId}
            options={opciones}
            placeholder="Seleccione una especialidad"
          />
          {errorEspecialidad && (
            <span className="mt-1 block text-xs text-red-600">{errorEspecialidad}</span>
          )}
        </div>
      )}

      <Input
        name="nombre"
        label="Nombre de la subespecialidad"
        value={nombre}
        onChange={(evento) => setNombre(evento.target.value)}
        error={errorNombre}
        disabled={soloLectura}
        maxLength={150}
        placeholder="Por ejemplo: Cardiología Clínica"
      />
    </form>
  )
}
