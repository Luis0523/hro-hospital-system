import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/shared/context/AuthContext.jsx'
import AdministracionLayout from './AdministracionLayout.jsx'

function renderLayout() {
  return render(
    <MemoryRouter initialEntries={['/administracion']}>
      <AuthProvider>
        <Routes>
          <Route path="/administracion" element={<AdministracionLayout />}>
            <Route index element={<p>Contenido hijo de prueba</p>} />
          </Route>
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('AdministracionLayout', () => {
  it('renderiza el nombre del panel y la información disponible del usuario', () => {
    renderLayout()

    expect(screen.getByRole('heading', { name: 'Panel de Administración' })).toBeInTheDocument()
    expect(screen.getByText('Lic. Carmen Vega')).toBeInTheDocument()
    expect(screen.getByText('enfermeria')).toBeInTheDocument()
  })

  it('renderiza el contenido hijo mediante Outlet', () => {
    renderLayout()

    expect(screen.getByText('Contenido hijo de prueba')).toBeInTheDocument()
  })

  it('abre el menú móvil desde el botón hamburguesa', async () => {
    renderLayout()

    const boton = screen.getByRole('button', { name: 'Abrir menú de navegación' })
    expect(boton).toHaveAttribute('aria-expanded', 'false')

    await userEvent.click(boton)

    expect(
      screen.getByRole('button', { name: 'Abrir menú de navegación', hidden: true }),
    ).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('button', { name: 'Cerrar menú' })).toBeInTheDocument()
  })

  it('cierra el menú móvil con la tecla Escape', async () => {
    renderLayout()

    await userEvent.click(screen.getByRole('button', { name: 'Abrir menú de navegación' }))
    await userEvent.keyboard('{Escape}')

    expect(
      screen.getByRole('button', { name: 'Abrir menú de navegación', hidden: true }),
    ).toHaveAttribute('aria-expanded', 'false')
  })

  it('cierra el menú móvil con el botón Cerrar menú', async () => {
    renderLayout()

    await userEvent.click(screen.getByRole('button', { name: 'Abrir menú de navegación' }))
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar menú' }))

    expect(
      screen.getByRole('button', { name: 'Abrir menú de navegación', hidden: true }),
    ).toHaveAttribute('aria-expanded', 'false')
  })
})

describe('AdministracionLayout — modo oscuro local', () => {
  beforeEach(() => {
    localStorage.clear()
    document.body.classList.remove('admin-theme-dark')
  })

  afterEach(() => {
    document.body.classList.remove('admin-theme-dark')
  })

  it('inicia en claro por defecto y muestra el botón', () => {
    renderLayout()

    expect(document.body.classList.contains('admin-theme-dark')).toBe(false)
    expect(screen.getByRole('button', { name: 'Activar modo oscuro' })).toBeInTheDocument()
  })

  it('alterna a oscuro, aplica la clase en body y persiste dark', async () => {
    const user = userEvent.setup()
    renderLayout()

    await user.click(screen.getByRole('button', { name: 'Activar modo oscuro' }))

    expect(document.body.classList.contains('admin-theme-dark')).toBe(true)
    expect(localStorage.getItem('hro_admin_theme')).toBe('dark')
    expect(screen.getByRole('button', { name: 'Activar modo claro' })).toBeInTheDocument()
  })

  it('vuelve a claro, retira la clase y persiste light', async () => {
    const user = userEvent.setup()
    renderLayout()

    await user.click(screen.getByRole('button', { name: 'Activar modo oscuro' }))
    await user.click(screen.getByRole('button', { name: 'Activar modo claro' }))

    expect(document.body.classList.contains('admin-theme-dark')).toBe(false)
    expect(localStorage.getItem('hro_admin_theme')).toBe('light')
  })

  it('restaura el modo oscuro si estaba guardado', () => {
    localStorage.setItem('hro_admin_theme', 'dark')
    renderLayout()

    expect(document.body.classList.contains('admin-theme-dark')).toBe(true)
    expect(screen.getByRole('button', { name: 'Activar modo claro' })).toBeInTheDocument()
  })

  it('ignora valores no válidos y usa claro por defecto', () => {
    localStorage.setItem('hro_admin_theme', 'turquesa')
    renderLayout()

    expect(document.body.classList.contains('admin-theme-dark')).toBe(false)
  })

  it('no modifica hro_usuario ni hro_token', async () => {
    localStorage.setItem('hro_token', 'token-test')
    const user = userEvent.setup()
    renderLayout()

    const usuarioAntes = localStorage.getItem('hro_usuario')
    await user.click(screen.getByRole('button', { name: 'Activar modo oscuro' }))

    expect(localStorage.getItem('hro_usuario')).toBe(usuarioAntes)
    expect(localStorage.getItem('hro_token')).toBe('token-test')
  })

  it('retira la clase de body al desmontar Administración', async () => {
    const user = userEvent.setup()
    const { unmount } = renderLayout()

    await user.click(screen.getByRole('button', { name: 'Activar modo oscuro' }))
    expect(document.body.classList.contains('admin-theme-dark')).toBe(true)

    unmount()

    expect(document.body.classList.contains('admin-theme-dark')).toBe(false)
  })
})
