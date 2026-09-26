export default function Card({ as: Etiqueta = 'div', className = '', children }) {
  return (
    <Etiqueta
      className={`rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-card ${className}`}
    >
      {children}
    </Etiqueta>
  )
}
