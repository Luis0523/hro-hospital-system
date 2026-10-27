import { Outlet } from 'react-router-dom'
import AppShell from '@/shared/components/AppShell.jsx'
import { SECCIONES_JEFE_ARCHIVO } from './seccionesJefeArchivo'

// Envoltura del área administrativa del Jefe de Archivo (rol jefe_archivo).
// Se usa como ruta padre, por eso renderiza el Outlet de la página hija.
export default function JefeArchivoLayout() {
  return (
    <AppShell titulo="Jefatura de Archivo" icono="folder_shared" secciones={SECCIONES_JEFE_ARCHIVO}>
      <Outlet />
    </AppShell>
  )
}
