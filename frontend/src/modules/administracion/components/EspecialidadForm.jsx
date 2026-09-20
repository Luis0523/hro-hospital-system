import { useState } from 'react'
import Input from '@/shared/components/ui/Input.jsx'

export default function EspecialidadForm({ valoresIniciales, soloLectura = false, onSubmit }) {
  const [nombre, setNombre] = useState(valoresIniciales?.nombre ?? '')
  const [error, setError] = useState('')

  const manejarEnvio = (evento) => {
    evento.preventDefault()
    const limpio = nombre.trim()
    if (!limpio) {
      setError('El nombre es obligatorio')
      return
    }
    if (limpio.length > 150) {
      setError('El nombre no puede exceder 150 caracteres')
      return
    }
    setError('')
    onSubmit({ nombre: limpio })
  }

  return (
    <form id="form-catalogo" onSubmit={manejarEnvio} className="space-y-4" noValidate>
      <Input
        name="nombre"
        label="Nombre de la especialidad"
        value={nombre}
        onChange={(evento) => setNombre(evento.target.value)}
        error={error}
        disabled={soloLectura}
        maxLength={150}
        placeholder="Por ejemplo: Pediatría"
      />
    </form>
  )
}
