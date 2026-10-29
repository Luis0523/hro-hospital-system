import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '@/shared/context/AuthContext.jsx'
import { EstacionProvider } from '@/shared/context/EstacionContext.jsx'
import { ThemeProvider } from '@/shared/context/ThemeContext.jsx'
import { ToastProvider } from '@/shared/context/ToastContext.jsx'
import AppRouter from '@/router/AppRouter.jsx'
import { reiniciarDepuracionesMock } from './api/depuracionMock'

// Replica la composición real de providers de App.jsx.
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

describe('AppRouter · rutas nuevas de Archivo', () => {
  beforeEach(() => {
    reiniciarDepuracionesMock()
  })

  it('/archivo/depuracion muestra la pantalla de depuración', () => {
    renderRuta('/archivo/depuracion')

    expect(
      screen.getByRole('heading', { name: 'Depuración de expedientes', level: 2 }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cerrar sesión' })).toBeInTheDocument()
  })

  it('/archivo/reportes muestra los reportes diarios y su acceso en el navbar', async () => {
    renderRuta('/archivo/reportes')

    expect(
      await screen.findByRole('heading', { name: 'Reportes diarios de Archivo', level: 2 }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /reportes diarios/i })).toHaveAttribute(
      'href',
      '/archivo/reportes',
    )
  })

  it('/archivo/consolidado muestra el consolidado y su acceso en el navbar', () => {
    renderRuta('/archivo/consolidado')

    expect(
      screen.getByRole('heading', { name: 'Consolidado de Archivo', level: 2 }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /consolidado/i })).toHaveAttribute(
      'href',
      '/archivo/consolidado',
    )
  })
})
