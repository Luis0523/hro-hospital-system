import Icon from './Icon.jsx'

const tonos = {
  info: 'bg-primary-container text-on-primary',
  success: 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-emerald-950',
  warning: 'bg-amber-500 text-white dark:bg-amber-400 dark:text-amber-950',
  error: 'bg-error text-on-error',
}

export default function Toast({ toast }) {
  if (!toast) return null
  return (
    <div className="pointer-events-none fixed right-4 top-32 z-50">
      <div
        role="status"
        className={`flex items-center gap-3 rounded-xl px-5 py-3 shadow-modal ${
          tonos[toast.tone] ?? tonos.info
        }`}
      >
        <Icon name="notifications_active" className="text-[24px]" />
        <div className="flex flex-col">
          <span className="text-title-sm font-bold">{toast.title}</span>
          {toast.message && <span className="text-body-sm">{toast.message}</span>}
        </div>
      </div>
    </div>
  )
}
