import { Fragment, useId } from 'react'
import Alert from '@/shared/components/ui/Alert.jsx'
import Button from '@/shared/components/ui/Button.jsx'
import EmptyState from '@/shared/components/ui/EmptyState.jsx'
import Spinner from '@/shared/components/ui/Spinner.jsx'
import { desdeISO, formatearFechaLarga, nombreMes } from '../utils/fechas.js'

const ANIOS_ANTES = 2
const ANIOS_DESPUES = 5

function construirAnios(anioSeleccionado) {
  const base = new Date().getFullYear()
  const anios = []
  for (let anio = base - ANIOS_ANTES; anio <= base + ANIOS_DESPUES; anio += 1) {
    anios.push(anio)
  }
  if (!anios.includes(anioSeleccionado)) {
    anios.push(anioSeleccionado)
    anios.sort((a, b) => a - b)
  }
  return anios
}

/**
 * Vista anual: lista los días no laborables del año agrupados por mes.
 * La carga (una sola consulta por rango anual) la orquesta el contenedor.
 */
export default function VistaAnualCalendario({
  anio,
  dias = [],
  cargando = false,
  error = null,
  onReintentar,
  onCambiarAnio,
  onVer,
  onEditarMotivo,
  onHabilitar,
}) {
  const idAnio = `anual-anio-${useId()}`
  const anios = construirAnios(anio)

  const grupos = new Map()
  for (const dia of dias) {
    const { mes } = desdeISO(dia.fecha)
    if (!grupos.has(mes)) grupos.set(mes, [])
    grupos.get(mes).push(dia)
  }
  const mesesOrdenados = [...grupos.keys()].sort((a, b) => a - b)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1">
          <label
            htmlFor={idAnio}
            className="block text-label-sm uppercase tracking-wider text-on-surface-variant"
          >
            Año
          </label>
          <select
            id={idAnio}
            value={anio}
            onChange={(evento) => onCambiarAnio(Number(evento.target.value))}
            className="rounded-lg border border-outline-variant bg-surface-container-lowest px-2 py-2 text-sm text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {anios.map((valor) => (
              <option key={valor} value={valor}>
                {valor}
              </option>
            ))}
          </select>
        </div>
      </div>

      {cargando && <Spinner label="Cargando días no laborables del año..." />}

      {!cargando && error && (
        <Alert tone="error" title="No se pudo cargar la vista anual">
          <p>{error}</p>
          {onReintentar && (
            <div className="mt-3">
              <Button size="sm" variant="secondary" onClick={onReintentar}>
                Reintentar
              </Button>
            </div>
          )}
        </Alert>
      )}

      {!cargando && !error && mesesOrdenados.length === 0 && (
        <EmptyState
          title="Año sin días no laborables"
          description="No hay fechas bloqueadas registradas en el año seleccionado."
        />
      )}

      {!cargando && !error && mesesOrdenados.length > 0 && (
        <div data-testid="anual-dias-no-laborables" className="space-y-4">
          {mesesOrdenados.map((mes) => (
            <Fragment key={mes}>
              <h3 className="text-label-sm uppercase tracking-wider text-outline">
                {nombreMes(mes)}
              </h3>
              <ul className="space-y-2">
                {grupos.get(mes).map((dia) => (
                  <li
                    key={dia.id}
                    className="rounded-lg border border-outline-variant/60 bg-surface-container-lowest p-4 shadow-sm"
                  >
                    <p className="text-sm font-semibold text-on-surface">
                      {formatearFechaLarga(dia.fecha)}
                    </p>
                    <p className="mt-1 break-words text-sm text-on-surface-variant">{dia.motivo}</p>
                    <p className="mt-1 break-words text-xs text-outline">
                      Registrado por: {dia.creadoPorNombre || 'No disponible'}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button size="sm" variant="ghost" onClick={() => onVer?.(dia)}>
                        Ver
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => onEditarMotivo?.(dia)}>
                        Editar motivo
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => onHabilitar?.(dia)}>
                        Habilitar día
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </Fragment>
          ))}
        </div>
      )}
    </div>
  )
}
