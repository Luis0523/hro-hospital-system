import { useState } from 'react'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import Icon from '@/shared/components/ui/Icon.jsx'
import Button from '@/shared/components/ui/Button.jsx'

function Dato({ etiqueta, valor, className = '' }) {
  return (
    <div className={className}>
      <dt className="text-on-surface-variant">{etiqueta}</dt>
      <dd className="truncate font-semibold text-on-surface">{valor || '—'}</dd>
    </div>
  )
}

export default function MenuUsuario({ abierto, onCerrar, usuario, terminal, onCerrarSesion }) {
  const [confirmando, setConfirmando] = useState(false)

  function cerrar() {
    setConfirmando(false)
    onCerrar()
  }

  return (
    <Dialog open={abierto} onClose={cerrar} className="relative z-50">
      <div className="fixed inset-0 bg-on-surface/40" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-sm space-y-4 rounded-2xl bg-surface-container-lowest p-5 shadow-modal">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-container text-on-primary">
              <Icon name="person" className="text-[26px]" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="truncate text-headline-sm text-on-surface">
                {usuario?.nombre}
              </DialogTitle>
              <p className="text-label-sm uppercase text-on-surface-variant">{usuario?.puesto}</p>
            </div>
            <button
              type="button"
              onClick={cerrar}
              aria-label="Cerrar"
              className="ml-auto rounded-lg p-1 text-on-surface-variant hover:bg-surface-container"
            >
              <Icon name="close" className="text-[22px]" />
            </button>
          </div>

          <dl className="grid grid-cols-2 gap-x-3 gap-y-2 rounded-xl bg-surface-container-low p-3 text-body-sm">
            <Dato etiqueta="Rol" valor={usuario?.rol} />
            <Dato etiqueta="Usuario" valor={usuario?.idExterno} />
            <Dato etiqueta="Terminal" valor={terminal} className="col-span-2" />
          </dl>

          {confirmando ? (
            <div className="space-y-3">
              <p className="rounded-lg bg-error-container/60 px-3 py-2 text-body-sm text-on-error-container">
                ¿Seguro que desea cerrar la sesión?
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={() => setConfirmando(false)}>
                  Cancelar
                </Button>
                <Button variant="danger" onClick={onCerrarSesion}>
                  Cerrar sesión
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="secondary" className="w-full" onClick={() => setConfirmando(true)}>
              <Icon name="logout" className="text-[20px]" />
              Cerrar sesión
            </Button>
          )}
        </DialogPanel>
      </div>
    </Dialog>
  )
}
