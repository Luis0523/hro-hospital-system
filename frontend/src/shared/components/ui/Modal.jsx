import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'

export default function Modal({ open, onClose, title, children, footer }) {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-slate-900/40" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-xl">
          {title && (
            <DialogTitle className="text-lg font-semibold text-slate-800">{title}</DialogTitle>
          )}
          <div className="text-sm text-slate-600">{children}</div>
          {footer && <div className="flex justify-end gap-2">{footer}</div>}
        </DialogPanel>
      </div>
    </Dialog>
  )
}
