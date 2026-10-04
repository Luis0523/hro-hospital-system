import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '@/shared/context/AuthContext.jsx'
import { EstacionProvider } from '@/shared/context/EstacionContext.jsx'
import { ThemeProvider } from '@/shared/context/ThemeContext.jsx'
import { ToastProvider } from '@/shared/context/ToastContext.jsx'
import AppRouter from '@/router/AppRouter.jsx'
import {
  avanzarEstado,
  buscarExpedientePorCodigo,
  crearExpediente,
  listarJornadaArchivo,
  listarSubespecialidades,
  marcarNoLocalizado,
  obtenerResumenArchivo,
  obtenerResumenArchivoPdf,
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
    listarSubespecialidades: vi.fn(actual.listarSubespecialidades),
    listarJornadaArchivo: vi.fn(actual.listarJornadaArchivo),
    buscarExpedientePorCodigo: vi.fn(actual.buscarExpedientePorCodigo),
    avanzarEstado: vi.fn(actual.avanzarEstado),
    marcarNoLocalizado: vi.fn(actual.marcarNoLocalizado),
    crearExpediente: vi.fn(actual.crearExpediente),
    obtenerResumenArchivo: vi.fn(actual.obtenerResumenArchivo),
    obtenerResumenArchivoPdf: vi.fn(actual.obtenerResumenArchivoPdf),
    crearActaRecepcion: vi.fn(actual.crearActaRecepcion),
    obtenerActaRecepcion: vi.fn(actual.obtenerActaRecepcion),
    obtenerActaRecepcionPdf: vi.fn(actual.obtenerActaRecepcionPdf),
  }
})

function renderPagina(ruta = '/archivo') {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <ArchivoPage />
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </MemoryRouter>,
  )
}

function renderRuta(ruta) {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <ThemeProvider>
        <AuthProvider>
          <EstacionProvider>
            <ToastProvider>
              <AppRouter />
            </ToastProvider>
          </EstacionProvider>
        </AuthProvider>
      </ThemeProvider>
    </MemoryRouter>,
  )
}

const regionPendientes = () => screen.getByRole('region', { name: 'Pendientes de localizar' })
const regionLocalizados = () => screen.getByRole('region', { name: 'Expedientes localizados' })

const NOMBRE_CHECKBOX = /seleccionar expediente EXP-2024-035 de María Fernanda López García/i

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

  it('informa las citas sin expediente físico y no las incluye en el checklist', async () => {
    renderPagina()
    await esperarChecklist()

    expect(screen.getByText('Citas sin expediente físico')).toBeInTheDocument()
    expect(within(regionPendientes()).getAllByRole('checkbox')).toHaveLength(6)
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

    expect(listarJornadaArchivo).not.toHaveBeenCalled()
    expect(listarSubespecialidades).not.toHaveBeenCalled()
    expect(buscarExpedientePorCodigo).not.toHaveBeenCalled()
    expect(avanzarEstado).not.toHaveBeenCalled()
    expect(marcarNoLocalizado).not.toHaveBeenCalled()
    expect(crearExpediente).not.toHaveBeenCalled()
  })
})

describe('ArchivoPage — estructura de la pantalla', () => {
  it('conserva el buscador manual y la cámara', () => {
    renderPagina()

    expect(screen.getByLabelText('Buscar expediente por código')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Buscar' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /escanear con cámara/i })).toBeInTheDocument()
  })

  it('mantiene la búsqueda manual cuando la cámara no está disponible', async () => {
    const user = userEvent.setup()
    renderPagina()

    await user.click(screen.getByRole('button', { name: /escanear con cámara/i }))

    expect(await screen.findByText('Cámara no disponible')).toBeInTheDocument()
    expect(screen.getByLabelText('Buscar expediente por código')).toBeInTheDocument()
  })

  it('conserva los filtros', () => {
    renderPagina()

    expect(screen.getByLabelText('Fecha de consulta')).toBeInTheDocument()
    expect(screen.getByText('Subespecialidad')).toBeInTheDocument()
    expect(screen.queryByText('Médico')).not.toBeInTheDocument()
    expect(screen.queryByText('Clínica')).not.toBeInTheDocument()
  })

  it('presenta las acciones del día con el estado correcto de sus botones', () => {
    renderPagina()

    expect(screen.getByRole('button', { name: /consultar resumen del día/i })).toBeEnabled()
    expect(screen.getByRole('button', { name: /descargar resumen \(pdf\)/i })).toBeEnabled()
    expect(screen.getByRole('button', { name: /generar acta de recepción/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /descargar pdf del acta/i })).toBeDisabled()
  })
})

describe('ArchivoPage — acciones del día (SCRUM-96)', () => {
  it('consulta el resumen del backend con la fecha seleccionada y muestra el panel', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarChecklist()

    await user.click(screen.getByRole('button', { name: /consultar resumen del día/i }))

    await waitFor(() =>
      expect(obtenerResumenArchivo).toHaveBeenCalledWith({ fecha: expect.any(String) }),
    )
    expect(await screen.findByText('Total de ciclos')).toBeInTheDocument()
  })

  it('deshabilita el botón mientras consulta el resumen', async () => {
    let resolver
    obtenerResumenArchivo.mockReturnValueOnce(
      new Promise((res) => {
        resolver = res
      }),
    )
    const user = userEvent.setup()
    renderPagina()
    await esperarChecklist()

    const boton = screen.getByRole('button', { name: /consultar resumen del día/i })
    await user.click(boton)

    await waitFor(() => expect(boton).toBeDisabled())

    await act(async () => {
      resolver({ totalCiclos: 0 })
    })

    await waitFor(() => expect(boton).toBeEnabled())
  })

  it('muestra un error si falla la consulta del resumen', async () => {
    obtenerResumenArchivo.mockRejectedValueOnce(new Error('backend caído'))
    const user = userEvent.setup()
    renderPagina()
    await esperarChecklist()

    await user.click(screen.getByRole('button', { name: /consultar resumen del día/i }))

    expect(await screen.findByText('No se pudo obtener el resumen')).toBeInTheDocument()
  })

  it('descarga el PDF del resumen con la fecha seleccionada', async () => {
    const createObjectURL = vi.fn(() => 'blob:mock')
    const originalCreate = URL.createObjectURL
    const originalRevoke = URL.revokeObjectURL
    URL.createObjectURL = createObjectURL
    URL.revokeObjectURL = vi.fn()

    try {
      const user = userEvent.setup()
      renderPagina()
      await esperarChecklist()

      await user.click(screen.getByRole('button', { name: /descargar resumen \(pdf\)/i }))

      await waitFor(() =>
        expect(obtenerResumenArchivoPdf).toHaveBeenCalledWith({ fecha: expect.any(String) }),
      )
      await waitFor(() => expect(createObjectURL).toHaveBeenCalled())
    } finally {
      URL.createObjectURL = originalCreate
      URL.revokeObjectURL = originalRevoke
    }
  })
})

