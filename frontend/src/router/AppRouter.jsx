import { Navigate, Route, Routes } from 'react-router-dom'
import ArchivoPage from '@/modules/archivo/pages/ArchivoPage.jsx'
import DepuracionExpedientesPage from '@/modules/archivo/pages/DepuracionExpedientesPage.jsx'
import SalidasExternasPage from '@/modules/archivo/pages/SalidasExternasPage.jsx'
import MesaCoexPage from '@/modules/coex/pages/MesaCoexPage.jsx'
import EnfermeriaPage from '@/modules/enfermeria/pages/EnfermeriaPage.jsx'
import SeleccionEstacionPage from '@/modules/enfermeria/pages/SeleccionEstacionPage.jsx'
import SesionCerradaPage from '@/modules/enfermeria/pages/SesionCerradaPage.jsx'
import ProtectedRoute from './ProtectedRoute.jsx'
import RequiereEstacion from './RequiereEstacion.jsx'
import TableroPage from '@/modules/tablero/pages/TableroPage.jsx'
import AdministracionLayout from '@/modules/administracion/AdministracionLayout.jsx'
import DashboardPage from '@/modules/administracion/pages/DashboardPage.jsx'
import UsuariosPage from '@/modules/administracion/pages/UsuariosPage.jsx'
import ClinicasPage from '@/modules/administracion/pages/ClinicasPage.jsx'
import CuposPage from '@/modules/administracion/pages/CuposPage.jsx'
import CalendarioPage from '@/modules/administracion/pages/CalendarioPage.jsx'
import ReportesPage from '@/modules/administracion/pages/ReportesPage.jsx'
import AuditoriaPage from '@/modules/administracion/pages/AuditoriaPage.jsx'
import RequiereRol from './RequiereRol.jsx'
import JefeEnfermeriaLayout from '@/modules/jefeEnfermeria/JefeEnfermeriaLayout.jsx'
import CroquisPage from '@/modules/jefeEnfermeria/pages/CroquisPage.jsx'
import HorariosPage from '@/modules/jefeEnfermeria/pages/HorariosPage.jsx'
import EstacionesJefePage from '@/modules/jefeEnfermeria/pages/EstacionesPage.jsx'
import ReportesJefePage from '@/modules/jefeEnfermeria/pages/ReportesPage.jsx'

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/enfermeria" replace />} />

      <Route
        path="/enfermeria"
        element={
          <ProtectedRoute>
            <RequiereEstacion>
              <EnfermeriaPage />
            </RequiereEstacion>
          </ProtectedRoute>
        }
      />
      <Route path="/seleccion-estacion" element={<SeleccionEstacionPage />} />
      <Route path="/sesion-cerrada" element={<SesionCerradaPage />} />

      <Route path="/archivo" element={<ArchivoPage />} />
      <Route path="/archivo/depuracion" element={<DepuracionExpedientesPage />} />
      <Route path="/archivo/salidas-externas" element={<SalidasExternasPage />} />

      <Route path="/coex" element={<MesaCoexPage />} />

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

      <Route path="/tablero" element={<TableroPage />} />

      <Route
        path="/jefe-enfermeria"
        element={
          <RequiereRol>
            <JefeEnfermeriaLayout />
          </RequiereRol>
        }
      >
        <Route index element={<CroquisPage />} />
        <Route path="horarios" element={<HorariosPage />} />
        <Route path="estaciones" element={<EstacionesJefePage />} />
        <Route path="reportes" element={<ReportesJefePage />} />
        <Route path="*" element={<Navigate to="/jefe-enfermeria" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/enfermeria" replace />} />
    </Routes>
  )
}
