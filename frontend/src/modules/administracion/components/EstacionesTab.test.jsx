import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToastProvider } from '@/shared/context/ToastContext.jsx'
import { reiniciarCatalogosMock } from '../api/mockData.js'
import EstacionesTab from './EstacionesTab.jsx'

function renderTab() {
  return render(
    <ToastProvider>
      <EstacionesTab />
    </ToastProvider>,
  )
}

describe('EstacionesTab', () => {
  beforeEach(() => {
    reiniciarCatalogosMock()
  })

  it('lista las estaciones y el número de subespecialidades', async () => {
    renderTab()

    const escritorio = await screen.findByTestId('catalogo-escritorio')
    expect(within(escritorio).getByText('EST-01')).toBeInTheDocument()
    expect(within(escritorio).getByText('3 — Gestionar')).toBeInTheDocument()
  })

  it('abre el modal de subespecialidades y guarda la asignación', async () => {
    const user = userEvent.setup()
    renderTab()

    const escritorio = await screen.findByTestId('catalogo-escritorio')
    await user.click(within(escritorio).getAllByRole('button', { name: /Gestionar/i })[0])

    expect(await screen.findByText(/Subespecialidades —/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(await screen.findByText('Subespecialidades actualizadas')).toBeInTheDocument()
  })
})
