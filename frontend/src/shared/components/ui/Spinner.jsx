export default function Spinner({ label = 'Cargando...' }) {
  return (
    <div
      role="status"
      className="flex items-center justify-center gap-3 py-8 text-sm text-on-surface-variant"
    >
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-outline-variant border-t-primary-container" />
      {label}
    </div>
  )
}
