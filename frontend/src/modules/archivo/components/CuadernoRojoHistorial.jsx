import { Fragment, useEffect, useMemo, useState } from 'react'
import { Button, EmptyState, Icon, Select, Spinner } from '@/shared/components/ui'
import { COLUMNAS_HISTORIAL } from '../cuadernoRojoCampos'
import { agruparPorMesAnio } from '../utils/agruparHistorial'

const COLUMNAS_CANTIDAD = COLUMNAS_HISTORIAL.filter((columna) => columna.clave !== 'fecha')

const ANIO_MINIMO = 2000

const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

const OPCIONES_MES = [
  { value: '', label: 'Todos' },
  ...MESES.map((nombre, indice) => ({
    value: String(indice + 1).padStart(2, '0'),
    label: nombre,
  })),
]

// El formulario usa `sobres` como clave interna; el backend y el mock
// persisten el mismo dato como `sobresEmergencia`. Se traduce solo al mostrar.
const CLAVE_REGISTRO = {
  fecha: 'fecha',
  egresosHospitalarios: 'egresosHospitalarios',
  sobres: 'sobresEmergencia',
  sobresSellados: 'sobresSellados',
  tia: 'tia',
}

function celda(valor) {
  return valor === null || valor === undefined || valor === '' ? '—' : valor
}

function fechaCorta(iso) {
  if (!iso) return '—'
  const [anio, mes, dia] = String(iso).split('-')
  return anio && mes && dia ? `${dia}/${mes}/${anio}` : iso
}

function valorRegistro(registro, clave) {
  return celda(registro?.[CLAVE_REGISTRO[clave] ?? clave])
}

function claveRegistro(registro) {
  return registro?.id ?? registro?.fecha ?? null
}

function idDetalle(registro, vista) {
  const clave = String(claveRegistro(registro) ?? 'registro').replace(/[^a-zA-Z0-9_-]/g, '-')
  return `detalle-${vista}-${clave}`
}

function dato(valor) {
  if (valor === null || valor === undefined || String(valor).trim() === '') {
    return 'No disponible'
  }
  return String(valor)
}

function formatearActualizacion(valor) {
  const texto = String(valor ?? '').trim()
  if (!texto) return 'No disponible'

  const fecha = new Date(texto)
  if (Number.isNaN(fecha.getTime())) return 'No disponible'

  try {
    return new Intl.DateTimeFormat('es-GT', {
      timeZone: 'America/Guatemala',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(fecha)
  } catch {
    return 'No disponible'
  }
}

function fechaEnPeriodo(fecha, filtros) {
  if (!fecha || !filtros?.anio) return true
  const anio = fecha.slice(0, 4)
  const mes = fecha.slice(5, 7)
  return (
    String(anio) === String(filtros.anio) &&
    (!filtros.mes || mes === String(filtros.mes).padStart(2, '0'))
  )
}

function BotonEditar({ registro, onSeleccionar, deshabilitado }) {
  if (!onSeleccionar) return null

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      className="min-h-11"
      onClick={() => onSeleccionar(registro)}
      disabled={deshabilitado}
      aria-label={`Editar registro del ${fechaCorta(registro?.fecha)}`}
    >
      <Icon name="edit" className="text-[16px]" />
      Editar
    </Button>
  )
}

function BotonDetalle({ registro, vista, abierto, onAlternar }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="min-h-11"
      onClick={() => onAlternar(registro)}
      aria-expanded={abierto}
      aria-controls={idDetalle(registro, vista)}
      aria-label={`Detalle del registro del ${fechaCorta(registro?.fecha)}`}
    >
      <Icon name={abierto ? 'expand_less' : 'expand_more'} className="text-[16px]" />
      Detalle
    </Button>
  )
}

