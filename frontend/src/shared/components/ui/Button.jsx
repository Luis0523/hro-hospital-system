const variantes = {
  primary: 'bg-primary-container text-on-primary hover:brightness-110',
  secondary:
    'border border-outline-variant bg-surface-container-lowest text-primary hover:bg-surface-container-low',
  danger: 'bg-error text-on-error hover:brightness-110',
  ghost: 'bg-transparent text-on-surface-variant hover:bg-surface-container',
}

const tamanos = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-4 text-base',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  children,
  ...props
}) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hro-blue disabled:cursor-not-allowed disabled:opacity-60 ${variantes[variant]} ${tamanos[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
