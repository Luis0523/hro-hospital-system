const tonos = {
  info: 'border-cyan-200 bg-cyan-50 text-cyan-800 dark:border-cyan-800 dark:bg-cyan-950 dark:text-cyan-200',
  success:
    'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200',
  warning:
    'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200',
  error:
    'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-200',
}

export default function Alert({ tone = 'info', title, children }) {
  return (
    <div role="alert" className={`rounded-xl border px-4 py-3 text-sm ${tonos[tone]}`}>
      {title && <p className="font-semibold">{title}</p>}
      {children}
    </div>
  )
}
