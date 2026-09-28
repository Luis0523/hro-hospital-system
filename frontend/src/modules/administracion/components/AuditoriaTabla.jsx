import Button from '@/shared/components/ui/Button.jsx'
import EmptyState from '@/shared/components/ui/EmptyState.jsx'
import { etiquetaAccion, formatearTabla } from '../utils/auditoria.js'
import { formatearFechaHora } from '../utils/fechas.js'

const ESTILOS_ACCION = {
  crear: 'bg-emerald-100 text-emerald-800',
  actualizar: 'bg-amber-100 text-amber-800',
  eliminar: 'bg-red-100 text-red-700',
  activar: 'bg-emerald-100 text-emerald-800',
  desactivar: 'bg-red-100 text-red-700',
  reactivar: 'bg-indigo-100 text-indigo-800',
}

function BadgeAccion({ accion }) {
  const clave = String(accion ?? '').toLowerCase()
  const estilo = ESTILOS_ACCION[clave] ?? 'bg-slate-100 text-slate-600'
  return (
    <span className={`inline-block rounded px-2.5 py-0.5 text-label-sm font-semibold ${estilo}`}>
      {etiquetaAccion(accion)}
    </span>
  )
}

function Usuario({ nombre }) {
  if (!nombre) {
    return <span className="text-on-surface-variant">No disponible</span>
  }
  return <span>{nombre}</span>
}

function Entidad({ valor }) {
  if (!valor) return <span className="text-on-surface-variant">No disponible</span>
  return (
    <span className="font-mono text-xs text-on-surface-variant" title={valor}>
      {valor}
    </span>
  )
}

export default function AuditoriaTabla({ registros = [], onVerDetalle }) {
  if (registros.length === 0) {
    return (
      <EmptyState
        title="Sin registros de auditoría"
        description="No hay operaciones que coincidan con los filtros seleccionados."
      />
    )
  }

  return (
    <div>
      <div className="hidden overflow-x-auto rounded-xl border border-outline-variant bg-surface-container-lowest xl:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-container-low text-label-sm uppercase tracking-wide text-on-surface-variant">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">
                Fecha
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                Usuario
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                Acción
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                Tabla
              </th>
              <th scope="col" className="px-4 py-3 font-semibold">
                Entidad
              </th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">
                Detalle
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/40">
            {registros.map((registro) => (
              <tr key={registro.id} className="hover:bg-surface-container-low/60">
                <td className="whitespace-nowrap px-4 py-3 text-on-surface">
                  {formatearFechaHora(registro.fecha)}
                </td>
                <td className="px-4 py-3">
                  <Usuario nombre={registro.usuarioNombre} />
                </td>
                <td className="px-4 py-3">
                  <BadgeAccion accion={registro.accion} />
                </td>
                <td className="px-4 py-3 text-on-surface-variant">
                  {formatearTabla(registro.tablaAfectada)}
                </td>
                <td className="px-4 py-3">
                  <Entidad valor={registro.entidadId} />
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onVerDetalle(registro)}
                    aria-label={`Ver detalle del registro ${registro.id}`}
                  >
                    Ver
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="space-y-3 xl:hidden">
        {registros.map((registro) => (
          <li
            key={registro.id}
            className="space-y-3 rounded-xl border border-outline-variant bg-surface-container-lowest p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-on-surface">
                  {formatearFechaHora(registro.fecha)}
                </p>
                <Usuario nombre={registro.usuarioNombre} />
              </div>
              <BadgeAccion accion={registro.accion} />
            </div>

            <dl className="grid grid-cols-2 gap-2 text-sm">
              <dt className="text-on-surface-variant">Tabla</dt>
              <dd className="text-right text-on-surface">{formatearTabla(registro.tablaAfectada)}</dd>
              <dt className="text-on-surface-variant">Entidad</dt>
              <dd className="truncate text-right">
                <Entidad valor={registro.entidadId} />
              </dd>
            </dl>

            <Button
              size="sm"
              variant="secondary"
              onClick={() => onVerDetalle(registro)}
              aria-label={`Ver detalle del registro ${registro.id}`}
              className="w-full"
            >
              Ver detalle
            </Button>
          </li>
        ))}
      </ul>
    </div>
  )
}
