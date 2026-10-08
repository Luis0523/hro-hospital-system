import Button from '@/shared/components/ui/Button.jsx'
import EmptyState from '@/shared/components/ui/EmptyState.jsx'
import Icon from '@/shared/components/ui/Icon.jsx'
import Spinner from '@/shared/components/ui/Spinner.jsx'
import { metadatosEstado } from '../../estadosExpediente'

const COLUMNAS = [
  { clave: 'fechaMovimiento', etiqueta: 'Fecha/hora' },
  { clave: 'numeroExpediente', etiqueta: 'Expediente' },
  { clave: 'pacienteNombre', etiqueta: 'Paciente' },
  { clave: 'transicion', etiqueta: 'Transición' },
  { clave: 'usuarioNombre', etiqueta: 'Usuario' },
  { clave: 'observacion', etiqueta: 'Observación' },
]

function formatearFechaHora(iso) {
  if (!iso) return '—'
  const fecha = new Date(iso)
  if (Number.isNaN(fecha.getTime())) return iso
  return fecha.toLocaleString('es-GT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function EtiquetaEstado({ estado }) {
  if (!estado) return <span className="text-on-surface-variant">—</span>
  const meta = metadatosEstado(estado)
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-label-sm ${meta.color}`}>
      {meta.etiqueta}
    </span>
  )
}

function Transicion({ evento }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {evento.estadoAnterior && (
        <>
          <EtiquetaEstado estado={evento.estadoAnterior} />
          <Icon name="arrow_forward" className="text-[14px] text-on-surface-variant" />
        </>
      )}
      <EtiquetaEstado estado={evento.estadoNuevo} />
    </span>
  )
}

// Bitácora de movimientos del ciclo. Tabla en pantallas grandes; tarjetas en
// móvil. Presentacional: recibe la lista ya cargada y delega la paginación.
export default function TablaMovimientos({
  movimientos = [],
  hayMas = false,
  cargandoMas = false,
  onCargarMas,
}) {
  return (
    <section
      aria-label="Bitácora de movimientos"
      className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 shadow-card"
    >
      <h3 className="mb-3 text-title-md text-on-surface">Movimientos recientes</h3>

      {movimientos.length === 0 ? (
        <EmptyState
          title="Sin movimientos"
          description="No hay transiciones registradas para el rango seleccionado."
        />
      ) : (
        <>
          {/* Tabla (xl+) */}
          <div className="hidden overflow-hidden rounded-xl border border-outline-variant xl:block">
            <table className="w-full text-left text-body-sm">
              <thead className="bg-surface-container-low text-label-sm uppercase tracking-wide text-on-surface-variant">
                <tr>
                  {COLUMNAS.map((columna) => (
                    <th key={columna.clave} scope="col" className="px-3 py-2 font-semibold">
                      {columna.etiqueta}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/60">
                {movimientos.map((evento) => (
                  <tr key={evento.id} className="hover:bg-surface-container-low/60">
                    <td className="whitespace-nowrap px-3 py-2 text-on-surface-variant">
                      {formatearFechaHora(evento.fechaMovimiento)}
                    </td>
                    <td className="px-3 py-2 text-on-surface">{evento.numeroExpediente ?? '—'}</td>
                    <td className="px-3 py-2 text-on-surface">{evento.pacienteNombre ?? '—'}</td>
                    <td className="px-3 py-2">
                      <Transicion evento={evento} />
                    </td>
                    <td className="px-3 py-2 text-on-surface-variant">
                      {evento.usuarioNombre ?? '—'}
                    </td>
                    <td
                      className="max-w-[16rem] truncate px-3 py-2 text-on-surface-variant"
                      title={evento.observacion ?? ''}
                    >
                      {evento.observacion ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tarjetas (móvil / tablet) */}
          <ul className="space-y-2 xl:hidden">
            {movimientos.map((evento) => (
              <li
                key={evento.id}
                className="rounded-xl border border-outline-variant bg-surface-container-low p-3"
              >
                <div className="flex items-center justify-between gap-2 text-body-sm">
                  <span className="font-semibold text-on-surface">
                    {evento.numeroExpediente ?? '—'}
                  </span>
                  <span className="text-on-surface-variant">
                    {formatearFechaHora(evento.fechaMovimiento)}
                  </span>
                </div>
                <p className="mt-1 text-body-sm text-on-surface-variant">
                  {evento.pacienteNombre ?? '—'}
                </p>
                <div className="mt-2">
                  <Transicion evento={evento} />
                </div>
                <p className="mt-2 text-body-sm text-on-surface-variant">
                  {evento.usuarioNombre ?? '—'}
                  {evento.observacion ? ` · ${evento.observacion}` : ''}
                </p>
              </li>
            ))}
          </ul>

          {hayMas && (
            <div className="mt-3 flex justify-center">
              <Button variant="secondary" size="sm" onClick={onCargarMas} disabled={cargandoMas}>
                {cargandoMas ? <Spinner label="Cargando…" /> : 'Cargar más'}
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  )
}
