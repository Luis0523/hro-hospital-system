import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { AuthProvider } from './AuthContext.jsx'
import { AccesoProvider, useAcceso } from './AccesoContext.jsx'

const mocks = vi.hoisted(() => ({ listarRolesPaginas: vi.fn() }))

vi.mock('@/shared/api/rolesPaginasApi.js', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, listarRolesPaginas: mocks.listarRolesPaginas }
})

function Sonda() {
  const { cargando } = useAcceso()
  return <span>{cargando ? 'cargando' : 'listo'}</span>
}

function renderProveedor() {
  return render(
    <AuthProvider>
      <AccesoProvider>
        <Sonda />
      </AccesoProvider>
    </AuthProvider>,
  )
}

beforeEach(() => {
  localStorage.clear()
  mocks.listarRolesPaginas.mockReset()
  mocks.listarRolesPaginas.mockResolvedValue([{ rol: 'enfermeria', paginas: ['enfermeria'] }])
})

describe('AccesoProvider', () => {
  it('no consulta el mapeo del backend si no hay sesión', () => {
    localStorage.setItem('hro_sesion', 'cerrada')

    renderProveedor()

    expect(screen.getByText('listo')).toBeInTheDocument()
    expect(mocks.listarRolesPaginas).not.toHaveBeenCalled()
  })

  it('carga el mapeo cuando hay sesión', async () => {
    renderProveedor()

    await waitFor(() => expect(mocks.listarRolesPaginas).toHaveBeenCalledTimes(1))
    expect(screen.getByText('listo')).toBeInTheDocument()
  })
})
