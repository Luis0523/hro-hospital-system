export default function Input({ label, error, hint, className = '', id, ...props }) {
  const inputId = id || props.name
  return (
    <label className="block space-y-1" htmlFor={inputId}>
      {label && <span className="block text-sm font-medium text-slate-700">{label}</span>}
      <input
        id={inputId}
        className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-cyan-100 ${
          error ? 'border-red-400 focus:border-red-500' : 'border-slate-300 focus:border-hro-blue'
        } ${className}`}
        aria-invalid={Boolean(error)}
        {...props}
      />
      {hint && !error && <span className="block text-xs text-slate-400">{hint}</span>}
      {error && <span className="block text-xs text-red-600">{error}</span>}
    </label>
  )
}
