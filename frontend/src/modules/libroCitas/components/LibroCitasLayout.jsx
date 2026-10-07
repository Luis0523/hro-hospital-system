import AppShell from '@/shared/components/AppShell.jsx'

const SECCIONES = [
  { to: '/libro-citas', etiqueta: 'Libro de Citas', icono: 'menu_book', exacto: true },
]

// Envoltura de la vista Libro de Citas: barra lateral izquierda colapsable con
// el tema, los datos del usuario y el cierre de sesión; encabezado compacto.
export default function LibroCitasLayout({ children }) {
  return (
    <AppShell titulo="Libro de Citas" icono="menu_book" secciones={SECCIONES}>
      {children}
    </AppShell>
  )
}
