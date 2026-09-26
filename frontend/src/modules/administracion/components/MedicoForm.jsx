import { useState } from 'react'
import Input from '@/shared/components/ui/Input.jsx'

export default function MedicoForm({
  valoresIniciales,
  modo = 'crear',
  soloLectura = false,
  onSubmit,
}) {
  const [nombres, setNombres] = useState(valoresIniciales?.nombres ?? '')
  const [numeroColegiado, setNumeroColegiado] = useState(valoresIniciales?.numeroColegiado ?? '')
  const [errorNombres, setErrorNombres] = useState('')
  const [errorColegiado, setErrorColegiado] = useState('')

  const manejarEnvio = (evento) => {
    evento.preventDefault()
    let valido = true

    const nombreLimpio = nombres.trim()
    if (!nombreLimpio) {
      setErrorNombres('El nombre es obligatorio')
      valido = false
    } else if (nombreLimpio.length > 200) {
      setErrorNombres('El nombre no puede exceder 200 caracteres')
      valido = false
    } else {
      setErrorNombres('')
    }

    const colegiadoLimpio = numeroColegiado.trim()
    if (!colegiadoLimpio) {
      setErrorColegiado('El número de colegiado es obligatorio')
      valido = false
    } else if (colegiadoLimpio.length > 50) {
      setErrorColegiado('El número de colegiado no puede exceder 50 caracteres')
      valido = false
    } else {
      setErrorColegiado('')
    }

    if (!valido) return

    if (modo === 'editar') {
      // El contrato PUT exige activo y acepta usuarioReferenciaId: se preservan
      // los valores actuales del registro para no alterar datos fuera de alcance.
      onSubmit({
        nombres: nombreLimpio,
        numeroColegiado: colegiadoLimpio,
        usuarioReferenciaId: valoresIniciales?.usuarioReferenciaId ?? null,
        activo: valoresIniciales?.activo ?? true,
      })
      return
    }

    onSubmit({ nombres: nombreLimpio, numeroColegiado: colegiadoLimpio })
  }

  return (
    <form id="form-catalogo" onSubmit={manejarEnvio} className="space-y-4" noValidate>
      <Input
        name="nombres"
        label="Nombre del médico"
        value={nombres}
        onChange={(evento) => setNombres(evento.target.value)}
        error={errorNombres}
        disabled={soloLectura}
        maxLength={200}
        placeholder="Por ejemplo: Dra. Carmen Fuentes"
      />
      <Input
        name="numeroColegiado"
        label="Número de colegiado"
        value={numeroColegiado}
        onChange={(evento) => setNumeroColegiado(evento.target.value)}
        error={errorColegiado}
        disabled={soloLectura}
        maxLength={50}
        placeholder="Por ejemplo: COL-12890"
      />
    </form>
  )
}
