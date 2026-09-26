import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '@/shared/context/AuthContext.jsx'
import { ToastProvider } from '@/shared/context/ToastContext.jsx'
import AppRouter from '@/router/AppRouter.jsx'
import {
  avanzarEstado,
  buscarExpedientePorCodigo,
  crearExpediente,
  listarClinicas,
  listarExpedientes,
  listarMedicos,
  marcarNoLocalizado,
} from '../api/archivoApi'
import ArchivoPage from './ArchivoPage.jsx'

// jsdom no implementa ResizeObserver y Headless UI lo usa al cerrar el Listbox
// (filtros). Polyfill local del archivo de pruebas para no tocar el setup
// compartido.
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

vi.mock('../api/archivoApi', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    listarClinicas: vi.fn(actual.listarClinicas),
    listarMedicos: vi.fn(actual.listarMedicos),
    listarExpedientes: vi.fn(actual.listarExpedientes),
    buscarExpedientePorCodigo: vi.fn(actual.buscarExpedientePorCodigo),
    avanzarEstado: vi.fn(actual.avanzarEstado),
    marcarNoLocalizado: vi.fn(actual.marcarNoLocalizado),
    crearExpediente: vi.fn(actual.crearExpediente),
  }
})

function renderPagina() {
  return render(
    <AuthProvider>
      <ToastProvider>
        <ArchivoPage />
      </ToastProvider>
    </AuthProvider>,
  )
}

function renderRuta(ruta) {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <AuthProvider>
        <ToastProvider>
          <AppRouter />
        </ToastProvider>
      </AuthProvider>
    </MemoryRouter>,
  )
}

const regionPendientes = () => screen.getByRole('region', { name: 'Pendientes de localizar' })
const regionLocalizados = () => screen.getByRole('region', { name: 'Expedientes localizados' })

const NOMBRE_CHECKBOX = /seleccionar expediente EXP-004521 de María Fernanda López García/i

async function esperarChecklist() {
  await screen.findByRole('region', { name: 'Pendientes de localizar' })
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('ArchivoPage — ruta oficial', () => {
  it('/archivo renderiza la vista oficial', async () => {
    renderRuta('/archivo')

    expect(
      screen.getByRole('heading', { name: 'Estación de Archivo / Registro Médico' }),
    ).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Pendientes de localizar' })).toBeInTheDocument()
    })
  })

  it('la ruta experimental /archivo/listado-prueba ya no existe', () => {
    renderRuta('/archivo/listado-prueba')

    expect(screen.queryByText('Vista experimental de listado')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('region', { name: 'Pendientes de localizar' }),
    ).not.toBeInTheDocument()
  })
})

