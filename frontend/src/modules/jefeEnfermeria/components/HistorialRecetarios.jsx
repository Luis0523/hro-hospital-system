import { useState } from 'react'
import Button from '@/shared/components/ui/Button.jsx'
import EmptyState from '@/shared/components/ui/EmptyState.jsx'
import Icon from '@/shared/components/ui/Icon.jsx'
import Input from '@/shared/components/ui/Input.jsx'
import { formatearFechaCorta, formatearFechaHoraCorta } from '@/shared/utils/fecha'

function fechaGeneracion(valor) {
  if (!valor) return ''
  const fecha = new Date(valor)
  if (Number.isNaN(fecha.getTime())) return valor
  return fecha.toLocaleString('es-GT', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function etiquetaFormato(formato) {
  if (formato === '1') return 'Formato No. 1'
  if (formato === '2') return 'Formato No. 2'
  if (formato === 'ambos') return 'Ambos formatos'
  return 'Formato'
}

function Dato({ etiqueta, valor }) {
  return (
    <div className="min-w-0">
      <dt className="text-body-sm uppercase tracking-wide text-on-surface-variant">{etiqueta}</dt>
      <dd className="break-words text-title-sm text-on-surface">{valor || '—'}</dd>
    </div>
  )
}

function Detalle({ entrada, onVolver, onReimprimir }) {
  const solicitud = entrada.solicitud
  const paciente = solicitud.paciente
  const nombre = [paciente.nombres, paciente.apellidos].filter(Boolean).join(' ').trim()

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={onVolver}>
          <Icon name="arrow_back" className="text-[16px]" />
          Volver al historial
        </Button>
        <Button size="sm" onClick={() => onReimprimir(entrada)}>
          <Icon name="print" className="text-[16px]" />
          Reimprimir
        </Button>
      </div>

      <div className="rounded-lg bg-surface-container-low p-3">
        <p className="text-title-md text-on-surface">{nombre || 'Sin nombre'}</p>
        <p className="text-body-sm text-on-surface-variant">
          Exp. {paciente.numeroExpediente || '—'} · {etiquetaFormato(entrada.formato)}
        </p>
        <p className="text-body-sm text-on-surface-variant">
          Generado el {fechaGeneracion(entrada.generadoEn)}
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Dato etiqueta="Fecha" valor={formatearFechaCorta(solicitud.fecha)} />
        <Dato etiqueta="Cama" valor={solicitud.cama} />
        <Dato etiqueta="Servicio" valor={solicitud.servicio} />
        <Dato etiqueta="Diagnóstico" valor={solicitud.diagnostico} />
        <Dato etiqueta="Médico" valor={solicitud.medicoNombre} />
      </dl>

      <section className="space-y-2">
        <h4 className="text-title-md text-on-surface">
          Medicamentos ({solicitud.medicamentos.length})
        </h4>
        <ul className="space-y-2">
          {solicitud.medicamentos.map((medicamento) => (
            <li
              key={medicamento.id}
              className="rounded-lg border border-outline-variant bg-surface-container-lowest p-3"
            >
              <p className="text-title-sm font-semibold text-on-surface">{medicamento.nombre}</p>
              <p className="text-body-sm text-on-surface-variant">
                {[medicamento.dosis, medicamento.via, medicamento.frecuencia]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
              <p className="text-body-sm text-on-surface-variant">
                Inicio: {formatearFechaHoraCorta(medicamento.fechaHoraInicio)} · Cantidad:{' '}
                {medicamento.cantidadSolicitada}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {solicitud.observaciones && (
        <section>
          <h4 className="text-title-md text-on-surface">Observaciones</h4>
          <p className="text-body-sm text-on-surface-variant">{solicitud.observaciones}</p>
        </section>
      )}

      <p className="text-label-sm text-on-surface-variant">
        Vista de solo lectura. Para cambiar datos debe crear una nueva solicitud.
      </p>
    </div>
  )
}

export default function HistorialRecetarios({ entradas = [], onReimprimir, onLimpiar }) {
  const [seleccionada, setSeleccionada] = useState(null)
  const [filtro, setFiltro] = useState('')

  const termino = filtro.trim().toLowerCase()
  const visibles = termino
    ? entradas.filter(
        (entrada) =>
          String(entrada.expediente ?? '')
            .toLowerCase()
            .includes(termino) ||
          String(entrada.pacienteNombre ?? '')
            .toLowerCase()
            .includes(termino),
      )
    : entradas

  if (seleccionada) {
    return (
      <Detalle
        entrada={seleccionada}
        onVolver={() => setSeleccionada(null)}
        onReimprimir={onReimprimir}
      />
    )
  }

  if (entradas.length === 0) {
    return (
      <EmptyState
        title="Sin recetarios en el historial"
        description="Los recetarios que imprima aparecerán aquí para consultarlos y reimprimirlos."
      />
    )
  }

  function confirmarLimpiar() {
    const confirmado =
      typeof window === 'undefined' ||
      window.confirm('¿Vaciar el historial de recetarios? Esta acción no se puede deshacer.')
    if (confirmado) onLimpiar()
  }

  return (
    <div className="space-y-3">
      <Input
        name="buscarHistorial"
        value={filtro}
        onChange={(evento) => setFiltro(evento.target.value)}
        placeholder="Buscar por número de expediente o paciente"
        aria-label="Buscar recetario por número de expediente"
        autoComplete="off"
        autoFocus
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-body-sm text-on-surface-variant">
          {visibles.length}
          {termino ? ` de ${entradas.length}` : ''} recetario
          {entradas.length === 1 ? '' : 's'} · solo lectura
        </p>
        <Button variant="ghost" size="sm" onClick={confirmarLimpiar}>
          <Icon name="delete_sweep" className="text-[16px]" />
          Vaciar historial
        </Button>
      </div>

      {visibles.length === 0 ? (
        <EmptyState
          title="Sin coincidencias"
          description="No hay recetarios para ese número de expediente o paciente."
        />
      ) : (
        <ul className="space-y-2">
          {visibles.map((entrada) => (
            <li
              key={entrada.id}
              className="flex flex-col gap-3 rounded-lg border border-outline-variant bg-surface-container-lowest p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="text-title-sm font-semibold text-on-surface">
                  {entrada.pacienteNombre || 'Sin nombre'}
                </p>
                <p className="text-body-sm text-on-surface-variant">
                  Exp. {entrada.expediente || '—'} · {fechaGeneracion(entrada.generadoEn)}
                </p>
                <p className="text-body-sm text-on-surface-variant">
                  {etiquetaFormato(entrada.formato)} · {entrada.solicitud.medicamentos.length}{' '}
                  medicamento
                  {entrada.solicitud.medicamentos.length === 1 ? '' : 's'}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => setSeleccionada(entrada)}>
                  <Icon name="visibility" className="text-[16px]" />
                  Ver
                </Button>
                <Button size="sm" onClick={() => onReimprimir(entrada)}>
                  <Icon name="print" className="text-[16px]" />
                  Reimprimir
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
