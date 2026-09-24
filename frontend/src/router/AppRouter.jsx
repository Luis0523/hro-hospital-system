import { Navigate, Route, Routes } from 'react-router-dom'
import EnfermeriaPage from '@/modules/enfermeria/pages/EnfermeriaPage.jsx'
import SeleccionEstacionPage from '@/modules/enfermeria/pages/SeleccionEstacionPage.jsx'
import EstacionNoDisponible from '@/shared/components/EstacionNoDisponible.jsx'

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/enfermeria" replace />} />

      <Route path="/enfermeria" element={<EnfermeriaPage />} />
      <Route path="/seleccion-estacion" element={<SeleccionEstacionPage />} />

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
