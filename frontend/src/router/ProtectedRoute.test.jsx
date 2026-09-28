import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/shared/context/AuthContext.jsx'
import ProtectedRoute from './ProtectedRoute.jsx'

function renderConRutas() {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/enfermeria']}>
        <Routes>
          <Route
            path="/enfermeria"
            element={
              <ProtectedRoute>
                <div>Contenido POS</div>
              </ProtectedRoute>
            }
          />
          <Route path="/sesion-cerrada" element={<div>Sesión cerrada</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  )
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('muestra el contenido con sesión activa', () => {
    renderConRutas()
    expect(screen.getByText('Contenido POS')).toBeInTheDocument()
  })

  it('redirige a /sesion-cerrada sin sesión', () => {
    localStorage.setItem('hro_sesion', 'cerrada')
    renderConRutas()
    expect(screen.getByText('Sesión cerrada')).toBeInTheDocument()
  })
})
