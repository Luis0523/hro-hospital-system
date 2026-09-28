export default function EmptyState({ title, description, action }) {
  return (
    <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest px-4 py-10 text-center">
      <p className="text-sm font-semibold text-on-surface">{title}</p>
      {description && <p className="mt-1 text-sm text-on-surface-variant">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
