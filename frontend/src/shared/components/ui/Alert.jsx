const tonos = {
  info: 'border-cyan-200 bg-cyan-50 text-cyan-800',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  error: 'border-red-200 bg-red-50 text-red-700',
}

export default function Alert({ tone = 'info', title, children }) {
  return (
    <div role="alert" className={`rounded-xl border px-4 py-3 text-sm ${tonos[tone]}`}>
      {title && <p className="font-semibold">{title}</p>}
      {children}
    </div>
  )
}
