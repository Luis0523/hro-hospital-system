import Button from '@/shared/components/ui/Button.jsx'
import Modal from '@/shared/components/ui/Modal.jsx'
import Spinner from '@/shared/components/ui/Spinner.jsx'

// Confirmación de devolución. Espejo visual de `ConfirmacionRecepcionCoex`, pero
// específico para la transición `entregado -> en_transito_retorno`. Reutiliza el
// Modal compartido sin modificarlo. Mientras la operación está en vuelo no se
// permite cerrar ni volver a confirmar (evita doble envío y cierres accidentales).
export default function ConfirmacionDevolucionCoex({
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
      title="Confirmar devolución"
      footer={
        <>
          <Button variant="secondary" onClick={onCancelar} disabled={enviando}>
            Cancelar
          </Button>
          <Button onClick={onConfirmar} disabled={enviando} aria-busy={enviando || undefined}>
            {enviando ? 'Devolviendo…' : 'Devolver'}
          </Button>
        </>
      }
    >
      {enviando ? (
        <Spinner label="Devolviendo…" />
      ) : (
        <>
          <p>
            Se {total === 1 ? 'devolverá' : 'devolverán'} <strong>{total}</strong> expediente
            {total === 1 ? '' : 's'} a Archivo. Esta acción registra la transición a “En tránsito de
            retorno”.
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