function DetalleRegistro({ registro, id }) {
  return (
    <div id={id} className="space-y-2">
      <dl className="grid gap-3 sm:grid-cols-3">
        <div>
          <dt className="text-label-sm uppercase tracking-wide text-on-surface-variant">
            Registrado por
          </dt>
          <dd className="text-body-sm text-on-surface">{dato(registro?.registradoPor)}</dd>
        </div>
        <div>
          <dt className="text-label-sm uppercase tracking-wide text-on-surface-variant">
            Actualizado por
          </dt>
          <dd className="text-body-sm text-on-surface">{dato(registro?.actualizadoPor)}</dd>
        </div>
        <div>
          <dt className="text-label-sm uppercase tracking-wide text-on-surface-variant">
            Última actualización
          </dt>
          <dd className="text-body-sm tabular-nums text-on-surface">
            {formatearActualizacion(registro?.actualizadoEn)}
          </dd>
        </div>
      </dl>
      <p className="text-body-sm text-on-surface-variant">
        El sistema conserva únicamente los datos de la última actualización.
      </p>
    </div>
  )
}

/**
 * Historial de registros del Cuaderno Rojo. La tabla aparece solo cuando el
 * ancho real permite 40rem sin desbordar (xl); por debajo se usan filas
 * agrupadas por mes, cómodas para tablet y móvil.
 */
