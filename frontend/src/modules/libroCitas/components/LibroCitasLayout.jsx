import LibroCitasHeader from './LibroCitasHeader.jsx'

// Envoltura de la vista Libro de Citas: encabezado + contenido. La navegación
// secundaria se retiró; el cierre de sesión y el tema viven en el header.
export default function LibroCitasLayout({ children }) {
  return (
    <div className="min-h-screen bg-surface pb-10">
      <LibroCitasHeader />
      {children}
    </div>
  )
}
