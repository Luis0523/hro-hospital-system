import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MenuUsuario from './MenuUsuario.jsx'

const USUARIO = {
  nombre: 'Lic. Carmen Vega',
  puesto: 'Enfermera Jefe de Turno',
  rol: 'enfermeria',
  idExterno: 'enfermeria-01',
}

describe('MenuUsuario', () => {
  it('muestra el perfil y pide confirmación antes de cerrar sesión', async () => {
    const onCerrarSesion = vi.fn()

    render(
      <MenuUsuario
        abierto
        usuario={USUARIO}
        terminal="BOX-04 Triage"
        onCerrar={() => {}}
        onCerrarSesion={onCerrarSesion}
      />,
    )

    expect(screen.getByText('Lic. Carmen Vega')).toBeInTheDocument()
    expect(screen.getByText('enfermeria-01')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /cerrar sesión/i }))
    expect(screen.getByText(/¿Seguro que desea cerrar la sesión\?/)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /cerrar sesión/i }))
    expect(onCerrarSesion).toHaveBeenCalledTimes(1)
  })
})
