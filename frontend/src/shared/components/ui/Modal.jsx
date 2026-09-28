import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'

export default function Modal({ open, onClose, title, children, footer }) {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-on-surface/40" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-md space-y-4 rounded-2xl bg-surface-container-lowest p-6 shadow-modal">
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
