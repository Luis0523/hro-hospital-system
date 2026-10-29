import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToastProvider } from '@/shared/context/ToastContext.jsx'
import { reiniciarCatalogosMock } from '@/modules/administracion/api/mockData.js'
import EspecialidadesPage from './EspecialidadesPage.jsx'

function renderPagina() {
  return render(
    <ToastProvider>
      <EspecialidadesPage />
    </ToastProvider>,
  )
}

async function esperarCatalogo() {
  return screen.findByTestId('catalogo-escritorio')
}

describe('EspecialidadesPage', () => {
  beforeEach(() => {
    reiniciarCatalogosMock()
  })

  it('filtra dinámicamente por nombre sin distinguir acentos', async () => {
    const user = userEvent.setup()
    renderPagina()

    const catalogo = await esperarCatalogo()
    expect(within(catalogo).getByText('Medicina Interna')).toBeInTheDocument()
    expect(within(catalogo).getByText('Pediatría')).toBeInTheDocument()

    await user.type(screen.getByLabelText('Buscar especialidad'), 'pediatria')

    expect(within(catalogo).queryByText('Medicina Interna')).not.toBeInTheDocument()
    expect(within(catalogo).getByText('Pediatría')).toBeInTheDocument()
    expect(screen.getByTestId('conteo-especialidades')).toHaveTextContent('1 de 6')
  })

  it('limpia la búsqueda y vuelve a mostrar todas las especialidades', async () => {
    const user = userEvent.setup()
    renderPagina()

    const catalogo = await esperarCatalogo()
    await user.type(screen.getByLabelText('Buscar especialidad'), 'cardio')

    expect(within(catalogo).queryByText('Medicina Interna')).not.toBeInTheDocument()
    expect(within(catalogo).getByText('Cardiología')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Limpiar búsqueda' }))

    expect(within(catalogo).getByText('Medicina Interna')).toBeInTheDocument()
    expect(screen.getByTestId('conteo-especialidades')).toHaveTextContent('6 especialidades')
  })

  it('muestra un estado vacío cuando no hay coincidencias', async () => {
    const user = userEvent.setup()
    renderPagina()

    await esperarCatalogo()
    await user.type(screen.getByLabelText('Buscar especialidad'), 'zzzz')

    expect(await screen.findByText('Sin coincidencias')).toBeInTheDocument()
    expect(screen.getByTestId('conteo-especialidades')).toHaveTextContent('0 de 6')
  })
})
