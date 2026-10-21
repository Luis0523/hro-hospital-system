import { ETAPAS_SEGUIMIENTO } from '../../api/seguimientoApi'
import { estiloDeEtapa } from './estilosEtapas'

// Resumen compacto del turno seleccionado, con el mismo lenguaje visual que
// la franja de tipo de nuevo registro.
export default function DetalleTurno({ seleccion, especialidadNombre }) {
  if (!seleccion) {
    return (
      <div
        aria-live="polite"
        data-testid="detalle-turno"
        className="rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2"
      >
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-label-sm font-semibold text-on-surface-variant">
            Turno seleccionado:
          </h2>
          <p className="text-label-sm text-on-surface-variant">
            Elija una casilla para ver el detalle.
          </p>
        </div>
      </div>
    )
  }

  const { codigo, numero, turno } = seleccion
  const id = `${codigo}-${String(numero).padStart(2, '0')}`
  const indice = turno ? ETAPAS_SEGUIMIENTO.findIndex((etapa) => etapa.id === turno.etapa) : -1
  const estilo = estiloDeEtapa(turno?.etapa)
  const nombreEtapa = turno ? ETAPAS_SEGUIMIENTO[indice]?.nombre : null

  return (
    <div
      aria-live="polite"
      data-testid="detalle-turno"
      className="rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2"
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <h2 className="text-label-sm font-semibold text-on-surface-variant">Turno seleccionado:</h2>
        <strong className="text-label-md font-bold text-on-surface">{id}</strong>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-label-sm font-bold ${estilo.fondo} ${estilo.texto}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${estilo.punto}`} aria-hidden="true" />
          {nombreEtapa ?? 'Sin registrar'}
        </span>
        <span className="text-label-sm text-on-surface-variant">{especialidadNombre}</span>
        <span className="text-label-sm text-on-surface-variant">
          · Clínica {turno?.clinicaId ?? 'sin asignar'}
        </span>
        <span className="text-label-sm text-on-surface-variant">
          · Etapa {turno ? `${indice + 1} de 5` : 'sin iniciar'}
        </span>
      </div>
    </div>
  )
}
