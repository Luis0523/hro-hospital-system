import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider, useAuth } from './AuthContext.jsx'

function Consumidor() {
  const { autenticado, usuario, cerrarSesion, iniciarSesion } = useAuth()
  return (
    <div>
      <span data-testid="estado">{autenticado ? 'autenticado' : 'anonimo'}</span>
      <span data-testid="usuario">{usuario?.idExterno}</span>
      <button type="button" onClick={cerrarSesion}>
        salir
      </button>
      <button type="button" onClick={iniciarSesion}>
        entrar
      </button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('cierra la sesión y limpia el almacenamiento', async () => {
    render(
      <AuthProvider>
        <Consumidor />
      </AuthProvider>,
    )

    await userEvent.click(screen.getByText('salir'))

    expect(screen.getByTestId('estado')).toHaveTextContent('anonimo')
    expect(localStorage.getItem('hro_sesion')).toBe('cerrada')
    expect(localStorage.getItem('hro_token')).toBeNull()
    expect(localStorage.getItem('hro_usuario')).toBeNull()
  })

  it('vuelve a iniciar sesión con el usuario simulado', async () => {
    localStorage.setItem('hro_sesion', 'cerrada')

    render(
      <AuthProvider>
        <Consumidor />
      </AuthProvider>,
    )

    expect(screen.getByTestId('estado')).toHaveTextContent('anonimo')

    await userEvent.click(screen.getByText('entrar'))

    expect(screen.getByTestId('estado')).toHaveTextContent('autenticado')
    expect(screen.getByTestId('usuario')).toHaveTextContent('enfermeria-01')
  })
})
