import { Icon, Table } from '@/shared/components/ui'

const COLUMNAS = [
  { key: 'hora', label: 'Hora' },
  { key: 'numeroExpediente', label: 'Expediente' },
  { key: 'pacienteNombre', label: 'Paciente' },
  { key: 'usuarioNombre', label: 'Usuario' },
  { key: 'motivo', label: 'Motivo' },
]

function horaDe(registro) {
  if (!registro?.depuradoEn) return ''
  const fecha = new Date(registro.depuradoEn)
  if (Number.isNaN(fecha.getTime())) return ''
  return fecha.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit', hour12: false })
}

// Bitácora del día de expedientes depurados. Sin correlativo (a diferencia del
// registro de carnets). Presentacional.
export default function TablaDepurados({ depurados = [] }) {
  return (
    <section className="space-y-3 rounded-xl bg-surface-container-lowest p-4 shadow-card">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1 text-title-md font-bold text-on-surface">
          <Icon name="history" className="text-[20px] text-primary" />
          Depurados hoy
        </span>
        <span className="rounded bg-primary/10 px-2 py-0.5 text-label-sm font-bold text-primary">
          Total: {depurados.length}
        </span>
      </div>

      <Table
        columns={COLUMNAS}
        data={depurados}
        emptyMessage="Aún no hay expedientes depurados hoy"
        renderCell={(fila, clave) => {
          if (clave === 'hora') {
            return <span className="font-mono text-on-surface-variant">{horaDe(fila)}</span>
          }
          if (clave === 'numeroExpediente') {
            return (
              <span className="font-mono font-semibold text-primary">{fila.numeroExpediente}</span>
            )
          }
          if (clave === 'motivo') {
            return (
              <span className="text-on-surface-variant" title={fila.motivo ?? ''}>
                {fila.motivo || '—'}
              </span>
            )
          }
          return fila[clave]
        }}
      />
    </section>
  )
}
