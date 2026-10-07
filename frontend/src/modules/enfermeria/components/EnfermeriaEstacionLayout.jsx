import AppShell from '@/shared/components/AppShell.jsx'
import { SECCIONES_ENFERMERIA } from '../seccionesEnfermeria'

// Envoltura de las vistas de la estación de enfermería (submenú lateral).
export default function EnfermeriaEstacionLayout({ children }) {
  return (
    <AppShell
      titulo="Estación de Enfermería"
      icono="medical_services"
      secciones={SECCIONES_ENFERMERIA}
    >
      {children}
    </AppShell>
  )
}
