import { Navigate, Route, Routes } from 'react-router-dom'
import EnfermeriaPage from '@/modules/enfermeria/pages/EnfermeriaPage.jsx'
import EstacionNoDisponible from '@/shared/components/EstacionNoDisponible.jsx'
import AdministracionLayout from '@/modules/administracion/AdministracionLayout.jsx'
import DashboardPage from '@/modules/administracion/pages/DashboardPage.jsx'
import UsuariosPage from '@/modules/administracion/pages/UsuariosPage.jsx'
import ClinicasPage from '@/modules/administracion/pages/ClinicasPage.jsx'
import CuposPage from '@/modules/administracion/pages/CuposPage.jsx'
import CalendarioPage from '@/modules/administracion/pages/CalendarioPage.jsx'
import ReportesPage from '@/modules/administracion/pages/ReportesPage.jsx'
import AuditoriaPage from '@/modules/administracion/pages/AuditoriaPage.jsx'

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/enfermeria" replace />} />

      <Route path="/enfermeria" element={<EnfermeriaPage />} />

      <Route path="/archivo" element={<EstacionNoDisponible nombre="Estación de Archivo" />} />

      <Route path="/administracion" element={<AdministracionLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="usuarios" element={<UsuariosPage />} />
        <Route path="clinicas" element={<ClinicasPage />} />
        <Route path="cupos" element={<CuposPage />} />
        <Route path="calendario" element={<CalendarioPage />} />
        <Route path="reportes" element={<ReportesPage />} />
        <Route path="auditoria" element={<AuditoriaPage />} />
        <Route path="*" element={<Navigate to="/administracion" replace />} />
      </Route>

      <Route path="/tablero" element={<EstacionNoDisponible nombre="Tablero de Turnos" />} />

      <Route path="*" element={<Navigate to="/enfermeria" replace />} />
    </Routes>
  )
}
