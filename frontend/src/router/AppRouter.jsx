import { Navigate, Route, Routes } from 'react-router-dom'
import ArchivoPage from '@/modules/archivo/pages/ArchivoPage.jsx'
import CuadernoRojoPage from '@/modules/archivo/pages/CuadernoRojoPage.jsx'
import ConsolidadoArchivoPage from '@/modules/archivo/pages/ConsolidadoArchivoPage.jsx'
import DashboardArchivoPage from '@/modules/archivo/pages/DashboardArchivoPage.jsx'
import DepuracionExpedientesPage from '@/modules/archivo/pages/DepuracionExpedientesPage.jsx'
import SalidasExternasPage from '@/modules/archivo/pages/SalidasExternasPage.jsx'
import SalidaArchivoPage from '@/modules/archivo/pages/SalidaArchivoPage.jsx'
import SalidaArchivoHospitalPage from '@/modules/archivo/pages/SalidaArchivoHospitalPage.jsx'
import RegistroCarnetsPage from '@/modules/archivo/pages/RegistroCarnetsPage.jsx'
import LibroCitasPage from '@/modules/libroCitas/pages/LibroCitasPage.jsx'
import EnfermeriaPage from '@/modules/enfermeria/pages/EnfermeriaPage.jsx'
import SeguimientoEnfermeriaPage from '@/modules/enfermeria/pages/SeguimientoEnfermeriaPage.jsx'
import SeguimientoEnfermeriaDosPage from '@/modules/enfermeria/pages/SeguimientoEnfermeriaDosPage.jsx'
import SeleccionEstacionPage from '@/modules/enfermeria/pages/SeleccionEstacionPage.jsx'
import SesionCerradaPage from '@/modules/enfermeria/pages/SesionCerradaPage.jsx'
import LoginPage from '@/modules/login/pages/LoginPage.jsx'
import SinAccesoPage from '@/modules/login/pages/SinAccesoPage.jsx'
import PruebaOcrPage from '@/modules/pruebaOcr/pages/PruebaOcrPage.jsx'
import PruebaImpresionPage from '@/modules/pruebaImpresion/pages/PruebaImpresionPage.jsx'
import MesaCoexPage from '@/modules/coex/pages/MesaCoexPage.jsx'
import VistaDoctorPage from '@/modules/vistaDoctor/pages/VistaDoctorPage.jsx'
import RutaPrivada from './RutaPrivada.jsx'
import RutaPorRol from './RutaPorRol.jsx'
import RequiereEstacion from './RequiereEstacion.jsx'
import TableroPage from '@/modules/tablero/pages/TableroPage.jsx'
import AdministracionLayout from '@/modules/administracion/AdministracionLayout.jsx'
import DashboardPage from '@/modules/administracion/pages/DashboardPage.jsx'
import UsuariosPage from '@/modules/administracion/pages/UsuariosPage.jsx'
import RolesPaginasPage from '@/modules/administracion/pages/RolesPaginasPage.jsx'
import ClinicasPage from '@/modules/administracion/pages/ClinicasPage.jsx'
import MedicosPage from '@/modules/administracion/pages/MedicosPage.jsx'
import CuposPage from '@/modules/administracion/pages/CuposPage.jsx'
import CalendarioPage from '@/modules/administracion/pages/CalendarioPage.jsx'
import ReportesPage from '@/modules/administracion/pages/ReportesPage.jsx'
import AuditoriaPage from '@/modules/administracion/pages/AuditoriaPage.jsx'
import JefeEnfermeriaLayout from '@/modules/jefeEnfermeria/JefeEnfermeriaLayout.jsx'
import JefeArchivoLayout from '@/modules/jefeArchivo/JefeArchivoLayout.jsx'
import CroquisPage from '@/modules/jefeEnfermeria/pages/CroquisPage.jsx'
import EspecialidadesJefePage from '@/modules/jefeEnfermeria/pages/EspecialidadesPage.jsx'
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
      <Route path="/vista-doctor" element={<VistaDoctorPage />} />
      <Route path="/prueba-ocr" element={<PruebaOcrPage />} />
      <Route path="/prueba-impresion" element={<PruebaImpresionPage />} />
      {/* Rutas privadas: requieren sesión (guard global) y área permitida por rol */}
      <Route element={<RutaPrivada />}>
        <Route path="/" element={<InicioPorRol />} />

        <Route element={<RutaPorRol area="enfermeria" />}>
          <Route path="/seleccion-estacion" element={<SeleccionEstacionPage />} />
          <Route path="/enfermeria/carnets" element={<RegistroCarnetsPage />} />
          <Route path="/seguimiento-enfermeria" element={<SeguimientoEnfermeriaPage />} />
          <Route path="/seguimiento-enfermeria-dos" element={<SeguimientoEnfermeriaDosPage />} />
          <Route
            path="/enfermeria"
            element={
              <RequiereEstacion>
                <EnfermeriaPage />
              </RequiereEstacion>
            }
          />
        </Route>

        <Route element={<RutaPorRol area="coex" />}>
          <Route path="/coex" element={<MesaCoexPage />} />
        </Route>

        <Route element={<RutaPorRol area="libro_citas" />}>
          <Route path="/libro-citas" element={<LibroCitasPage />} />
        </Route>

        <Route element={<RutaPorRol area="archivo" />}>
          <Route path="/archivo" element={<ArchivoPage />} />
          <Route path="/archivo/cuaderno-rojo" element={<CuadernoRojoPage />} />
          <Route path="/archivo/salida" element={<SalidaArchivoPage />} />
          <Route path="/archivo/salida-hospital" element={<SalidaArchivoHospitalPage />} />
          <Route path="/archivo/dashboard" element={<Navigate to="/jefe-archivo" replace />} />
          <Route path="/archivo/depuracion" element={<DepuracionExpedientesPage />} />
          <Route path="/archivo/consolidado" element={<ConsolidadoArchivoPage />} />
          <Route path="/archivo/salidas-externas" element={<SalidasExternasPage />} />
        </Route>

        <Route element={<RutaPorRol area="administracion" />}>
          <Route path="/administracion" element={<AdministracionLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="usuarios" element={<UsuariosPage />} />
            <Route path="roles" element={<RolesPaginasPage />} />
            <Route path="clinicas" element={<ClinicasPage />} />
            <Route path="medicos" element={<MedicosPage />} />
            <Route path="cupos" element={<CuposPage />} />
            <Route path="calendario" element={<CalendarioPage />} />
            <Route path="reportes" element={<ReportesPage />} />
            <Route path="auditoria" element={<AuditoriaPage />} />
            <Route path="*" element={<Navigate to="/administracion" replace />} />
          </Route>
        </Route>

        <Route element={<RutaPorRol areas={['jefe_archivo', 'administracion']} />}>
          <Route path="/jefe-archivo" element={<JefeArchivoLayout />}>
            <Route index element={<DashboardArchivoPage />} />
            <Route path="*" element={<Navigate to="/jefe-archivo" replace />} />
          </Route>
        </Route>

        <Route element={<RutaPorRol area="jefe_enfermeria" />}>
          <Route path="/jefe-enfermeria" element={<JefeEnfermeriaLayout />}>
            <Route index element={<CroquisPage />} />
            <Route path="especialidades" element={<EspecialidadesJefePage />} />
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
