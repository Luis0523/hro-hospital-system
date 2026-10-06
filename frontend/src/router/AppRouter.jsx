import { Navigate, Route, Routes } from 'react-router-dom'
import ArchivoPage from '@/modules/archivo/pages/ArchivoPage.jsx'
import DepuracionExpedientesPage from '@/modules/archivo/pages/DepuracionExpedientesPage.jsx'
import SalidasExternasPage from '@/modules/archivo/pages/SalidasExternasPage.jsx'
import LibroCitasPage from '@/modules/libroCitas/pages/LibroCitasPage.jsx'
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
import RolesPaginasPage from '@/modules/administracion/pages/RolesPaginasPage.jsx'
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
import Spinner from '@/shared/components/ui/Spinner.jsx'
import { useAuth } from '@/shared/context/AuthContext.jsx'
import { useAcceso } from '@/shared/context/AccesoContext.jsx'

/** Pantalla inicial según las páginas configuradas para el rol. */
function InicioPorRol() {
  const { usuario } = useAuth()
  const { inicioSegunRol, cargando } = useAcceso()
  if (cargando) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner label="Cargando…" />
      </div>
    )
  }
  return <Navigate to={inicioSegunRol(usuario?.rol)} replace />
}

export default function AppRouter() {
  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/sesion-cerrada" element={<SesionCerradaPage />} />
      <Route path="/sin-acceso" element={<SinAccesoPage />} />
      <Route path="/tablero" element={<TableroPage />} />

      {/* Rutas privadas: requieren sesión (guard global) y área permitida por rol */}
      <Route element={<RutaPrivada />}>
        <Route path="/" element={<InicioPorRol />} />

      <Route path="/coex" element={<MesaCoexPage />} />

      {/* Mismo criterio de acceso general que /archivo: sin guard propio ni login. */}
      <Route path="/libro-citas" element={<LibroCitasPage />} />

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

        <Route element={<RutaPorRol area="archivo" />}>
          <Route path="/archivo" element={<ArchivoPage />} />
          <Route path="/archivo/depuracion" element={<DepuracionExpedientesPage />} />
          <Route path="/archivo/salidas-externas" element={<SalidasExternasPage />} />
        </Route>

        <Route element={<RutaPorRol area="administracion" />}>
          <Route path="/administracion" element={<AdministracionLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="usuarios" element={<UsuariosPage />} />
            <Route path="roles" element={<RolesPaginasPage />} />
            <Route path="clinicas" element={<ClinicasPage />} />
            <Route path="cupos" element={<CuposPage />} />
            <Route path="calendario" element={<CalendarioPage />} />
            <Route path="reportes" element={<ReportesPage />} />
            <Route path="auditoria" element={<AuditoriaPage />} />
            <Route path="*" element={<Navigate to="/administracion" replace />} />
          </Route>
        </Route>

        <Route element={<RutaPorRol area="jefe_enfermeria" />}>
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
