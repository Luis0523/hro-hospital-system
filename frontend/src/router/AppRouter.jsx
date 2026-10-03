import { Navigate, Route, Routes } from 'react-router-dom'
import ArchivoPage from '@/modules/archivo/pages/ArchivoPage.jsx'
import DepuracionExpedientesPage from '@/modules/archivo/pages/DepuracionExpedientesPage.jsx'
import SalidasExternasPage from '@/modules/archivo/pages/SalidasExternasPage.jsx'
import EnfermeriaPage from '@/modules/enfermeria/pages/EnfermeriaPage.jsx'
import SeleccionEstacionPage from '@/modules/enfermeria/pages/SeleccionEstacionPage.jsx'
import SesionCerradaPage from '@/modules/enfermeria/pages/SesionCerradaPage.jsx'
import LoginPage from '@/modules/login/pages/LoginPage.jsx'
import SinAccesoPage from '@/modules/login/pages/SinAccesoPage.jsx'
import RutaPrivada from './RutaPrivada.jsx'
import RutaPorRol from './RutaPorRol.jsx'
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
import JefeEnfermeriaLayout from '@/modules/jefeEnfermeria/JefeEnfermeriaLayout.jsx'
import CroquisPage from '@/modules/jefeEnfermeria/pages/CroquisPage.jsx'
import HorariosPage from '@/modules/jefeEnfermeria/pages/HorariosPage.jsx'
import EstacionesJefePage from '@/modules/jefeEnfermeria/pages/EstacionesPage.jsx'
import ReportesJefePage from '@/modules/jefeEnfermeria/pages/ReportesPage.jsx'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import { inicioPorRol } from '@/shared/api/authApi.js'

// Roles autorizados por área. `administrador` es transversal.
const ROLES_ENFERMERIA = ['enfermeria', 'medico', 'personal_citas', 'administrador']
const ROLES_ARCHIVO = ['archivo', 'administrador']
const ROLES_ADMINISTRACION = ['administrador']
const ROLES_JEFE_ENFERMERIA = ['jefe_enfermeria', 'administrador']

function InicioPorRol() {
  const { usuario } = useAuth()
  return <Navigate to={inicioPorRol(usuario?.rol)} replace />
}

export default function AppRouter() {
  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/sesion-cerrada" element={<SesionCerradaPage />} />
      <Route path="/sin-acceso" element={<SinAccesoPage />} />
      <Route path="/tablero" element={<TableroPage />} />

      {/* Rutas privadas: requieren sesión (guard global) y rol por área */}
      <Route element={<RutaPrivada />}>
        <Route path="/" element={<InicioPorRol />} />

        <Route element={<RutaPorRol roles={ROLES_ENFERMERIA} />}>
          <Route path="/seleccion-estacion" element={<SeleccionEstacionPage />} />
          <Route
            path="/enfermeria"
            element={
              <RequiereEstacion>
                <EnfermeriaPage />
              </RequiereEstacion>
            }
          />
        </Route>

        <Route element={<RutaPorRol roles={ROLES_ARCHIVO} />}>
          <Route path="/archivo" element={<ArchivoPage />} />
          <Route path="/archivo/depuracion" element={<DepuracionExpedientesPage />} />
          <Route path="/archivo/salidas-externas" element={<SalidasExternasPage />} />
        </Route>

        <Route element={<RutaPorRol roles={ROLES_ADMINISTRACION} />}>
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
        </Route>

        <Route element={<RutaPorRol roles={ROLES_JEFE_ENFERMERIA} />}>
          <Route path="/jefe-enfermeria" element={<JefeEnfermeriaLayout />}>
            <Route index element={<CroquisPage />} />
            <Route path="horarios" element={<HorariosPage />} />
            <Route path="estaciones" element={<EstacionesJefePage />} />
            <Route path="reportes" element={<ReportesJefePage />} />
            <Route path="*" element={<Navigate to="/jefe-enfermeria" replace />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
