import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { reiniciarJefeMock } from '../api/mockData.js'
import CroquisPage from './CroquisPage.jsx'

describe('CroquisPage', () => {
  beforeEach(() => {
    reiniciarJefeMock()
  })

  it('muestra las salas sin asignar del día', async () => {
    render(<CroquisPage />)

    const sala = await screen.findByTestId('sala-101')
    expect(within(sala).getByText('Sin asignar')).toBeInTheDocument()
  })

  it('asigna y luego quita una subespecialidad de una sala', async () => {
    const user = userEvent.setup()
    render(<CroquisPage />)

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
})
