import Button from '@/shared/components/ui/Button.jsx'
import Modal from '@/shared/components/ui/Modal.jsx'
import Spinner from '@/shared/components/ui/Spinner.jsx'

// Confirmación de recepción. Reutiliza el Modal compartido sin modificarlo.
// Mientras la operación está en vuelo no se permite cerrar ni volver a
// confirmar (evita doble envío y cierres accidentales).
export default function ConfirmacionRecepcionCoex({
  abierto,
  expedientes = [],
  enviando = false,
  onCancelar,
  onConfirmar,
}) {
  const total = expedientes.length

  return (
    <Modal
      open={abierto}
      onClose={enviando ? () => {} : onCancelar}
      title="Confirmar recepción"
      footer={
        <>
          <Button variant="secondary" onClick={onCancelar} disabled={enviando}>
            Cancelar
          </Button>
          <Button onClick={onConfirmar} disabled={enviando} aria-busy={enviando || undefined}>
            {enviando ? 'Recibiendo…' : 'Recibir'}
          </Button>
        </>
      }
    >
      {enviando ? (
        <Spinner label="Recibiendo…" />
      ) : (
        <>
          <p>
            Se {total === 1 ? 'recibirá' : 'recibirán'} <strong>{total}</strong> expediente
            {total === 1 ? '' : 's'}. Esta acción registra la transición a “Recibido en COEX”.
          </p>
          {total > 0 && (
            <ul className="mt-3 flex max-h-56 flex-col gap-1 overflow-y-auto">
              {expedientes.map((fila) => (
                <li key={String(fila.cicloId)} className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-on-surface">
                    {fila.numeroExpediente || 'Sin número de expediente'}
                  </span>
                  {fila.pacienteNombre && (
                    <span className="min-w-0 break-words text-right">{fila.pacienteNombre}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </Modal>
  )
}
