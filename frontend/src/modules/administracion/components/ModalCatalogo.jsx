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
      {/*
       * shared/Modal no limita la altura ni aporta scroll interno. El cuerpo se
       * aísla aquí para que los formularios largos puedan desplazarse y el
       * footer (Cancelar / Guardar) permanezca siempre visible en móvil.
       */}
      <div className="max-h-[calc(100vh-12rem)] supports-[height:100dvh]:max-h-[calc(100dvh-12rem)] overflow-y-auto">
        {children}
      </div>
    </Modal>
  )
}
