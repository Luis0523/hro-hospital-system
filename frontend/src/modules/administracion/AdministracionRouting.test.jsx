import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '@/shared/context/AuthContext.jsx'
import AppRouter from '@/router/AppRouter.jsx'

function renderRuta(ruta) {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </MemoryRouter>,
  )
}

const CASOS = [
  { ruta: '/administracion', titulo: 'Dashboard' },
  { ruta: '/administracion/usuarios', titulo: 'Usuarios y roles' },
  { ruta: '/administracion/clinicas', titulo: 'Clínicas' },
  { ruta: '/administracion/cupos', titulo: 'Cupos y capacidad' },
  { ruta: '/administracion/calendario', titulo: 'Calendario institucional' },
  { ruta: '/administracion/reportes', titulo: 'Reportes' },
  { ruta: '/administracion/auditoria', titulo: 'Auditoría' },
]

describe('Routing del Panel de Administración', () => {
  it.each(CASOS)('$ruta muestra la sección $titulo', ({ ruta, titulo }) => {
    renderRuta(ruta)

    expect(screen.getByRole('heading', { name: titulo })).toBeInTheDocument()
  })

  it('una subruta administrativa inexistente vuelve al dashboard', () => {
    renderRuta('/administracion/inexistente')

    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
  })
})
