import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '@/shared/context/AuthContext.jsx'
import { EstacionProvider } from '@/shared/context/EstacionContext.jsx'
import { ThemeProvider } from '@/shared/context/ThemeContext.jsx'
import { ToastProvider } from '@/shared/context/ToastContext.jsx'
import EnfermeriaPage from './EnfermeriaPage.jsx'

function renderPagina() {
  localStorage.setItem(
    'hro_estacion',
    JSON.stringify({ id: 'box-04', codigo: 'BOX-04 Triage', nombre: 'Clínica 101 - Medicina General' }),
  )
  return render(
    <ThemeProvider>
      <MemoryRouter>
        <AuthProvider>
          <EstacionProvider>
            <ToastProvider>
              <EnfermeriaPage />
            </ToastProvider>
          </EstacionProvider>
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

    const botonesCupo = within(panel).getAllByRole('button', { name: /\d+ cupos?/i })
    const cupoDisponible = botonesCupo.find((boton) => !boton.disabled)

    expect(cupoDisponible).toBeTruthy()

    await userEvent.click(cupoDisponible)
    expect(within(panel).getByRole('button', { name: /agendar cita/i })).toBeEnabled()

    await userEvent.click(within(panel).getByRole('button', { name: /agendar cita/i }))

    expect(await within(panel).findByText('Cita agendada')).toBeInTheDocument()
  })
})
