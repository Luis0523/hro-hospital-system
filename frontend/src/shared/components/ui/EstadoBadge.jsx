const estilos = {
  pendiente: 'bg-amber-100 text-amber-800',
  confirmada: 'bg-cyan-100 text-cyan-800',
  atendida: 'bg-emerald-100 text-emerald-800',
  atendido: 'bg-emerald-100 text-emerald-800',
  cancelada: 'bg-red-100 text-red-700',
  reprogramada: 'bg-indigo-100 text-indigo-800',
  no_asistio: 'bg-slate-200 text-slate-600',
  en_espera: 'bg-cyan-100 text-cyan-800',
  llamado: 'bg-blue-100 text-blue-800',
  no_responde: 'bg-red-100 text-red-700',
  reintegrado: 'bg-indigo-100 text-indigo-800',
}

export default function EstadoBadge({ estado }) {
  const etiqueta = String(estado ?? '').replace(/_/g, ' ')
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-semibold capitalize ${
        estilos[estado] ?? 'bg-slate-100 text-slate-600'
      }`}
    >
      {etiqueta}
    </span>
  )
}
