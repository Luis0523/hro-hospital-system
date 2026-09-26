import Icon from '@/shared/components/ui/Icon.jsx'

// Fila de checklist de la Estación de Archivo.
//
// Representa siempre un expediente existente: prioriza su número y el checkbox.
// El nombre del paciente, la ubicación física y la hora se muestran como
// información secundaria discreta, útil para localizar el expediente pero sin
// competir con el número.
//
// Es un componente puramente presentacional: no conoce la API, no avanza
// estados y no decide transiciones. El checkbox solo informa al padre que la
// fila fue marcada o desmarcada mediante `onToggle`. El prop `resaltado` indica
// que la fila fue encontrada por el buscador; NO marca el checkbox ni cambia de
// grupo. En móvil la fila se apila sin generar scroll horizontal.

export default function ListadoCompactoExpediente({
  expediente,
  seleccionado = false,
  resaltado = false,
  onToggle,
}) {
  const numero = expediente.numeroExpediente
  const hora = expediente.horaEstimada ? expediente.horaEstimada.slice(0, 5) : null

  const etiquetaCheckbox = `Seleccionar expediente ${numero}${
    expediente.pacienteNombre ? ` de ${expediente.pacienteNombre}` : ''
  }`

  const clasesEstado = resaltado
    ? 'border-amber-400 bg-amber-50 ring-2 ring-amber-300'
    : seleccionado
      ? 'border-hro-blue bg-cyan-50 ring-1 ring-hro-blue'
      : 'border-slate-200 bg-white'

  return (
    <li
      data-expediente-id={expediente.id}
      data-seleccionado={seleccionado ? 'true' : 'false'}
      data-resaltado={resaltado ? 'true' : 'false'}
      className={`rounded-lg border transition ${clasesEstado}`}
    >
      <label className="flex cursor-pointer items-center gap-3 p-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center">
          <input
            type="checkbox"
            className="h-6 w-6 cursor-pointer rounded accent-hro-blue focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hro-blue"
            checked={seleccionado}
            onChange={() => onToggle?.(expediente.id)}
            aria-label={etiquetaCheckbox}
          />
        </span>

        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <span className="truncate text-title-md font-semibold text-on-surface">{numero}</span>
            {resaltado && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-label-sm font-semibold text-amber-800">
                <Icon name="my_location" className="text-[14px]" />
                Resultado de búsqueda
              </span>
            )}
          </span>

          <span className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-0.5 text-body-sm text-on-surface-variant">
            {expediente.pacienteNombre && (
              <span className="min-w-0 truncate">{expediente.pacienteNombre}</span>
            )}
            {expediente.ubicacion && (
              <span className="flex min-w-0 items-center gap-1">
                <Icon name="shelves" className="text-[16px] text-primary" />
                <span className="min-w-0 truncate">{expediente.ubicacion}</span>
              </span>
            )}
            {hora && (
              <span className="flex shrink-0 items-center gap-1">
                <Icon name="schedule" className="text-[16px] text-primary" />
                {hora}
              </span>
            )}
          </span>
        </span>
      </label>
    </li>
  )
}
