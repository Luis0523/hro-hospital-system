import { Navigate, Route, Routes } from 'react-router-dom'
import EnfermeriaPage from '@/modules/enfermeria/pages/EnfermeriaPage.jsx'
import SeleccionEstacionPage from '@/modules/enfermeria/pages/SeleccionEstacionPage.jsx'
import SesionCerradaPage from '@/modules/enfermeria/pages/SesionCerradaPage.jsx'
import EstacionNoDisponible from '@/shared/components/EstacionNoDisponible.jsx'
import ProtectedRoute from './ProtectedRoute.jsx'

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/enfermeria" replace />} />

      <Route
        path="/enfermeria"
        element={
          <ProtectedRoute>
            <EnfermeriaPage />
          </ProtectedRoute>
        }
      />
      <Route path="/seleccion-estacion" element={<SeleccionEstacionPage />} />
      <Route path="/sesion-cerrada" element={<SesionCerradaPage />} />

      <Route path="/archivo" element={<EstacionNoDisponible nombre="Estación de Archivo" />} />
      <Route
        path="/administracion"
        element={<EstacionNoDisponible nombre="Panel de Administración" />}
      />
      <Route path="/tablero" element={<EstacionNoDisponible nombre="Tablero de Turnos" />} />

      <Route path="*" element={<Navigate to="/enfermeria" replace />} />
    </Routes>
  )
}
