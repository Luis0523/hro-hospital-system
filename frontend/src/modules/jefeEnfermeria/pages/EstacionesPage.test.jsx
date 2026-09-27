import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToastProvider } from '@/shared/context/ToastContext.jsx'
import { reiniciarJefeMock } from '../api/mockData.js'
import EstacionesPage from './EstacionesPage.jsx'

function renderPagina() {
  return render(
    <ToastProvider>
      <EstacionesPage />
    </ToastProvider>,
  )
}

describe('EstacionesPage', () => {
  beforeEach(() => {
    reiniciarJefeMock()
  })

  it('lista las estaciones y muestra la cobertura de hoy', async () => {
    renderPagina()

    expect(await screen.findByTestId('estacion-EST-01')).toBeInTheDocument()
    expect((await screen.findAllByText(/en servicio/i)).length).toBeGreaterThan(0)
  })

  it('crea una estación nueva', async () => {
    const user = userEvent.setup()
    renderPagina()

    await screen.findByTestId('estacion-EST-01')
    await user.click(screen.getByRole('button', { name: /nueva estación/i }))

    const dialogo = await screen.findByRole('dialog')
    const campos = within(dialogo).getAllByRole('textbox')
    await user.type(campos[0], 'EST-09')
    await user.type(campos[1], 'Nueva Área')
    await user.click(within(dialogo).getByRole('button', { name: /crear/i }))

    expect(await screen.findByTestId('estacion-EST-09')).toBeInTheDocument()
  })
})
