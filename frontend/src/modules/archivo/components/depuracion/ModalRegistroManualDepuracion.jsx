import { useEffect, useState } from 'react'
import { Alert, Button, Icon, Input, Modal } from '@/shared/components/ui'

// Registro manual de una depuración para cuando el API del hospital no
// responde o no reconoce el expediente. Solo guarda la baja en la bitácora.
export default function ModalRegistroManualDepuracion({
  abierto,
  onCerrar,
  onGuardar,
  onRegistrado,
}) {
  const [numero, setNumero] = useState('')
  const [nombre, setNombre] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (abierto) {
      setNumero('')
      setNombre('')
      setError(null)
      setGuardando(false)
    }
  }, [abierto])

  async function enviar(evento) {
    evento.preventDefault()
    if (guardando) return
    setGuardando(true)
    setError(null)
    try {
      await onGuardar({
        numeroExpediente: numero.trim(),
        pacienteNombre: nombre.trim(),
      })
      if (onRegistrado) onRegistrado()
      else onCerrar?.()
    } catch (fallo) {
      setError(
        fallo?.status === 409
          ? new Error('Ese expediente ya está depurado.')
          : fallo,
      )
    } finally {
      setGuardando(false)
    }
  }

  const completo = numero.trim() && nombre.trim()

  return (
    <Modal
      open={abierto}
      onClose={() => {
        if (!guardando) onCerrar?.()
      }}
      title="Registro manual de depuración"
      size="sm"
    >
      <form onSubmit={enviar} className="space-y-3" noValidate>
        <p className="flex items-start gap-2 rounded-lg bg-surface-container-low px-3 py-2 text-label-sm text-on-surface-variant">
          <Icon name="info" className="mt-0.5 text-[18px] text-primary" />
          <span>
            Úselo solo cuando el API del hospital no responda o no reconozca el expediente. Se
            registra la baja en la bitácora; <strong>no modifica el hospital</strong>.
          </span>
        </p>

        <Input
          label="Número de expediente"
          name="manual-depuracion-numero"
          value={numero}
          onChange={(evento) => setNumero(evento.target.value)}
          inputMode="numeric"
          autoComplete="off"
          maxLength={30}
          autoFocus
          required
          placeholder="Ej. 123456"
        />

        <Input
          label="Nombre completo"
          name="manual-depuracion-nombre"
          value={nombre}
          onChange={(evento) => setNombre(evento.target.value)}
          autoComplete="off"
          maxLength={200}
          required
          placeholder="Nombre del paciente"
        />

        {error && (
          <Alert tone="error" title="No se pudo registrar la baja">
            {error.message}
          </Alert>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={onCerrar} disabled={guardando}>
            Cancelar
          </Button>
          <Button type="submit" disabled={guardando || !completo}>
            <Icon name="save" className="text-[18px]" />
            {guardando ? 'Registrando…' : 'Registrar baja'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
