import { useEffect, useState } from 'react'
import { Alert, Button, Icon, Input, Modal } from '@/shared/components/ui'

/**
 * Registro manual de una salida para expedientes que el API del hospital no
 * reconoce. Solo se guarda en el listado/reporte del sistema: no consulta ni
 * actualiza el hospital.
 */
export default function ModalRegistroManual({
  abierto,
  onCerrar,
  onGuardar,
  onRegistrado,
  etiqueta = null,
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
          ? new Error('Ese expediente ya está registrado en esta estación para la fecha.')
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
      title="Registro manual de expediente"
      size="sm"
    >
      <form onSubmit={enviar} className="space-y-3">
        <p className="flex items-start gap-2 rounded-lg bg-surface-container-low px-3 py-2 text-label-sm text-on-surface-variant">
          <Icon name="info" className="mt-0.5 text-[18px] text-primary" />
          <span>
            Úselo solo cuando el API del hospital no reconozca el expediente. Se agrega al listado y
            al reporte de esta estación; <strong>no modifica el hospital</strong>.
          </span>
        </p>

        {etiqueta && (
          <p className="flex flex-wrap items-center gap-1 text-label-sm text-on-surface-variant">
            <Icon name={etiqueta.icono || 'label'} className="text-[16px] text-primary" />
            Se guardará con la etiqueta{' '}
            <strong className="text-on-surface">{etiqueta.nombre}</strong>
          </p>
        )}

        <Input
          label="Número de expediente"
          name="manual-numero"
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
          name="manual-nombre"
          value={nombre}
          onChange={(evento) => setNombre(evento.target.value)}
          autoComplete="off"
          maxLength={200}
          required
          placeholder="Nombre del paciente"
        />

        {error && (
          <Alert tone="error" title="No se pudo registrar">
            {error.message}
          </Alert>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={onCerrar} disabled={guardando}>
            Cancelar
          </Button>
          <Button type="submit" disabled={guardando || !completo}>
            <Icon name="save" className="text-[18px]" />
            {guardando ? 'Registrando…' : 'Registrar'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
