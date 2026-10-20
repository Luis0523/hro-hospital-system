import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '@/shared/context/AuthContext.jsx'
import { EstacionProvider } from '@/shared/context/EstacionContext.jsx'
import { ThemeProvider } from '@/shared/context/ThemeContext.jsx'
import { ToastProvider } from '@/shared/context/ToastContext.jsx'
import AppRouter from '@/router/AppRouter.jsx'
import { CLINICAS_MOCK } from './api/mockData'

const CLINICA_1 = CLINICAS_MOCK[0]

function renderRuta(ruta) {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <ThemeProvider>
        <AuthProvider>
          <EstacionProvider>
            <ToastProvider>
              <AppRouter />
            </ToastProvider>
          </EstacionProvider>
        </AuthProvider>
      </ThemeProvider>
    </MemoryRouter>,
  )
}

describe('AppRouter — ruta pública de Vista Doctor', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })

  it('abre /vista-doctor sin sesión general', async () => {
    localStorage.setItem('hro_sesion', 'cerrada')
    renderRuta(`/vista-doctor?clinica=${CLINICA_1.codigo}`)

    expect(await screen.findByRole('heading', { name: '¿Quién está ahí?' })).toBeInTheDocument()
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
  })

  it('mantiene el guard de las rutas privadas', async () => {
    localStorage.setItem('hro_sesion', 'cerrada')
    renderRuta('/enfermeria')

    expect(await screen.findByText('Sesión cerrada')).toBeInTheDocument()
  })
})
