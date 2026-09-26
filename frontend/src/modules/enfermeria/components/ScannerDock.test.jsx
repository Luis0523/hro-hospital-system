import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ScannerDock from './ScannerDock.jsx'

describe('ScannerDock', () => {
  it('envía el formulario al presionar Enter', async () => {
    const onSubmit = vi.fn((event) => event.preventDefault())
    render(
      <ScannerDock
        value="2456789010101"
        onChange={() => {}}
        onSubmit={onSubmit}
        onSimular={() => {}}
      />,
    )

    await userEvent.type(screen.getByLabelText('Código de expediente del paciente'), '{Enter}')

    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('dispara la simulación de lectura', async () => {
    const onSimular = vi.fn()
    render(<ScannerDock value="" onChange={() => {}} onSubmit={() => {}} onSimular={onSimular} />)

    await userEvent.click(screen.getByRole('button', { name: /simular scan/i }))

    expect(onSimular).toHaveBeenCalledTimes(1)
  })
})
