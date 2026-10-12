import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TablaInformeEstadistico from './TablaInformeEstadistico.jsx'

const INFORME = [{ dia: '2026-10-01', hdc: 10, hd: 2 }]

describe('TablaInformeEstadistico', () => {
  it('muestra las columnas del Excel en el orden correcto', () => {
    render(<TablaInformeEstadistico informe={INFORME} />)

    const encabezados = screen.getAllByRole('columnheader').map((th) => th.textContent)
    expect(encabezados).toEqual([
      'DÍA',
      'HA',
      'EH',
      'HDT',
      'HDC',
      'SOBRES',
      'HR',
      'HD',
      'TOTAL',
      'TIA',
    ])
  })

  it('calcula TOTAL y HA con los valores derivados y la captura manual', async () => {
    const user = userEvent.setup()
    render(<TablaInformeEstadistico informe={INFORME} />)

    // HDC=10, HD=2 → TOTAL 12, HA 24.
    let fila = screen.getAllByRole('row')[1]
    expect(within(fila).getByText('12')).toBeInTheDocument()
    expect(within(fila).getByText('24')).toBeInTheDocument()

    // Se captura EH=3 → TOTAL 15, HA 30.
    await user.type(screen.getByLabelText('EH 2026-10-01'), '3')

    fila = screen.getAllByRole('row')[1]
    expect(within(fila).getByText('15')).toBeInTheDocument()
    expect(within(fila).getByText('30')).toBeInTheDocument()
  })
})
