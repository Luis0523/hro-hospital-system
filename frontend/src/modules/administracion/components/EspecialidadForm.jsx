import { useState } from 'react'
import Input from '@/shared/components/ui/Input.jsx'

export default function EspecialidadForm({ valoresIniciales, soloLectura = false, onSubmit }) {
  const [nombre, setNombre] = useState(valoresIniciales?.nombre ?? '')
  const [abreviatura, setAbreviatura] = useState(valoresIniciales?.abreviatura ?? '')
  const [errorNombre, setErrorNombre] = useState('')
  const [errorAbreviatura, setErrorAbreviatura] = useState('')

  const manejarEnvio = (evento) => {
    evento.preventDefault()
    const limpio = nombre.trim()
    if (!limpio) {
      setErrorNombre('El nombre es obligatorio')
      return
    }
    if (limpio.length > 150) {
      setErrorNombre('El nombre no puede exceder 150 caracteres')
      return
    }
    const abrev = abreviatura.trim()
    if (abrev.length > 20) {
      setErrorAbreviatura('La abreviatura no puede exceder 20 caracteres')
      return
    }
    setErrorNombre('')
    setErrorAbreviatura('')
    onSubmit({ nombre: limpio, abreviatura: abrev || null })
  }

  return (
    <form id="form-catalogo" onSubmit={manejarEnvio} className="space-y-4" noValidate>
      <Input
        name="nombre"
        label="Nombre de la especialidad"
        value={nombre}
        onChange={(evento) => setNombre(evento.target.value)}
        error={errorNombre}
        disabled={soloLectura}
        maxLength={150}
        placeholder="Por ejemplo: Pediatría"
      />
      <Input
        name="abreviatura"
        label="Abreviatura (sigla del carnet)"
        value={abreviatura}
        onChange={(evento) => setAbreviatura(evento.target.value)}
        error={errorAbreviatura}
        disabled={soloLectura}
        maxLength={20}
        placeholder="Por ejemplo: PED"
        hint="Se muestra en el correlativo del carnet (p. ej. PED-3)."
      />
    </form>
  )
}