describe('ArchivoPage — checklist oficial', () => {
  it('muestra las dos secciones de trabajo', async () => {
    renderPagina()
    await esperarChecklist()

    expect(screen.getByRole('heading', { name: 'Pendientes de localizar' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Expedientes localizados' })).toBeInTheDocument()
  })

  it('inicialmente todos los expedientes están en Pendientes de localizar', async () => {
    renderPagina()
    await esperarChecklist()

    expect(within(regionPendientes()).getAllByRole('checkbox')).toHaveLength(6)
    expect(within(regionLocalizados()).queryAllByRole('checkbox')).toHaveLength(0)
    expect(
      within(regionLocalizados()).getByText(/todavía no se ha localizado/i),
    ).toBeInTheDocument()
  })

  it('el checkbox de cada expediente es accesible', async () => {
    renderPagina()
    await esperarChecklist()

    expect(
      within(regionPendientes()).getByRole('checkbox', { name: NOMBRE_CHECKBOX }),
    ).not.toBeChecked()
  })

  it('marcar un expediente lo mueve a Localizados', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarChecklist()

    await user.click(within(regionPendientes()).getByRole('checkbox', { name: NOMBRE_CHECKBOX }))

    expect(
      within(regionLocalizados()).getByRole('checkbox', { name: NOMBRE_CHECKBOX }),
    ).toBeChecked()
    expect(
      within(regionPendientes()).queryByRole('checkbox', { name: NOMBRE_CHECKBOX }),
    ).not.toBeInTheDocument()
  })

  it('desmarcar un expediente lo devuelve a Pendientes', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarChecklist()

    await user.click(within(regionPendientes()).getByRole('checkbox', { name: NOMBRE_CHECKBOX }))
    await user.click(within(regionLocalizados()).getByRole('checkbox', { name: NOMBRE_CHECKBOX }))

    expect(
      within(regionPendientes()).getByRole('checkbox', { name: NOMBRE_CHECKBOX }),
    ).not.toBeChecked()
    expect(
      within(regionLocalizados()).queryByRole('checkbox', { name: NOMBRE_CHECKBOX }),
    ).not.toBeInTheDocument()
  })

  it('un expediente nunca aparece en las dos secciones a la vez', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarChecklist()

    await user.click(within(regionPendientes()).getByRole('checkbox', { name: NOMBRE_CHECKBOX }))

    expect(within(regionPendientes()).queryByRole('checkbox', { name: NOMBRE_CHECKBOX })).toBeNull()
    expect(
      within(regionLocalizados()).queryByRole('checkbox', { name: NOMBRE_CHECKBOX }),
    ).not.toBeNull()

    const total =
      within(regionPendientes()).getAllByRole('checkbox').length +
      within(regionLocalizados()).getAllByRole('checkbox').length
    expect(total).toBe(6)
  })

  it('actualiza los contadores Total, Pendientes y Localizados', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarChecklist()

    expect(screen.getByText('Total del día').closest('li')).toHaveTextContent('6')
    expect(screen.getByText('Pendientes').closest('li')).toHaveTextContent('6')
    expect(screen.getByText('Localizados').closest('li')).toHaveTextContent('0')

    await user.click(within(regionPendientes()).getByRole('checkbox', { name: NOMBRE_CHECKBOX }))

    expect(screen.getByText('Pendientes').closest('li')).toHaveTextContent('5')
    expect(screen.getByText('Localizados').closest('li')).toHaveTextContent('1')
    expect(screen.getByText('Total del día').closest('li')).toHaveTextContent('6')
  })

  it('solo muestra expedientes existentes, todos con numeroExpediente', async () => {
    renderPagina()
    await esperarChecklist()

    const checkboxes = [
      ...within(regionPendientes()).getAllByRole('checkbox'),
      ...within(regionLocalizados()).queryAllByRole('checkbox'),
    ]

    expect(checkboxes.length).toBeGreaterThan(0)
    for (const checkbox of checkboxes) {
      expect(checkbox).toHaveAccessibleName(/seleccionar expediente exp-\d+/i)
    }
  })

  it('no muestra casos de paciente sin expediente', async () => {
    renderPagina()
    await esperarChecklist()

    expect(screen.queryByText('Expediente nuevo')).not.toBeInTheDocument()
    expect(screen.queryByText('Sin expediente físico')).not.toBeInTheDocument()
    expect(screen.queryByText('Crear expediente físico')).not.toBeInTheDocument()
  })
})

describe('ArchivoPage — sin efectos en backend', () => {
  it('no llama a la API al marcar ni al desmarcar', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarChecklist()

    vi.clearAllMocks()

    await user.click(within(regionPendientes()).getByRole('checkbox', { name: NOMBRE_CHECKBOX }))
    await user.click(within(regionLocalizados()).getByRole('checkbox', { name: NOMBRE_CHECKBOX }))

    expect(listarExpedientes).not.toHaveBeenCalled()
    expect(listarClinicas).not.toHaveBeenCalled()
    expect(listarMedicos).not.toHaveBeenCalled()
    expect(buscarExpedientePorCodigo).not.toHaveBeenCalled()
    expect(avanzarEstado).not.toHaveBeenCalled()
    expect(marcarNoLocalizado).not.toHaveBeenCalled()
    expect(crearExpediente).not.toHaveBeenCalled()
  })
})

