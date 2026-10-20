import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '@/shared/context/AuthContext.jsx'
import { EstacionProvider } from '@/shared/context/EstacionContext.jsx'
import { ThemeProvider } from '@/shared/context/ThemeContext.jsx'
import { ToastProvider } from '@/shared/context/ToastContext.jsx'
import SalidaArchivoHospitalPage from './SalidaArchivoHospitalPage.jsx'

vi.mock('@/modules/carnets/api/carnetsApi', () => ({
  listarEstaciones: vi.fn(() =>
    Promise.resolve([{ id: 1, codigo: 'EST-01', nombre: 'Estación 1' }]),
  ),
}))

function renderPagina() {
  return render(
    <MemoryRouter initialEntries={['/archivo/salida-hospital']}>
      <ThemeProvider>
        <AuthProvider>
          <EstacionProvider>
            <ToastProvider>
              <SalidaArchivoHospitalPage />
            </ToastProvider>
          </EstacionProvider>
        </AuthProvider>
      </ThemeProvider>
    </MemoryRouter>,
  )
}

describe('SalidaArchivoHospitalPage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('muestra el título y pide seleccionar la estación', async () => {
    renderPagina()
    expect(
      await screen.findByRole('heading', { name: /salida de archivo \(registro médico\)/i }),
    ).toBeInTheDocument()
    expect(await screen.findByText(/seleccione la estación/i)).toBeInTheDocument()
  })

  it('con estación seleccionada, habilita el buscador', async () => {
    localStorage.setItem(
      'hro_estacion',
      JSON.stringify({ id: 1, codigo: 'EST-01', nombre: 'Estación 1' }),
    )
    renderPagina()
    const input = await screen.findByLabelText(/expediente \(consulta al registro médico\)/i)
    expect(input).toBeEnabled()
  })
})
