import Button from '@/shared/components/ui/Button.jsx'
import Modal from '@/shared/components/ui/Modal.jsx'

/**
 * Modal de catálogo con tres modos: crear, editar y consultar (solo lectura).
 * El envío se dispara con requestSubmit sobre el formulario hijo (id fijo),
 * de modo que las acciones permanezcan en el footer del modal.
 */
export default function ModalCatalogo({
  abierto,
  modo,
  titulo,
  onCerrar,
  guardando = false,
  textoGuardar = 'Guardar',
  children,
}) {
  const soloLectura = modo === 'consultar'

  const enviarFormulario = () => {
    const formulario = document.getElementById('form-catalogo')
    if (!formulario) return
    if (typeof formulario.requestSubmit === 'function') {
      formulario.requestSubmit()
    } else {
      formulario.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    }
  }

  const footer = soloLectura ? (
    <Button variant="secondary" onClick={onCerrar}>
      Cerrar
    </Button>
  ) : (
    <>
      <Button variant="secondary" onClick={onCerrar} disabled={guardando}>
        Cancelar
      </Button>
      <Button onClick={enviarFormulario} disabled={guardando}>
        {guardando ? 'Guardando...' : textoGuardar}
      </Button>
    </>
  )

  return (
    <Modal open={abierto} onClose={onCerrar} title={titulo} footer={footer}>
      {children}
    </Modal>
  )
}
