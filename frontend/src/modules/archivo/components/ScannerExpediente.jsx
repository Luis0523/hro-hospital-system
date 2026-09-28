import Icon from '@/shared/components/ui/Icon.jsx'
import { Alert } from '@/shared/components/ui'
import { useLectorCamara } from '../hooks/useLectorCamara'

export default function ScannerExpediente({
  value,
  onChange,
  onSubmit,
  onCodigoEscaneado,
  inputRef,
}) {
  const { videoRef, activo, error, soporteCamara, soporteDetector, iniciar, detener } =
    useLectorCamara((codigo) => {
      onChange?.(codigo)
      onCodigoEscaneado?.(codigo)
    })

  const camaraSoportada = soporteCamara && soporteDetector

  return (
    <section
      aria-label="Búsqueda de expediente"
      className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 shadow-sm"
    >
      <label htmlFor="codigo-expediente" className="mb-1 block text-sm font-medium text-on-surface">
        Buscar expediente por código
      </label>
      <form onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex flex-1 items-center">
          <span className="pointer-events-none absolute left-4 flex items-center text-primary">
            <Icon name="barcode_scanner" className="text-[24px]" />
          </span>
          <input
            id="codigo-expediente"
            ref={inputRef}
            type="text"
            autoComplete="off"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Escanee o escriba el código del expediente..."
            className="h-12 w-full rounded-xl border border-outline-variant bg-surface-container-low pl-14 pr-4 text-title-md text-on-surface outline-none transition focus:border-hro-blue focus:bg-surface-container-lowest focus:ring-2 focus:ring-secondary-fixed-dim"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-hro-blue px-4 text-title-sm text-white transition hover:bg-blue-800 active:scale-95 sm:flex-none"
          >
            <Icon name="search" className="text-[20px]" />
            Buscar
          </button>
          {!activo && (
            <button
              type="button"
              onClick={iniciar}
              className="flex h-12 items-center justify-center gap-2 rounded-xl bg-surface-container px-4 text-title-sm text-on-surface transition hover:bg-surface-container-high active:scale-95"
            >
              <Icon name="photo_camera" className="text-[20px] text-primary" />
              Escanear con cámara
            </button>
          )}
        </div>
      </form>

      {activo && (
        <div className="mt-3 space-y-2">
          <div className="overflow-hidden rounded-xl border border-outline-variant bg-black">
            <video
              ref={videoRef}
              className="h-56 w-full object-cover"
              muted
              playsInline
              aria-label="Vista de cámara"
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-body-sm text-on-surface-variant">Acérque el código a la cámara.</p>
            <button
              type="button"
              onClick={detener}
              className="flex items-center gap-2 rounded-xl bg-surface-container px-4 py-2 text-title-sm text-on-surface transition hover:bg-surface-container-high"
            >
              <Icon name="close" className="text-[20px] text-primary" />
              Cerrar cámara
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-3">
          <Alert tone="warning" title="Cámara no disponible">
            {error}
          </Alert>
        </div>
      )}

      <p className="mt-1 text-body-sm text-on-surface-variant">
        {camaraSoportada
          ? 'Escanee con la cámara o escriba el código. Si la cámara no está disponible, use la búsqueda manual.'
          : 'Escriba el código para buscar el expediente. La cámara no está disponible en este navegador o dispositivo.'}
      </p>
    </section>
  )
}
