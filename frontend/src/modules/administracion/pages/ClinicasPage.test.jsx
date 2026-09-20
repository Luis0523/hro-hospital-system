import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToastProvider } from '@/shared/context/ToastContext.jsx'
import { reiniciarCatalogosMock } from '../api/mockData.js'
import ClinicasPage from './ClinicasPage.jsx'

function renderPagina() {
  return render(
    <ToastProvider>
      <ClinicasPage />
    </ToastProvider>,
  )
}

async function esperarCatalogo() {
  return screen.findByTestId('catalogo-escritorio')
}

describe('ClinicasPage', () => {
  beforeEach(() => {
    reiniciarCatalogosMock()
  })

  it('renderiza el encabezado, el subtítulo y las tres pestañas', async () => {
    renderPagina()

    expect(screen.getByRole('heading', { name: 'Clínicas' })).toBeInTheDocument()
    expect(
      screen.getByText(
        'Gestión de especialidades, subespecialidades y espacios físicos del hospital.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Especialidades' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Subespecialidades' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Espacios físicos' })).toBeInTheDocument()

    const escritorio = await esperarCatalogo()
    expect(within(escritorio).getByText('Medicina Interna')).toBeInTheDocument()
  })

  it('muestra un indicador de carga mientras consulta el catálogo', () => {
    renderPagina()

    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('cambia entre pestañas y muestra la especialidad de cada subespecialidad', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarCatalogo()

    await user.click(screen.getByRole('tab', { name: 'Subespecialidades' }))

    const escritorioSubs = await esperarCatalogo()
    expect(within(escritorioSubs).getByText('Medicina General')).toBeInTheDocument()
    expect(within(escritorioSubs).getByText('Pediatría General')).toBeInTheDocument()
    expect(within(escritorioSubs).getAllByText('Pediatría').length).toBeGreaterThan(0)

    await user.click(screen.getByRole('tab', { name: 'Espacios físicos' }))

    const escritorioEspacios = await esperarCatalogo()
    expect(within(escritorioEspacios).getByText('Sala 101')).toBeInTheDocument()
  })

  it('abre y cierra el modal de creación', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarCatalogo()

    await user.click(screen.getByRole('button', { name: /agregar/i }))
    expect(screen.getByText('Nueva especialidad')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByText('Nueva especialidad')).not.toBeInTheDocument()
  })

  it('valida que el nombre sea obligatorio', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarCatalogo()

    await user.click(screen.getByRole('button', { name: /agregar/i }))
    await user.click(screen.getByRole('button', { name: 'Crear' }))

    expect(screen.getByText('El nombre es obligatorio')).toBeInTheDocument()
    expect(screen.getByText('Nueva especialidad')).toBeInTheDocument()
  })

  it('crea una especialidad y la muestra en el listado', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarCatalogo()

    await user.click(screen.getByRole('button', { name: /agregar/i }))
    await user.type(screen.getByLabelText('Nombre de la especialidad'), 'Neurología')
    await user.click(screen.getByRole('button', { name: 'Crear' }))

    expect(await screen.findByText('Especialidad creada')).toBeInTheDocument()
    expect(within(await esperarCatalogo()).getByText('Neurología')).toBeInTheDocument()
  })

  it('edita una especialidad existente', async () => {
    const user = userEvent.setup()
    renderPagina()
    const escritorio = await esperarCatalogo()

    await user.click(within(escritorio).getAllByRole('button', { name: 'Editar' })[0])
    expect(screen.getByText('Editar especialidad')).toBeInTheDocument()

    const campoNombre = screen.getByLabelText('Nombre de la especialidad')
    await user.clear(campoNombre)
    await user.type(campoNombre, 'Medicina Interna Renombrada')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(await screen.findByText('Especialidad actualizada')).toBeInTheDocument()
    expect(
      within(await esperarCatalogo()).getByText('Medicina Interna Renombrada'),
    ).toBeInTheDocument()
  })

  it('desactiva una especialidad con confirmación y la retira del listado', async () => {
    const user = userEvent.setup()
    renderPagina()
    const escritorio = await esperarCatalogo()

    await user.click(within(escritorio).getAllByRole('button', { name: 'Desactivar' })[0])

    expect(screen.getByText(/¿Deseas desactivar este registro\?/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Sí, desactivar' }))

    expect(await screen.findByText('Especialidad desactivada')).toBeInTheDocument()
    await waitFor(() =>
      expect(
        within(screen.getByTestId('catalogo-escritorio')).queryByText('Medicina Interna'),
      ).not.toBeInTheDocument(),
    )
  })

  it('construye el formulario de espacio físico con sus campos y sin especialidad', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarCatalogo()

    await user.click(screen.getByRole('tab', { name: 'Espacios físicos' }))
    await esperarCatalogo()
    await user.click(screen.getByRole('button', { name: /agregar/i }))

    expect(screen.getByText('Nuevo espacio físico')).toBeInTheDocument()
    expect(screen.getByLabelText('Número de sala / consultorio')).toBeInTheDocument()
    expect(screen.getByLabelText('Nivel / piso')).toBeInTheDocument()
    expect(screen.getByLabelText(/Capacidad de camillas/)).toBeInTheDocument()
    expect(screen.getByLabelText('Nombre del espacio físico')).toBeInTheDocument()
    expect(screen.getByLabelText('Ubicación (opcional)')).toBeInTheDocument()
    expect(screen.queryByLabelText('Especialidad')).not.toBeInTheDocument()
  })

  it('crea un espacio físico con identificador UUID y lo lista', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarCatalogo()

    await user.click(screen.getByRole('tab', { name: 'Espacios físicos' }))
    await esperarCatalogo()
    await user.click(screen.getByRole('button', { name: /agregar/i }))

    await user.type(screen.getByLabelText('Número de sala / consultorio'), '501')
    await user.type(screen.getByLabelText('Nivel / piso'), '5')
    await user.type(screen.getByLabelText('Nombre del espacio físico'), 'Sala 501')
    await user.click(screen.getByRole('button', { name: 'Crear' }))

    expect(await screen.findByText('Espacio físico creado')).toBeInTheDocument()
    expect(within(await esperarCatalogo()).getByText('Sala 501')).toBeInTheDocument()
  })
})
