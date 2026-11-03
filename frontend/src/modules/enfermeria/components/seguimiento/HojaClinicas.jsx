import { useEffect, useRef } from 'react'
import { Button, Icon, Modal } from '@/shared/components/ui'
import { ordenarClinicas } from './ordenClinicas'

// Hoja (bottom sheet) de clínicas con botones grandes. Por defecto muestra
// solo las clínicas de la especialidad activa; "Ver todas" es el respaldo.
export default function HojaClinicas({
  open,
  onClose,
  clinicas,
  clinicaSeleccionadaId,
  onElegir,
  esElegible = () => true,
  especialidadNombre = null,
  mensaje = null,
  mostrarTodas = false,
  onMostrarTodas,
}) {
  const ordenadas = ordenarClinicas(clinicas)
  const botonesRef = useRef([])

  useEffect(() => {
    if (!open) return undefined
    const temporizador = setTimeout(() => {
      const primero = botonesRef.current.find((boton) => boton && !boton.disabled)
      primero?.focus()
    }, 50)
    return () => clearTimeout(temporizador)
  }, [open, ordenadas])

  return (
    <Modal open={open} onClose={onClose} title="Clínicas físicas" size="full">
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-body-md text-on-surface-variant">
            {mensaje ??
              (especialidadNombre
                ? `Clínicas disponibles para ${especialidadNombre}`
                : 'Elija la clínica que recibirá el expediente')}
          </p>
          {onMostrarTodas && (
            <button
              type="button"
              onClick={onMostrarTodas}
              className="min-h-11 rounded-lg border border-outline-variant px-3 text-label-md font-semibold text-primary transition hover:bg-surface-container focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hro-blue"
            >
              {mostrarTodas ? 'Ver solo las de la especialidad' : 'Ver todas'}
            </button>
          )}
        </div>

        <div className="grid max-h-[65vh] grid-cols-2 gap-3 overflow-y-auto overscroll-contain p-1 sm:grid-cols-3 lg:grid-cols-4">
          {ordenadas.map((clinica, indice) => {
            const conteo = clinica.expedientesEnClinica ?? 0
            const seleccionada = String(clinicaSeleccionadaId) === String(clinica.id)
            const elegible = esElegible(clinica)
            return (
              <button
                key={clinica.id}
                ref={(elemento) => {
                  botonesRef.current[indice] = elemento
                }}
                type="button"
                data-clinica-id={clinica.id}
                aria-label={`${clinica.nombre}: ${conteo} expedientes en clínica`}
                aria-pressed={seleccionada}
                aria-disabled={!elegible}
                disabled={!elegible}
                onClick={() => onElegir(clinica)}
                className={`flex min-h-16 flex-col justify-between rounded-xl border-2 p-3 text-left transition touch-manipulation select-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hro-blue active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 ${
                  seleccionada
                    ? 'border-primary bg-primary-container text-on-primary shadow-popover'
                    : 'border-outline-variant bg-surface-container-lowest text-on-surface hover:border-primary hover:bg-surface-container-low'
                }`}
              >
                <span className="flex items-start justify-between gap-2">
                  <span className="text-title-md font-bold leading-tight">{clinica.nombre}</span>
                  <Icon
                    name={seleccionada ? 'check_circle' : 'local_hospital'}
                    className="shrink-0 text-[20px]"
                  />
                </span>
                <span
                  className={`mt-1 text-label-md ${
                    seleccionada ? 'text-on-primary/90' : 'text-on-surface-variant'
                  }`}
                >
                  {String(conteo).padStart(2, '0')} expedientes en clínica
                </span>
              </button>
            )
          })}
        </div>

        {ordenadas.length === 0 && (
          <p className="rounded-xl border border-dashed border-outline-variant p-4 text-body-sm text-on-surface-variant">
            No hay clínicas disponibles para la fecha seleccionada.
          </p>
        )}

        <div className="flex justify-end pt-1">
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  )
}
