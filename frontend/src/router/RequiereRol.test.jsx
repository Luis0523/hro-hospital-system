import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '@/shared/context/AuthContext.jsx'
import RequiereRol from './RequiereRol.jsx'

function renderGuard(props = {}) {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <RequiereRol {...props}>
          <p>contenido del jefe</p>
        </RequiereRol>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('RequiereRol', () => {
  it('no bloquea cuando aplicar=false (auth aún no disponible)', () => {
    renderGuard()

    expect(screen.getByText('contenido del jefe')).toBeInTheDocument()
  })

  it('redirige a /sesion-cerrada cuando aplicar=true y el rol no está permitido', () => {
    renderGuard({ aplicar: true, roles: ['administrador'] })

    expect(screen.queryByText('contenido del jefe')).not.toBeInTheDocument()
  })
})
