import { useState } from 'react'
import { Button, Icon, Modal } from '@/shared/components/ui'
import { normalizarBusquedaExpediente } from '../../utils/busquedaDepurados'

export default function BuscadorBitacoraDepurados({ valor = '', onChange }) {
  const [abierto, setAbierto] = useState(false)
  const [borrador, setBorrador] = useState(valor)

  function abrir() {
    setBorrador(valor)
    setAbierto(true)
  }

  function cerrar() {
    setAbierto(false)
  }

  function cambiar(evento) {
    const normalizado = normalizarBusquedaExpediente(evento.target.value)
    if (normalizado == null) return
    setBorrador(normalizado)
  }

  function aplicar() {
    onChange(normalizarBusquedaExpediente(borrador) ?? '')
    cerrar()
  }

  function limpiar() {
    onChange('')
    setBorrador('')
    cerrar()
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="min-h-11 min-w-11 px-3"
          onClick={abrir}
          aria-haspopup="dialog"
          aria-label="Buscar expediente"
          title="Buscar expediente"
        >
          <Icon name="search" className="text-[18px]" />
          <span className="hidden sm:inline">Buscar expediente</span>
        </Button>

        {valor && (
          <span className="inline-flex items-center gap-1 rounded-lg border border-outline-variant bg-surface-container-low px-2 py-1 text-label-sm text-on-surface-variant">
            <span className="whitespace-nowrap">Exp. {valor}</span>
            <button
              type="button"
              onClick={() => onChange('')}
              aria-label="Limpiar búsqueda de expediente"
              className="flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-surface-container hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
            >
              <Icon name="close" className="text-[16px]" />
            </button>
          </span>
        )}
      </div>

      <Modal
        open={abierto}
        onClose={cerrar}
        title="Buscar expediente en la bitácora"
        footer={
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              size="md"
              className="w-full sm:w-auto"
              onClick={limpiar}
            >
              Limpiar
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="md"
              className="w-full sm:w-auto"
              onClick={cerrar}
            >
              Cerrar
            </Button>
            <Button type="button" size="md" className="w-full sm:w-auto" onClick={aplicar}>
              Aplicar
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <div>
            <label
              htmlFor="busqueda-expediente-bitacora"
              className="mb-1 block text-label-sm font-semibold text-on-surface"
            >
              Número de expediente
            </label>
            <input
              id="busqueda-expediente-bitacora"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              pattern="[0-9-]*"
              maxLength={31}
              value={borrador}
              onChange={cambiar}
              onKeyDown={(evento) => {
                if (evento.key === 'Enter') aplicar()
              }}
              placeholder="Ej. 9275"
              autoFocus
              className="min-h-11 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 text-body-md text-on-surface outline-none transition placeholder:text-on-surface-variant focus:border-primary-container focus:ring-2 focus:ring-secondary-fixed-dim"
            />
          </div>
          <p className="text-label-sm text-on-surface-variant">
            Coincidencia parcial por número. El filtro se aplica en memoria y no consulta la API.
          </p>
        </div>
      </Modal>
    </>
  )
}