describe('ArchivoPage — estructura de la pantalla', () => {
  it('conserva el scanner', () => {
    renderPagina()

    expect(screen.getByLabelText('Buscar expediente por código')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Buscar' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Simular' })).toBeInTheDocument()
  })

  it('conserva los filtros', () => {
    renderPagina()

    expect(screen.getByLabelText('Fecha de consulta')).toBeInTheDocument()
    expect(screen.getByText('Clínica')).toBeInTheDocument()
    expect(screen.getByText('Médico')).toBeInTheDocument()
  })

  it('muestra los botones futuros deshabilitados', () => {
    renderPagina()

    expect(screen.getByRole('button', { name: 'Guardar resumen del día' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Imprimir / generar PDF' })).toBeDisabled()
  })
})

describe('ArchivoPage — el buscador localiza sin cambiar el checklist', () => {
  async function buscar(user, codigo) {
    await user.type(screen.getByLabelText('Buscar expediente por código'), codigo)
    await user.click(screen.getByRole('button', { name: 'Buscar' }))
  }

  it('identifica y resalta la fila del expediente buscado', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarChecklist()

    await buscar(user, 'EXP-004521')

    const etiqueta = await screen.findByText('Resultado de búsqueda')
    const fila = etiqueta.closest('li')
    expect(fila).toHaveAttribute('data-expediente-id', '1')
    expect(fila).toHaveAttribute('data-resaltado', 'true')
  })

  it('no abre el detalle del diseño anterior', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarChecklist()

    await buscar(user, 'EXP-004521')
    await screen.findByText('Resultado de búsqueda')

    expect(screen.queryByText('Detalle del expediente')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /avanzar al siguiente estado/i }),
    ).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /marcar no localizado/i })).not.toBeInTheDocument()
  })

  it('no marca el checkbox ni mueve el expediente automáticamente', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarChecklist()

    await buscar(user, 'EXP-004521')
    await screen.findByText('Resultado de búsqueda')

    expect(
      within(regionPendientes()).getByRole('checkbox', { name: NOMBRE_CHECKBOX }),
    ).not.toBeChecked()
    expect(
      within(regionLocalizados()).queryByRole('checkbox', { name: NOMBRE_CHECKBOX }),
    ).not.toBeInTheDocument()
  })

  it('permite marcar manualmente después de buscar', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarChecklist()

    await buscar(user, 'EXP-004521')
    await screen.findByText('Resultado de búsqueda')

    await user.click(within(regionPendientes()).getByRole('checkbox', { name: NOMBRE_CHECKBOX }))

    expect(
      within(regionLocalizados()).getByRole('checkbox', { name: NOMBRE_CHECKBOX }),
    ).toBeChecked()
  })

  it('el checklist sigue funcionando después de una búsqueda', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarChecklist()

    await buscar(user, 'EXP-004521')
    await screen.findByText('Resultado de búsqueda')

    await user.click(within(regionPendientes()).getByRole('checkbox', { name: NOMBRE_CHECKBOX }))
    await user.click(within(regionLocalizados()).getByRole('checkbox', { name: NOMBRE_CHECKBOX }))

    expect(
      within(regionPendientes()).getByRole('checkbox', { name: NOMBRE_CHECKBOX }),
    ).not.toBeChecked()
    expect(screen.getByText('Pendientes').closest('li')).toHaveTextContent('6')
    expect(screen.getByText('Localizados').closest('li')).toHaveTextContent('0')
  })

  it('mantiene el feedback de error cuando el código no existe', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarChecklist()

    await buscar(user, 'NO-EXISTE')

    expect(await screen.findByText('Expediente no encontrado')).toBeInTheDocument()
    expect(screen.queryByText('Resultado de búsqueda')).not.toBeInTheDocument()
  })

  it('no busca con código vacío o solo espacios', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarChecklist()

    await user.click(screen.getByRole('button', { name: 'Buscar' }))
    await user.type(screen.getByLabelText('Buscar expediente por código'), '   ')
    await user.click(screen.getByRole('button', { name: 'Buscar' }))

    expect(buscarExpedientePorCodigo).not.toHaveBeenCalled()
    expect(screen.queryByText('Resultado de búsqueda')).not.toBeInTheDocument()
  })
})
