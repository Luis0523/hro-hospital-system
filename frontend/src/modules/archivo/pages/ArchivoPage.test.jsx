import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider } from '@/shared/context/AuthContext.jsx'
import { ToastProvider } from '@/shared/context/ToastContext.jsx'
import { avanzarEstado, buscarExpedientePorCodigo, listarExpedientes } from '../api/archivoApi'
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
    listarExpedientes: vi.fn(actual.listarExpedientes),
    buscarExpedientePorCodigo: vi.fn(actual.buscarExpedientePorCodigo),
    avanzarEstado: vi.fn(actual.avanzarEstado),
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

const NOMBRE_EXISTENTE = /María Fernanda López García/i

async function abrirDetalle(user) {
  await user.click(await screen.findByRole('button', { name: NOMBRE_EXISTENTE }))
  await screen.findByText('Detalle del expediente')
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('ArchivoPage — estados de interfaz', () => {
  it('muestra carga inicial sin flash de estado vacío', async () => {
    let resolver
    listarExpedientes.mockReturnValueOnce(
      new Promise((res) => {
        resolver = res
      }),
    )

    renderPagina()

    expect(screen.getByRole('status')).toHaveTextContent('Cargando expedientes...')
    expect(screen.queryByText('Sin expedientes para esta fecha')).not.toBeInTheDocument()

    await act(async () => {
      resolver([])
    })
  })

  it('muestra alerta cuando falla la carga', async () => {
    listarExpedientes.mockRejectedValueOnce(new Error('No se pudo conectar'))

    renderPagina()

    await waitFor(() => {
      expect(screen.getByText('No se pudieron cargar los expedientes')).toBeInTheDocument()
    })
    expect(screen.getByText('No se pudo conectar')).toBeInTheDocument()
  })

  it('muestra estado vacío cuando no hay resultados', async () => {
    renderPagina()
    await screen.findByRole('button', { name: NOMBRE_EXISTENTE })

    fireEvent.change(screen.getByLabelText('Fecha de consulta'), {
      target: { value: '2099-01-01' },
    })

    await waitFor(() => {
      expect(screen.getByText('Sin expedientes para esta fecha')).toBeInTheDocument()
    })
  })
})

describe('ArchivoPage — limpiar selección al cambiar filtros', () => {
  it('cierra el detalle al cambiar la fecha', async () => {
    const user = userEvent.setup()
    renderPagina()
    await abrirDetalle(user)

    fireEvent.change(screen.getByLabelText('Fecha de consulta'), {
      target: { value: '2026-09-25' },
    })

    await waitFor(() => {
      expect(screen.queryByText('Detalle del expediente')).not.toBeInTheDocument()
    })
  })

  it('cierra el detalle al cambiar la clínica', async () => {
    const user = userEvent.setup()
    renderPagina()
    await abrirDetalle(user)

    await user.click(screen.getByRole('button', { name: /todas las clínicas/i }))
    await user.click(await screen.findByRole('option', { name: /clínica 02 - pediatría/i }))

    await waitFor(() => {
      expect(screen.queryByText('Detalle del expediente')).not.toBeInTheDocument()
    })
  })

  it('cierra el detalle al cambiar el médico', async () => {
    const user = userEvent.setup()
    renderPagina()
    await abrirDetalle(user)

    await user.click(screen.getByRole('button', { name: /todos los médicos/i }))
    await user.click(await screen.findByRole('option', { name: /dra\. elena marroquín/i }))

    await waitFor(() => {
      expect(screen.queryByText('Detalle del expediente')).not.toBeInTheDocument()
    })
  })
})

describe('ArchivoPage — buscador', () => {
  it('abre el detalle correcto al buscar un código válido', async () => {
    const user = userEvent.setup()
    renderPagina()
    await screen.findByRole('button', { name: NOMBRE_EXISTENTE })

    await user.type(screen.getByLabelText('Buscar expediente por código'), 'EXP-004521')
    await user.click(screen.getByRole('button', { name: /^buscar$/i }))

    expect(await screen.findByText('Detalle del expediente')).toBeInTheDocument()
    expect(screen.getByText('Expediente EXP-004521')).toBeInTheDocument()
  })

  it('normaliza mayúsculas y espacios del código', async () => {
    const user = userEvent.setup()
    renderPagina()
    await screen.findByRole('button', { name: NOMBRE_EXISTENTE })

    await user.type(screen.getByLabelText('Buscar expediente por código'), '  exp-004521 ')
    await user.click(screen.getByRole('button', { name: /^buscar$/i }))

    expect(await screen.findByText('Detalle del expediente')).toBeInTheDocument()
  })

  it('avisa cuando el código no existe', async () => {
    const user = userEvent.setup()
    renderPagina()
    await screen.findByRole('button', { name: NOMBRE_EXISTENTE })

    await user.type(screen.getByLabelText('Buscar expediente por código'), 'NO-EXISTE')
    await user.click(screen.getByRole('button', { name: /^buscar$/i }))

    await waitFor(() => {
      expect(screen.getByText('Expediente no encontrado')).toBeInTheDocument()
    })
  })

  it('no busca con código vacío o solo espacios', async () => {
    const user = userEvent.setup()
    renderPagina()
    await screen.findByRole('button', { name: NOMBRE_EXISTENTE })

    const input = screen.getByLabelText('Buscar expediente por código')
    await user.click(screen.getByRole('button', { name: /^buscar$/i }))
    await user.type(input, '   ')
    await user.click(screen.getByRole('button', { name: /^buscar$/i }))

    expect(buscarExpedientePorCodigo).not.toHaveBeenCalled()
    expect(screen.queryByText('Detalle del expediente')).not.toBeInTheDocument()
  })

  it('no dispara dos búsquedas por doble envío', async () => {
    let resolver
    buscarExpedientePorCodigo.mockReturnValueOnce(
      new Promise((res) => {
        resolver = res
      }),
    )

    renderPagina()
    await screen.findByRole('button', { name: NOMBRE_EXISTENTE })

    const input = screen.getByLabelText('Buscar expediente por código')
    fireEvent.change(input, { target: { value: 'EXP-004521' } })
    const form = input.closest('form')
    fireEvent.submit(form)
    fireEvent.submit(form)

    expect(buscarExpedientePorCodigo).toHaveBeenCalledTimes(1)

    await act(async () => {
      resolver(null)
    })
  })
})

describe('ArchivoPage — protección contra doble activación', () => {
  it('no ejecuta dos veces la mutación al avanzar por doble clic', async () => {
    let resolver
    avanzarEstado.mockReturnValueOnce(
      new Promise((res) => {
        resolver = res
      }),
    )

    const user = userEvent.setup()
    renderPagina()
    await abrirDetalle(user)

    const boton = screen.getByRole('button', { name: /avanzar al siguiente estado/i })
    await user.click(boton)
    await user.click(boton)

    expect(avanzarEstado).toHaveBeenCalledTimes(1)

    await act(async () => {
      resolver({
        id: 1,
        pacienteNombre: 'María Fernanda López García',
        numeroExpediente: 'EXP-004521',
        expedienteNuevo: false,
        estado: 'en_busqueda',
        clinicaNombre: 'Clínica 01 - Medicina General',
        medicoNombre: 'Dr. Jorge Castillo',
        fechaCita: '2026-09-21',
        horaEstimada: '10:20:00',
        ubicacion: 'Estante A',
        historial: [],
      })
    })
  })
})

describe('ArchivoPage — selección accesible', () => {
  it('refleja la selección con aria-pressed', async () => {
    const user = userEvent.setup()
    renderPagina()

    const tarjeta = await screen.findByRole('button', { name: NOMBRE_EXISTENTE })
    expect(tarjeta).toHaveAttribute('aria-pressed', 'false')

    await user.click(tarjeta)
    expect(tarjeta).toHaveAttribute('aria-pressed', 'true')
  })
})
