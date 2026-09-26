import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '@/shared/context/AuthContext.jsx'
import { ThemeProvider } from '@/shared/context/ThemeContext.jsx'
import { ToastProvider } from '@/shared/context/ToastContext.jsx'
import EnfermeriaPage from './EnfermeriaPage.jsx'

function renderPagina() {
  return render(
    <ThemeProvider>
      <MemoryRouter>
        <AuthProvider>
          <ToastProvider>
            <EnfermeriaPage />
          </ToastProvider>
        </AuthProvider>
      </MemoryRouter>
    </ThemeProvider>,
  )
}

describe('EnfermeriaPage - flujos', () => {
  it('registra la llegada de un paciente con cita hoy', async () => {
    renderPagina()

    await userEvent.click(screen.getByRole('button', { name: /simular scan/i }))

    expect(await screen.findByText('Confirmar llegada')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /confirmar llegada/i }))

    expect(await screen.findByText('Paciente agregado a la cola')).toBeInTheDocument()
  })

  it('agenda una cita para un paciente sin cita hoy', async () => {
    renderPagina()

    const lector = screen.getByLabelText('Código de expediente del paciente')
    await userEvent.type(lector, '3012456780101{Enter}')

    const panel = await screen.findByRole('dialog')
    expect(await within(panel).findByText('Ana Lucía Pérez Morales')).toBeInTheDocument()

    const cuposDisponibles = within(panel)
      .getAllByRole('button', { name: /cupos/i })
      .filter((boton) => !boton.disabled)
    await userEvent.click(cuposDisponibles[0])
    await userEvent.click(within(panel).getByRole('button', { name: /agendar cita/i }))

    expect(await within(panel).findByText('Cita agendada')).toBeInTheDocument()
  })
})
