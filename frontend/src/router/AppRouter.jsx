import { Navigate, Route, Routes } from 'react-router-dom'
import EnfermeriaPage from '@/modules/enfermeria/pages/EnfermeriaPage.jsx'
import TableroPage from '@/modules/tablero/pages/TableroPage.jsx'
import EstacionNoDisponible from '@/shared/components/EstacionNoDisponible.jsx'

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/enfermeria" replace />} />

      <Route path="/enfermeria" element={<EnfermeriaPage />} />

      <Route path="/archivo" element={<EstacionNoDisponible nombre="Estación de Archivo" />} />
      <Route
        path="/administracion"
        element={<EstacionNoDisponible nombre="Panel de Administración" />}
      />
      <Route path="/tablero" element={<TableroPage />} />

      <Route path="*" element={<Navigate to="/enfermeria" replace />} />
    </Routes>
  )
}
