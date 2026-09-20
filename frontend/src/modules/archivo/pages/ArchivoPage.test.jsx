import { describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { AuthProvider } from '@/shared/context/AuthContext.jsx'
import { ToastProvider } from '@/shared/context/ToastContext.jsx'
import ArchivoPage from './ArchivoPage.jsx'

function renderPagina() {
  return render(
    <AuthProvider>
      <ToastProvider>
        <ArchivoPage />
      </ToastProvider>
    </AuthProvider>,
  )
}

describe('ArchivoPage', () => {
  it('renderiza encabezado, buscador, filtros y resumen', async () => {
    renderPagina()

    expect(screen.getByText('Estación de Archivo / Registro Médico')).toBeInTheDocument()
    expect(screen.getByLabelText('Buscar expediente por código')).toBeInTheDocument()
    expect(screen.getByLabelText('Fecha de consulta')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Resumen del día')).toBeInTheDocument()
    })
  })

  it('lista expedientes mock y muestra el caso de expediente nuevo', async () => {
    renderPagina()

    await waitFor(() => {
      expect(screen.getByText('Expedientes a preparar')).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(screen.getByText('Expediente nuevo')).toBeInTheDocument()
    })
  })
})
