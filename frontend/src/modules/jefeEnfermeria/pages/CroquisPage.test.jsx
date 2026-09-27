import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToastProvider } from '@/shared/context/ToastContext.jsx'
import { reiniciarJefeMock } from '../api/mockData.js'
import CroquisPage from './CroquisPage.jsx'

function renderPagina() {
  return render(
    <ToastProvider>
      <CroquisPage />
    </ToastProvider>,
  )
}

describe('CroquisPage', () => {
  beforeEach(() => {
    reiniciarJefeMock()
  })

  it('muestra las salas sin asignar del día', async () => {
    renderPagina()

    const sala = await screen.findByTestId('sala-101')
    expect(within(sala).getByText('Sin asignar')).toBeInTheDocument()
  })

  it('asigna y luego quita una subespecialidad de una sala', async () => {
    const user = userEvent.setup()
    renderPagina()

    const sala = await screen.findByTestId('sala-101')
    await user.click(sala)

    const dialogo = await screen.findByRole('dialog')
    await user.selectOptions(within(dialogo).getByRole('combobox'), '1')
    await user.click(within(dialogo).getByRole('button', { name: /guardar/i }))

    expect(await within(screen.getByTestId('sala-101')).findByText('Medicina General')).toBeInTheDocument()

    // Reabrir y quitar
    await user.click(screen.getByTestId('sala-101'))
    const dialogo2 = await screen.findByRole('dialog')
    await user.click(within(dialogo2).getByRole('button', { name: /quitar/i }))

    expect(await within(screen.getByTestId('sala-101')).findByText('Sin asignar')).toBeInTheDocument()
  })

  it('cierra el día con confirmación', async () => {
    const user = userEvent.setup()
    renderPagina()

    await screen.findByTestId('sala-101')
    await user.click(screen.getByRole('button', { name: /cerrar día/i }))

    const dialogo = await screen.findByRole('dialog')
    await user.click(within(dialogo).getByRole('button', { name: /sí, cerrar día/i }))

    expect(await screen.findByText('Asignación del día cerrada')).toBeInTheDocument()
  })
})
