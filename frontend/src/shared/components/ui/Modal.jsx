import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'

// Anchos disponibles para el panel. `sm` conserva el tamaño histórico.
const TAMANOS = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-6xl',
  full: 'max-w-[95vw]',
}

export default function Modal({ open, onClose, title, children, footer, size = 'sm' }) {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      {/* Fondo: aparece/desaparece con un fundido suave. */}
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-on-surface/40 duration-200 ease-out data-[closed]:opacity-0"
      />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel
          transition
          className={`w-full ${TAMANOS[size] ?? TAMANOS.sm} space-y-4 rounded-2xl bg-surface-container-lowest p-6 shadow-modal duration-200 ease-out data-[closed]:scale-95 data-[closed]:opacity-0`}
        >
          {title && (
            <DialogTitle className="text-lg font-semibold text-on-surface">{title}</DialogTitle>
          )}
          <div className="text-sm text-on-surface-variant">{children}</div>
          {footer && <div className="flex justify-end gap-2">{footer}</div>}
        </DialogPanel>
      </div>
    </Dialog>
  )
}
