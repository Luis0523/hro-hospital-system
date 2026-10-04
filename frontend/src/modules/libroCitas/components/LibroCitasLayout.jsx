import LibroCitasHeader from './LibroCitasHeader.jsx'
import LibroCitasNavbar from './LibroCitasNavbar.jsx'

// Envoltura de la vista Libro de Citas: encabezado + navegación propia.
// Deliberadamente NO reutiliza ArchivoLayout para no acoplar el módulo a la
// identidad ni a la navegación de la Estación de Archivo.
export default function LibroCitasLayout({ children }) {
  return (
    <div className="min-h-screen bg-surface pb-10">
      <LibroCitasHeader />
      <LibroCitasNavbar />
      {children}
    </div>
  )
}
