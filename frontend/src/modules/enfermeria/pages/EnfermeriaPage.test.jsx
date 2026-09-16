import { describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '@/shared/context/AuthContext.jsx'
import { ToastProvider } from '@/shared/context/ToastContext.jsx'
import EnfermeriaPage from './EnfermeriaPage.jsx'

function renderPagina() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <ToastProvider>
          <EnfermeriaPage />
        </ToastProvider>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('EnfermeriaPage', () => {
  it('renderiza la pantalla POS con encabezado, filtro y lector', async () => {
    renderPagina()

    expect(screen.getByText('Estación de Enfermería')).toBeInTheDocument()
    expect(screen.getByLabelText('DPI o carné del paciente')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Filtrar por clínica')).toBeInTheDocument()
    })
  })
})
