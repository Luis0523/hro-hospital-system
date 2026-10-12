import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ReporteCarnetsPanel from './ReporteCarnetsPanel.jsx'

const ESPECIALIDADES = [
  { id: 1, nombre: 'Oncología' },
  { id: 2, nombre: 'Medicina Interna' },
  { id: 3, nombre: 'Nutrición' },
]

const REGISTROS = [
  ...Array.from({ length: 15 }, (_, indice) => ({
    id: indice,
    especialidadId: 1,
    especialidadNombre: 'Oncología',
  })),
  { id: 99, especialidadId: 2, especialidadNombre: 'Medicina Interna' },
]

describe('ReporteCarnetsPanel', () => {
  it('muestra el conteo por especialidad con su límite', () => {
    render(
      <ReporteCarnetsPanel
        open
        onClose={() => {}}
        registros={REGISTROS}
        especialidades={ESPECIALIDADES}
      />,
    )

    expect(screen.getByText('Reporte de carnets por especialidad')).toBeInTheDocument()
    expect(screen.getByText('15/14')).toBeInTheDocument()
    expect(screen.getByText('1/100')).toBeInTheDocument()
    expect(screen.getByText('0/12')).toBeInTheDocument()
  })

  it('avisa cuando una especialidad supera su límite', () => {
    render(
      <ReporteCarnetsPanel
        open
        onClose={() => {}}
        registros={REGISTROS}
        especialidades={ESPECIALIDADES}
      />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent(/límite superado/i)
    expect(screen.getByRole('img', { name: 'Oncología: 15 de 14 carnets' })).toBeInTheDocument()
  })

  it('cierra el panel desde el botón', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<ReporteCarnetsPanel open onClose={onClose} registros={[]} especialidades={[]} />)

    await user.click(screen.getByRole('button', { name: /cerrar reporte/i }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