export default function CuadernoRojoHistorial({
  registros = [],
  cargando = false,
  onRecargar,
  onSeleccionar,
  fechaSeleccionada,
  deshabilitado = false,
  filtros = null,
  anioActual = null,
  onCambiarFiltro,
  onRestablecer,
  registroEnEdicion = null,
}) {
  const grupos = agruparPorMesAnio(registros)
  const vacio = grupos.length === 0
  const tieneFiltros = Boolean(filtros && onCambiarFiltro)
  const anioTope = Number(anioActual) || Number(filtros?.anio) || new Date().getFullYear()
  const anioSeleccionado = filtros?.anio ?? ''
  const mesSeleccionado = filtros?.mes ?? ''
  const [detalleAbierto, setDetalleAbierto] = useState(null)

  const opcionesAnio = useMemo(() => {
    const cantidad = Math.max(0, anioTope - ANIO_MINIMO + 1)
    return Array.from({ length: cantidad }, (_, indice) => {
      const anio = anioTope - indice
      return { value: String(anio), label: String(anio) }
    })
  }, [anioTope])

  useEffect(() => {
    setDetalleAbierto(null)
  }, [filtros?.anio, filtros?.mes])

  useEffect(() => {
    if (!detalleAbierto) return
    const sigueEnLista = registros.some(
      (registro) => String(claveRegistro(registro)) === detalleAbierto,
    )
    if (!sigueEnLista) setDetalleAbierto(null)
  }, [registros, detalleAbierto])

  const esSeleccionado = (registro) =>
    Boolean(fechaSeleccionada) && registro?.fecha === fechaSeleccionada

  const alternarDetalle = (registro) => {
    const clave = String(claveRegistro(registro) ?? '')
    if (!clave) return
    setDetalleAbierto((actual) => (actual === clave ? null : clave))
  }

  const notaFueraDePeriodo = Boolean(
    registroEnEdicion && filtros && !fechaEnPeriodo(registroEnEdicion, filtros),
  )

  return (
    <section aria-label="Historial de registros" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-title-md text-on-surface">Historial</h3>
          {(registros.length > 0 || !tieneFiltros) && (
            <p className="text-body-sm text-on-surface-variant">
              {registros.length === 0
                ? 'Aún no hay días registrados.'
                : `${registros.length} ${registros.length === 1 ? 'día registrado' : 'días registrados'}.`}
            </p>
          )}
        </div>

        {onRecargar && (
          <Button
            variant="secondary"
            size="sm"
            className="min-h-11"
            onClick={onRecargar}
            disabled={cargando}
          >
            <Icon name="refresh" className="text-[18px]" />
            Actualizar
          </Button>
        )}
      </div>

      {tieneFiltros && (
        <div className="flex flex-wrap items-end gap-2">
          <Select
            label="Año"
            ariaLabel="Año"
            value={anioSeleccionado}
            onChange={(valor) => onCambiarFiltro('anio', valor)}
            options={opcionesAnio}
            className="w-[calc(50%-0.25rem)] sm:w-36 [&_button]:min-h-11"
          />
          <Select
            label="Mes"
            ariaLabel="Mes"
            value={mesSeleccionado}
            onChange={(valor) => onCambiarFiltro('mes', valor)}
            options={OPCIONES_MES}
            className="w-[calc(50%-0.25rem)] sm:w-40 [&_button]:min-h-11"
          />
          {onRestablecer && (
            <Button
              variant="secondary"
              size="sm"
              className="min-h-11 w-full sm:w-auto"
              onClick={onRestablecer}
            >
              <Icon name="restart_alt" className="text-[18px]" />
              Restablecer
            </Button>
          )}
        </div>
      )}

      {notaFueraDePeriodo && (
        <p className="flex items-start gap-2 text-body-sm text-on-surface-variant">
          <Icon name="info" className="text-[16px] text-amber-600 dark:text-amber-400" />
          El registro que está editando no pertenece al período seleccionado.
        </p>
      )}

      {cargando ? (
        <Spinner label="Cargando historial…" />
      ) : vacio ? (
        <EmptyState
          title={tieneFiltros ? 'Sin registros en el período seleccionado' : 'Sin registros'}
          description={
            tieneFiltros
              ? 'Pruebe con otro año o mes.'
              : 'Los días que guarde aparecerán aquí agrupados por mes y año.'
          }
        />
      ) : (
        <>
          {/* Móvil y tablet: filas agrupadas por mes */}
          <div className="space-y-5 xl:hidden">
            {grupos.map((grupo) => (
              <section key={grupo.clave} aria-label={grupo.etiqueta}>
                <h4 className="mb-2 flex items-center justify-between gap-2 text-label-md uppercase tracking-wide text-on-surface-variant">
                  <span>{grupo.etiqueta}</span>
                  <span className="normal-case tracking-normal">
                    {grupo.registros.length}{' '}
                    {grupo.registros.length === 1 ? 'registro' : 'registros'}
                  </span>
                </h4>
                <ul className="divide-y divide-outline-variant overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest">
                  {grupo.registros.map((registro, indice) => {
                    const seleccionado = esSeleccionado(registro)
                    const abierto = String(detalleAbierto) === String(claveRegistro(registro))
                    return (
                      <li
                        key={registro?.id ?? `${grupo.clave}-${indice}`}
                        className={`border-l-2 p-3 sm:p-4 ${
                          seleccionado ? 'border-primary bg-primary/5' : 'border-transparent'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="flex flex-wrap items-center gap-2 text-title-sm font-semibold text-on-surface">
                            {fechaCorta(registro?.fecha)}
                            {seleccionado && (
                              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-label-sm font-semibold text-primary">
                                En edición
                              </span>
                            )}
                          </p>
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            <BotonDetalle
                              registro={registro}
                              vista="movil"
                              abierto={abierto}
                              onAlternar={alternarDetalle}
                            />
                            <BotonEditar
                              registro={registro}
                              onSeleccionar={onSeleccionar}
                              deshabilitado={deshabilitado}
                            />
                          </div>
                        </div>
                        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
                          {COLUMNAS_CANTIDAD.map((columna) => (
                            <div key={columna.clave}>
                              <dt className="text-label-sm uppercase tracking-wide text-on-surface-variant">
                                {columna.etiqueta}
                              </dt>
                              <dd className="text-title-sm tabular-nums text-on-surface">
                                {valorRegistro(registro, columna.clave)}
                              </dd>
                            </div>
                          ))}
                        </dl>
                        {abierto && (
                          <div className="mt-3 border-t border-outline-variant/60 pt-3">
                            <DetalleRegistro
                              registro={registro}
                              id={idDetalle(registro, 'movil')}
                            />
                          </div>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </section>
            ))}
          </div>

          {/* Escritorio amplio: tabla compacta */}
          <div className="hidden overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest xl:block">
            <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
              <caption className="sr-only">Historial de registros del Cuaderno Rojo</caption>
              <thead>
                <tr className="border-b border-outline-variant bg-surface-container-low text-on-surface-variant">
                  {COLUMNAS_HISTORIAL.map((columna) => (
                    <th
                      key={columna.clave}
                      scope="col"
                      className={`px-3 py-2.5 font-semibold ${
                        columna.clave === 'fecha' ? 'text-left' : 'text-right'
                      }`}
                    >
                      {columna.etiqueta}
                    </th>
                  ))}
                  <th scope="col" className="w-56 px-3 py-2.5 text-right font-semibold">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {grupos.map((grupo) => (
                  <GrupoHistorial
                    key={grupo.clave}
                    grupo={grupo}
                    onSeleccionar={onSeleccionar}
                    esSeleccionado={esSeleccionado}
                    deshabilitado={deshabilitado}
                    detalleAbierto={detalleAbierto}
                    onAlternarDetalle={alternarDetalle}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  )
}

function GrupoHistorial({
  grupo,
  onSeleccionar,
  esSeleccionado,
  deshabilitado,
  detalleAbierto,
  onAlternarDetalle,
}) {
  return (
    <>
      <tr className="border-b border-outline-variant bg-surface-container-low/60">
        <th
          scope="colgroup"
          colSpan={COLUMNAS_HISTORIAL.length + 1}
          className="px-3 py-2 text-left font-semibold text-on-surface-variant"
        >
          {grupo.etiqueta}
        </th>
      </tr>
      {grupo.registros.map((registro, indice) => {
        const seleccionado = esSeleccionado(registro)
        const abierto = String(detalleAbierto) === String(claveRegistro(registro))
        return (
          <Fragment key={registro?.id ?? `${grupo.clave}-${indice}`}>
            <tr
              className={`border-b border-outline-variant/60 last:border-0 ${
                seleccionado ? 'bg-primary/5' : ''
              }`}
            >
              {COLUMNAS_HISTORIAL.map((columna) =>
                columna.clave === 'fecha' ? (
                  <th
                    key={columna.clave}
                    scope="row"
                    className={`border-l-2 px-3 py-2.5 text-left font-semibold text-on-surface ${
                      seleccionado ? 'border-primary' : 'border-transparent'
                    }`}
                  >
                    <span className="inline-flex flex-wrap items-center gap-2">
                      {fechaCorta(registro?.[columna.clave])}
                      {seleccionado && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-label-sm font-semibold text-primary">
                          En edición
                        </span>
                      )}
                    </span>
                  </th>
                ) : (
                  <td
                    key={columna.clave}
                    className="px-3 py-2.5 text-right tabular-nums text-on-surface"
                  >
                    {valorRegistro(registro, columna.clave)}
                  </td>
                ),
              )}
              <td className="px-3 py-2.5 text-right">
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <BotonDetalle
                    registro={registro}
                    vista="escritorio"
                    abierto={abierto}
                    onAlternar={onAlternarDetalle}
                  />
                  <BotonEditar
                    registro={registro}
                    onSeleccionar={onSeleccionar}
                    deshabilitado={deshabilitado}
                  />
                </div>
              </td>
            </tr>
            {abierto && (
              <tr className="border-b border-outline-variant/60 bg-surface-container-low/40">
                <td colSpan={COLUMNAS_HISTORIAL.length + 1} className="px-3 py-3">
                  <DetalleRegistro registro={registro} id={idDetalle(registro, 'escritorio')} />
                </td>
              </tr>
            )}
          </Fragment>
        )
      })}
    </>
  )
}
