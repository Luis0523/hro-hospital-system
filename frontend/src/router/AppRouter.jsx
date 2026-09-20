import { Navigate, Route, Routes } from 'react-router-dom'
import ArchivoPage from '@/modules/archivo/pages/ArchivoPage.jsx'
import EnfermeriaPage from '@/modules/enfermeria/pages/EnfermeriaPage.jsx'
import EstacionNoDisponible from '@/shared/components/EstacionNoDisponible.jsx'

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/enfermeria" replace />} />

      <Route path="/enfermeria" element={<EnfermeriaPage />} />

      <Route path="/archivo" element={<ArchivoPage />} />
      <Route
        path="/administracion"
        element={<EstacionNoDisponible nombre="Panel de Administración" />}
      />
      <Route path="/tablero" element={<EstacionNoDisponible nombre="Tablero de Turnos" />} />

      <Route path="*" element={<Navigate to="/enfermeria" replace />} />
    </Routes>
  )
}