describe('ArchivoPage — filtros de subespecialidad', () => {
  const botonSubespecialidad = () =>
    screen.getByRole('button', { name: /todas las subespecialidades/i })

  it('carga las opciones de subespecialidades al abrir el filtro', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarChecklist()

    await user.click(botonSubespecialidad())

    expect(await screen.findByRole('option', { name: 'Medicina General' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Pediatría General' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Cardiología Clínica' })).toBeInTheDocument()
  })

  it('filtra el listado por subespecialidad y reinicia la selección local', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarChecklist()

    await user.click(within(regionPendientes()).getByRole('checkbox', { name: NOMBRE_CHECKBOX }))
    expect(screen.getByText('Localizados').closest('li')).toHaveTextContent('1')

    await user.click(botonSubespecialidad())
    await user.click(await screen.findByRole('option', { name: 'Medicina General' }))

    await waitFor(() => expect(screen.getByText('Pendientes').closest('li')).toHaveTextContent('3'))
    expect(screen.getByText('Localizados').closest('li')).toHaveTextContent('0')
    expect(screen.getByText('Total del día').closest('li')).toHaveTextContent('3')
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

    await buscar(user, 'EXP-2024-035')

    const etiqueta = await screen.findByText('Resultado de búsqueda')
    const fila = etiqueta.closest('li')
    expect(fila).toHaveAttribute('data-resaltado', 'true')
    expect(within(fila).getByText('EXP-2024-035')).toBeInTheDocument()
  })

  it('no abre el detalle del diseño anterior', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarChecklist()

    await buscar(user, 'EXP-2024-035')
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

    await buscar(user, 'EXP-2024-035')
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

    await buscar(user, 'EXP-2024-035')
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

    await buscar(user, 'EXP-2024-035')
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

describe('ArchivoPage — navegación de la estación', () => {
  it('muestra la navegación con las cuatro opciones requeridas', async () => {
    renderPagina()
    await esperarChecklist()

    const nav = screen.getByRole('navigation', { name: 'Navegación de la Estación de Archivo' })

    expect(within(nav).getByRole('link', { name: 'Expedientes para COEX' })).toHaveAttribute(
      'href',
      '/archivo',
    )
    expect(within(nav).getByRole('link', { name: 'Depuración de expedientes' })).toHaveAttribute(
      'href',
      '/archivo/depuracion',
    )
    expect(
      within(nav).getByRole('link', { name: 'Salidas externas de expedientes' }),
    ).toHaveAttribute('href', '/archivo/salidas-externas')
    expect(within(nav).getByRole('button', { name: 'Cerrar sesión' })).toBeInTheDocument()
  })

  it('marca "Expedientes para COEX" como sección activa en /archivo', async () => {
    renderPagina('/archivo')
    await esperarChecklist()

    expect(screen.getByRole('link', { name: 'Expedientes para COEX' })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('la sección provisional de depuración no rompe la aplicación', async () => {
    renderRuta('/archivo/depuracion')

    expect(await screen.findByText(/sección provisional/i)).toBeInTheDocument()
    expect(
      screen.getByRole('navigation', { name: 'Navegación de la Estación de Archivo' }),
    ).toBeInTheDocument()
  })

  it('la sección provisional de salidas externas no rompe la aplicación', async () => {
    renderRuta('/archivo/salidas-externas')

    expect(await screen.findByText(/sección provisional/i)).toBeInTheDocument()
    expect(
      screen.getByRole('navigation', { name: 'Navegación de la Estación de Archivo' }),
    ).toBeInTheDocument()
  })

  it('cerrar sesión usa el mecanismo existente y navega a /sesion-cerrada', async () => {
    const user = userEvent.setup()
    renderRuta('/archivo')
    await esperarChecklist()

    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }))

    expect(localStorage.getItem('hro_sesion')).toBe('cerrada')
    expect(await screen.findByText('Sesión cerrada')).toBeInTheDocument()
  })
})
