import Button from '@/shared/components/ui/Button.jsx'
import Modal from '@/shared/components/ui/Modal.jsx'

/**
 * Confirmación explícita para la baja lógica. DELETE en el backend es
 * desactivación, por lo que el mensaje nunca habla de eliminación permanente.
 */
export default function ModalConfirmacion({
  abierto,
  titulo,
  mensaje,
  textoConfirmar = 'Sí, desactivar',
  onConfirmar,
  onCancelar,
  procesando = false,
}) {
  return (
    <Modal
      open={abierto}
      onClose={onCancelar}
      title={titulo}
      footer={
        <>
          <Button variant="secondary" onClick={onCancelar} disabled={procesando}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={onConfirmar} disabled={procesando}>
            {procesando ? 'Procesando...' : textoConfirmar}
          </Button>
        </>
      }
    >
      <p>{mensaje}</p>
    </Modal>
  )
}
