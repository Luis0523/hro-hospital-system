export default function Spinner({ label = 'Cargando...' }) {
  return (
    <div
      role="status"
      className="flex items-center justify-center gap-3 py-8 text-sm text-slate-500"
    >
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-hro-blue" />
      {label}
    </div>
  )
}
