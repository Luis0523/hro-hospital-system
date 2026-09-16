export default function Card({ as: Etiqueta = 'div', className = '', children }) {
  return (
    <Etiqueta className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ${className}`}>
      {children}
    </Etiqueta>
  )
}
