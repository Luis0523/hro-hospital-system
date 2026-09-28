import { useId } from 'react'
import { ACCIONES_SUGERIDAS, TABLAS_SUGERIDAS } from '../utils/auditoria.js'

const CLASE_CONTROL =
  'w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20'

const CLASE_LABEL = 'block text-label-sm uppercase tracking-wider text-on-surface-variant'

export default function AuditoriaFiltros({
  fechaInicio,
  fechaFin,
  onCambiarInicio,
  onCambiarFin,
  usuarioId,
  onCambiarUsuario,
  usuarios = [],
  tabla,
  onCambiarTabla,
  accion,
  onCambiarAccion,
}) {
  const idInicio = `auditoria-inicio-${useId()}`
  const idFin = `auditoria-fin-${useId()}`
  const idUsuario = `auditoria-usuario-${useId()}`
  const idTabla = `auditoria-tabla-${useId()}`
  const idAccion = `auditoria-accion-${useId()}`
  const idListaTabla = `${idTabla}-sugerencias`
  const idListaAccion = `${idAccion}-sugerencias`

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <div className="space-y-1">
        <label htmlFor={idInicio} className={CLASE_LABEL}>
          Desde
        </label>
        <input
          id={idInicio}
          type="date"
          value={fechaInicio}
          onChange={(evento) => onCambiarInicio(evento.target.value)}
          className={CLASE_CONTROL}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor={idFin} className={CLASE_LABEL}>
          Hasta
        </label>
        <input
          id={idFin}
          type="date"
          value={fechaFin}
          onChange={(evento) => onCambiarFin(evento.target.value)}
          className={CLASE_CONTROL}
        />
      </div>

      <div className="space-y-1">
        <label htmlFor={idUsuario} className={CLASE_LABEL}>
          Usuario
        </label>
        <select
          id={idUsuario}
          value={usuarioId}
          onChange={(evento) => onCambiarUsuario(evento.target.value)}
          className={CLASE_CONTROL}
        >
          <option value="">Todos los usuarios</option>
          {usuarios.map((usuario) => (
            <option key={usuario.id} value={String(usuario.id)}>
              {usuario.idExterno
                ? `${usuario.nombreMostrar} (${usuario.idExterno})`
                : usuario.nombreMostrar}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label htmlFor={idTabla} className={CLASE_LABEL}>
          Tabla
        </label>
        <input
          id={idTabla}
          type="text"
          list={idListaTabla}
          value={tabla}
          onChange={(evento) => onCambiarTabla(evento.target.value)}
          placeholder="Todas las tablas"
          autoComplete="off"
          className={CLASE_CONTROL}
        />
        <datalist id={idListaTabla}>
          {TABLAS_SUGERIDAS.map((valor) => (
            <option key={valor} value={valor} />
          ))}
        </datalist>
      </div>

      <div className="space-y-1">
        <label htmlFor={idAccion} className={CLASE_LABEL}>
          Acción
        </label>
        <input
          id={idAccion}
          type="text"
          list={idListaAccion}
          value={accion}
          onChange={(evento) => onCambiarAccion(evento.target.value)}
          placeholder="Todas las acciones"
          autoComplete="off"
          className={CLASE_CONTROL}
        />
        <datalist id={idListaAccion}>
          {ACCIONES_SUGERIDAS.map((valor) => (
            <option key={valor} value={valor} />
          ))}
        </datalist>
      </div>

      <p className="text-xs text-on-surface-variant sm:col-span-2 lg:col-span-5">
        Tabla y acción son campos libres; las sugerencias son orientativas y no exhaustivas.
      </p>
    </div>
  )
}
