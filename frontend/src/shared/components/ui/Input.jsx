export default function Input({ label, error, hint, className = '', id, ...props }) {
  const inputId = id || props.name
  return (
    <label className="block space-y-1" htmlFor={inputId}>
      {label && <span className="block text-sm font-medium text-on-surface">{label}</span>}
      <input
        id={inputId}
        className={`w-full rounded-lg border bg-surface-container-lowest px-4 py-2.5 text-sm text-on-surface outline-none transition focus:ring-2 focus:ring-secondary-fixed-dim ${
          error
            ? 'border-error focus:border-error'
            : 'border-outline-variant focus:border-primary-container'
        } ${className}`}
        aria-invalid={Boolean(error)}
        {...props}
      />
      {hint && !error && <span className="block text-xs text-on-surface-variant">{hint}</span>}
      {error && <span className="block text-xs text-error">{error}</span>}
    </label>
  )
}
