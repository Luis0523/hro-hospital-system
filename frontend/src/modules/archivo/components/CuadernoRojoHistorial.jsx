import { Fragment, useEffect, useMemo, useState } from 'react'
import { Button, EmptyState, Icon } from '@/shared/components/ui'
import { COLUMNAS_HISTORIAL } from '../cuadernoRojoCampos'
import { agruparPorMesAnio } from '../utils/agruparHistorial'
import CuadernoRojoRangoFechas from './CuadernoRojoRangoFechas.jsx'

const COLUMNAS_CANTIDAD = COLUMNAS_HISTORIAL.filter((columna) => columna.clave !== 'fecha')

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

function BotonEditar({ registro, onEditar }) {
  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      className="min-h-11"
      onClick={() => onEditar?.(registro)}
      aria-label={`Editar registro del ${fechaCorta(registro?.fecha)}`}
    >
      <Icon name="edit" className="text-[16px]" />
      Editar
    </Button>
  )
}

function BotonEliminar({ registro, onEliminar, puedeEliminar }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="min-h-11 !text-error hover:!bg-error-container/40"
      onClick={() => onEliminar?.(registro)}
      disabled={!puedeEliminar}
      title={
        puedeEliminar ? 'Eliminar registro' : 'Eliminar no disponible: el backend no expone DELETE'
      }
      aria-label={
        puedeEliminar
          ? `Eliminar registro del ${fechaCorta(registro?.fecha)}`
          : `Eliminar no disponible para el registro del ${fechaCorta(registro?.fecha)}`
      }
    >
      <Icon name="delete" className="text-[16px]" />
      Eliminar
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

function ResumenCuaderno({ registros }) {
  const resumen = useMemo(
    () =>
      registros.reduce(
        (acumulado, registro) => ({
          dias: acumulado.dias + 1,
          egresos: acumulado.egresos + (Number(registro.egresosHospitalarios) || 0),
          emergencia: acumulado.emergencia + (Number(registro.sobresEmergencia) || 0),
          sellados: acumulado.sellados + (Number(registro.sobresSellados) || 0),
          tia: acumulado.tia + (Number(registro.tia) || 0),
        }),
        { dias: 0, egresos: 0, emergencia: 0, sellados: 0, tia: 0 },
      ),
    [registros],
  )

  const metricas = [
    { etiqueta: 'Días registrados', valor: resumen.dias },
    { etiqueta: 'Egresos hospitalarios', valor: resumen.egresos },
    { etiqueta: 'Sobres emergencia', valor: resumen.emergencia },
    { etiqueta: 'Sobres sellados', valor: resumen.sellados },
    { etiqueta: 'TIA', valor: resumen.tia },
  ]

  return (
    <dl
      aria-label="Resumen estadístico del período"
      className="grid grid-cols-2 gap-2 sm:grid-cols-5 sm:gap-1.5"
    >
      {metricas.map((metrica, indice) => (
        <div
          key={metrica.etiqueta}
          className={`rounded-lg border border-outline-variant/70 border-l-4 border-l-primary/70 bg-surface-container-lowest px-2.5 py-1.5 sm:px-1.5 sm:py-1 ${
            indice === 0 ? 'col-span-2 sm:col-span-1' : ''
          }`}
        >
          <dt className="text-[10px] font-semibold uppercase leading-tight tracking-normal text-on-surface-variant sm:text-[9px] lg:text-[10px]">
            {metrica.etiqueta}
          </dt>
          <dd className="text-metric-sub tabular-nums text-primary">{metrica.valor}</dd>
        </div>
      ))}
    </dl>
  )
}

/**
 * Tabla principal del Cuaderno Rojo: resumen, rango de fechas, reporte,
 * registros y detalle de trazabilidad.
 */
export default function CuadernoRojoHistorial({
  registros = [],
  cargando = false,
  progreso = { completados: 0, total: 0 },
  filtros = { desde: '', hasta: '' },
  onAplicarFiltros,
  onRestablecer,
  onEditar,
  onEliminar,
  puedeEliminar = false,
  onGenerarPdf,
}) {
  const grupos = agruparPorMesAnio(registros)
  const vacio = registros.length === 0
  const [detalleAbierto, setDetalleAbierto] = useState(null)

  useEffect(() => {
    setDetalleAbierto(null)
  }, [filtros?.desde, filtros?.hasta])

  useEffect(() => {
    if (!detalleAbierto) return
    const sigueEnLista = registros.some(
      (registro) => String(claveRegistro(registro)) === detalleAbierto,
    )
    if (!sigueEnLista) setDetalleAbierto(null)
  }, [registros, detalleAbierto])

  const alternarDetalle = (registro) => {
    const clave = String(claveRegistro(registro) ?? '')
    if (!clave) return
    setDetalleAbierto((actual) => (actual === clave ? null : clave))
  }

  const porcentaje =
    progreso.total > 0 ? Math.round((progreso.completados / progreso.total) * 100) : 0

  return (
    <section aria-label="Registros del Cuaderno Rojo" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-title-md text-on-surface">Registros</h3>
        </div>

        <Button
          type="button"
          variant="secondary"
          onClick={onGenerarPdf}
          disabled={cargando || vacio}
          className="min-h-11 w-full sm:w-auto"
        >
          <Icon name="picture_as_pdf" className="text-[18px]" />
          Generar reporte PDF
        </Button>
      </div>

      {!cargando && !vacio && <ResumenCuaderno registros={registros} />}

      <CuadernoRojoRangoFechas
        filtros={filtros}
        onAplicar={onAplicarFiltros}
        onRestablecer={onRestablecer}
        cargando={cargando}
      />

      {cargando ? (
        <div className="space-y-2 rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
          <p className="text-body-sm text-on-surface-variant" role="status">
            {progreso.total > 1
              ? `Consultando ${progreso.completados} de ${progreso.total} años…`
              : 'Consultando registros…'}
          </p>
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-container-high">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-200"
              style={{ width: `${porcentaje}%` }}
            />
          </div>
        </div>
      ) : vacio ? (
        <EmptyState
          title="Sin registros en el período seleccionado"
          description="Ajuste el rango de fechas o registre un nuevo día."
        />
      ) : (
        <>
          {/* Móvil y tablet: filas agrupadas por mes */}
          <div
            data-testid="historial-scroll-movil"
            role="region"
            aria-label="Listado de registros del Cuaderno Rojo"
            tabIndex={0}
            className="max-h-[520px] space-y-5 overflow-y-auto pr-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hro-blue xl:hidden"
          >
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
                    const abierto = String(detalleAbierto) === String(claveRegistro(registro))
                    return (
                      <li
                        key={registro?.id ?? `${grupo.clave}-${indice}`}
                        className={`p-3 sm:p-4 ${abierto ? 'bg-surface-container-low/60' : ''}`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-title-sm font-semibold text-on-surface">
                            {fechaCorta(registro?.fecha)}
                          </p>
                          <div className="flex flex-wrap items-center justify-end gap-1">
                            <BotonDetalle
                              registro={registro}
                              vista="movil"
                              abierto={abierto}
                              onAlternar={alternarDetalle}
                            />
                            <BotonEditar registro={registro} onEditar={onEditar} />
                            <BotonEliminar
                              registro={registro}
                              onEliminar={onEliminar}
                              puedeEliminar={puedeEliminar}
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

          {/* Escritorio amplio: tabla compacta con scroll interno */}
          <div className="hidden overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest xl:block">
            <div
              data-testid="historial-scroll-escritorio"
              role="region"
              aria-label="Listado de registros del Cuaderno Rojo"
              tabIndex={0}
              className="max-h-[520px] overflow-y-auto focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hro-blue"
            >
              <table className="w-full min-w-[48rem] border-collapse text-left text-sm">
                <caption className="sr-only">Registros del Cuaderno Rojo</caption>
                <thead>
                  <tr className="border-b border-outline-variant bg-surface-container-low text-on-surface-variant">
                    {COLUMNAS_HISTORIAL.map((columna) => (
                      <th
                        key={columna.clave}
                        scope="col"
                        className={`sticky top-0 z-10 bg-surface-container-low px-3 py-2.5 font-semibold ${
                          columna.clave === 'fecha' ? 'text-left' : 'text-right'
                        }`}
                      >
                        {columna.etiqueta}
                      </th>
                    ))}
                    <th
                      scope="col"
                      className="sticky top-0 z-10 w-80 bg-surface-container-low px-3 py-2.5 text-right font-semibold"
                    >
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {grupos.map((grupo) => (
                    <GrupoHistorial
                      key={grupo.clave}
                      grupo={grupo}
                      onEditar={onEditar}
                      onEliminar={onEliminar}
                      puedeEliminar={puedeEliminar}
                      detalleAbierto={detalleAbierto}
                      onAlternarDetalle={alternarDetalle}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </section>
  )
}

function GrupoHistorial({
  grupo,
  onEditar,
  onEliminar,
  puedeEliminar,
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
        const abierto = String(detalleAbierto) === String(claveRegistro(registro))
        return (
          <Fragment key={registro?.id ?? `${grupo.clave}-${indice}`}>
            <tr
              className={`border-b border-outline-variant/60 ${
                abierto ? 'bg-surface-container-low/60' : ''
              }`}
            >
              {COLUMNAS_HISTORIAL.map((columna) =>
                columna.clave === 'fecha' ? (
                  <th
                    key={columna.clave}
                    scope="row"
                    className="px-3 py-2.5 text-left font-semibold text-on-surface"
                  >
                    {fechaCorta(registro?.fecha)}
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
                <div className="flex flex-wrap items-center justify-end gap-1">
                  <BotonEditar registro={registro} onEditar={onEditar} />
                  <BotonDetalle
                    registro={registro}
                    vista="escritorio"
                    abierto={abierto}
                    onAlternar={onAlternarDetalle}
                  />
                  <BotonEliminar
                    registro={registro}
                    onEliminar={onEliminar}
                    puedeEliminar={puedeEliminar}
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
