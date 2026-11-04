import Button from '@/shared/components/ui/Button.jsx'
import Icon from '@/shared/components/ui/Icon.jsx'
import Select from '@/shared/components/ui/Select.jsx'
import { formatearFechaCorta } from '@/shared/utils/fecha'

function Dato({ etiqueta, valor }) {
  return (
    <div className="min-w-0">
      <dt className="text-body-sm uppercase tracking-wide text-on-surface-variant">{etiqueta}</dt>
      <dd className="break-words text-title-sm text-on-surface">{valor || '—'}</dd>
    </div>
  )
}

function Paso({ numero, hecho, children }) {
  return (
    <li className="flex items-center gap-2 text-on-surface-variant">
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[13px] ${
          hecho
            ? 'border-emerald-600 bg-emerald-600 text-white'
            : 'border-outline-variant text-on-surface-variant'
        }`}
      >
        {hecho ? <Icon name="check" className="text-[15px]" /> : numero}
      </span>
      <span className={hecho ? 'text-on-surface' : undefined}>{children}</span>
    </li>
  )
}

export default function ResumenSolicitud({
  paciente,
  solicitud,
  faltantes = [],
  formato,
  onFormatoChange,
  onImprimir,
  puedeImprimir,
  impresionRealizada,
  formatoSugerido,
}) {
  if (!paciente) return null

  const nombre = [paciente.nombres, paciente.apellidos].filter(Boolean).join(' ').trim()
  const totalMedicamentos = solicitud.medicamentos.length
  const etiquetaFormato = formatoSugerido === '1' ? 'Formato No. 1' : 'Formato No. 2'

  const opcionesFormato = [
    { value: 'auto', label: `Automático · ${etiquetaFormato}` },
    { value: '1', label: 'Formato No. 1 (un medicamento por hoja)' },
    { value: '2', label: 'Formato No. 2 (varios medicamentos)' },
    { value: 'ambos', label: 'Imprimir ambos formatos' },
  ]

  return (
    <aside
      aria-label="Resumen de la solicitud"
      className="space-y-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-card lg:sticky lg:top-4 lg:self-start"
    >
      <div>
        <h3 className="text-headline-sm text-on-surface">Resumen</h3>
        <p className="text-body-sm text-on-surface-variant">
          Paciente y estado de la solicitud en todo momento.
        </p>
      </div>

      <div className="rounded-lg bg-surface-container-low p-3">
        <p className="text-title-md text-on-surface">{nombre}</p>
        <p className="text-body-sm text-on-surface-variant">
          Exp. {paciente.numeroExpediente || '—'} · Cama {solicitud.cama || '—'}
        </p>
        <p className="text-body-sm text-on-surface-variant">
          {solicitud.servicio || 'Servicio sin indicar'}
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-3">
        <Dato etiqueta="Fecha" valor={formatearFechaCorta(solicitud.fecha)} />
        <Dato etiqueta="Medicamentos" valor={String(totalMedicamentos)} />
      </dl>

      <ol aria-label="Estado del recetario" className="space-y-2 text-body-sm">
        <Paso numero={1} hecho>
          Solicitud creada
        </Paso>
        <Paso numero={2} hecho={impresionRealizada}>
          Documento {impresionRealizada ? 'impreso' : 'sin imprimir'}
        </Paso>
      </ol>

      <div className="space-y-2 border-t border-outline-variant pt-3">
        <Select
          label="Formato de impresión"
          value={formato}
          onChange={onFormatoChange}
          options={opcionesFormato}
          ariaLabel="Formato de impresión"
        />
        <Button
          onClick={onImprimir}
          disabled={!puedeImprimir}
          className="w-full"
          title="Imprime el PDF y guarda una copia en el historial"
        >
          <Icon name="print" className="text-[18px]" />
          Imprimir y Guardar
        </Button>
        {!puedeImprimir && (
          <p className="text-body-sm text-amber-700">Falta: {faltantes.join(', ')}.</p>
        )}
      </div>
    </aside>
  )
}
