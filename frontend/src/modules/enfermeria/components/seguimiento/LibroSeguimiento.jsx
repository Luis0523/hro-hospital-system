import { Button, EmptyState, Icon } from '@/shared/components/ui'
import { ETAPAS_SEGUIMIENTO } from '../../api/seguimientoApi'
import { estiloDeEtapa } from './estilosEtapas'

function etiquetaTurno(codigo, numero) {
  return `${codigo}-${String(numero).padStart(2, '0')}`
}

function CasillaTurno({ codigo, numero, turno, seleccionada, filtro, onSeleccionar }) {
  const estilo = estiloDeEtapa(turno?.etapa)
  const nombre = turno ? ETAPAS_SEGUIMIENTO.find((etapa) => etapa.id === turno.etapa)?.nombre : null
  const atenuada = filtro && (!turno || turno.etapa !== filtro)

  return (
    <button
      type="button"
      aria-label={`${etiquetaTurno(codigo, numero)}, ${nombre ?? 'sin registro'}`}
      aria-pressed={seleccionada}
      onClick={() => onSeleccionar(codigo, numero)}
      className={`relative h-8 w-8 rounded-md border text-label-sm font-bold transition hover:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hro-blue ${estilo.borde} ${estilo.fondo} ${estilo.texto} ${
        seleccionada ? 'ring-2 ring-primary ring-offset-1 ring-offset-surface-container-lowest' : ''
      } ${atenuada ? 'opacity-25' : ''}`}
    >
      {numero}
      {turno && (
        <span
          className={`absolute inset-x-1.5 bottom-1 h-0.5 rounded ${estilo.barra}`}
          aria-hidden="true"
        />
      )}
    </button>
  )
}

// Libro digital: buscador, filtro por etapa y casillas de correlativos.
export default function LibroSeguimiento({
  filas,
  totalRegistrados,
  seleccionId,
  filtro,
  busqueda,
  onBuscar,
  onLimpiar,
  onRegistrar,
  onSeleccionar,
}) {
  const nombreFiltro = ETAPAS_SEGUIMIENTO.find((etapa) => etapa.id === filtro)?.nombre
  const hint = nombreFiltro
    ? `Resaltando los turnos en estado: ${nombreFiltro}.`
    : 'Seleccione una casilla para consultar o actualizar un turno.'

  return (
    <section className="rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant p-4">
        <div className="flex min-w-0 items-center gap-2">
          <Icon name="menu_book" className="text-[22px] text-primary" />
          <div className="min-w-0">
            <h2 className="text-headline-sm text-on-surface">Libro digital de recepción</h2>
            <p className="text-body-sm text-on-surface-variant">
              <span data-testid="total-turnos">{totalRegistrados}</span> turnos registrados ·
              correlativos organizados por especialidad
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="relative block w-full sm:w-auto">
            <Icon
              name="search"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant"
            />
            <input
              type="search"
              value={busqueda}
              onChange={(evento) => onBuscar(evento.target.value)}
              placeholder="Buscar especialidad o turno"
              aria-label="Buscar especialidad o turno"
              className="h-9 w-full rounded-lg border border-outline-variant bg-surface-container-lowest pl-9 pr-3 text-body-sm text-on-surface outline-none transition focus:border-primary-container focus:ring-2 focus:ring-secondary-fixed-dim sm:w-56"
            />
          </label>
          <Button variant="secondary" size="sm" onClick={onLimpiar}>
            Ver todos
          </Button>
          <Button size="sm" onClick={onRegistrar}>
            <Icon name="add" className="text-[18px]" />
            Registrar turno
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-outline-variant px-4 py-2 text-label-sm text-on-surface-variant">
        <span>{hint}</span>
        <span className="flex flex-wrap items-center gap-3">
          {ETAPAS_SEGUIMIENTO.map((etapa) => (
            <span key={etapa.id} className="inline-flex items-center gap-1.5">
              <i
                className={`h-2 w-2 rounded-sm ${estiloDeEtapa(etapa.id).punto}`}
                aria-hidden="true"
              />
              {etapa.nombre}
            </span>
          ))}
        </span>
      </div>

      <div className="max-h-[430px] space-y-2 overflow-y-auto p-4">
        {filas.length === 0 ? (
          <EmptyState
            title="Sin resultados"
            description="No hay especialidades o correlativos que coincidan con la búsqueda."
          />
        ) : (
          filas.map((fila) => (
            <div key={fila.codigo} className="grid gap-2 md:grid-cols-[165px_minmax(0,1fr)]">
              <div className="flex flex-col justify-center rounded-lg border border-l-4 border-outline-variant border-l-primary bg-surface-container-low px-3 py-1.5">
                <span className="text-label-md text-on-surface">{fila.nombre}</span>
                <span className="text-label-sm text-on-surface-variant">
                  {fila.registrados} / {fila.maximo} registrados
                </span>
              </div>

              <div className="flex flex-wrap content-start gap-1">
                {fila.slots.map(({ numero, turno }) => (
                  <CasillaTurno
                    key={numero}
                    codigo={fila.codigo}
                    numero={numero}
                    turno={turno}
                    filtro={filtro}
                    seleccionada={seleccionId === `${fila.codigo}-${numero}`}
                    onSeleccionar={onSeleccionar}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  )
}
