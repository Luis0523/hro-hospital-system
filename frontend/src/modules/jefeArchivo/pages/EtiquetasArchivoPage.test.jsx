import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToastProvider } from '@/shared/context/ToastContext.jsx'
import EtiquetasArchivoPage from './EtiquetasArchivoPage.jsx'
import {
  guardarAsignacionEtiquetas,
  listarAsignacionEtiquetas,
  listarCatalogoEtiquetas,
} from '@/modules/archivo/api/etiquetasArchivoApi'

vi.mock('@/modules/carnets/api/carnetsApi', () => ({
  listarEstaciones: vi.fn(() =>
    Promise.resolve([{ id: 1, codigo: 'EST-01', nombre: 'Estación 1' }]),
  ),
}))

vi.mock('@/modules/archivo/api/etiquetasArchivoApi', () => ({
  listarCatalogoEtiquetas: vi.fn(() =>
    Promise.resolve([
      {
        id: 1,
        codigo: 'clinica_mujer',
        nombre: 'Clínica de la Mujer',
        descripcion: 'Etiqueta de prueba',
        icono: 'female',
        color: 'rose',
        orden: 10,
        activo: true,
      },
      {
        id: 2,
        codigo: 'emergencia',
        nombre: 'Emergencia',
        descripcion: 'Otra etiqueta',
        icono: 'emergency',
        color: 'amber',
        orden: 20,
        activo: true,
      },
    ]),
  ),
  listarAsignacionEtiquetas: vi.fn(() =>
    Promise.resolve([
      {
        id: 1,
        codigo: 'clinica_mujer',
        nombre: 'Clínica de la Mujer',
        icono: 'female',
        color: 'rose',
        orden: 1,
      },
    ]),
  ),
  guardarAsignacionEtiquetas: vi.fn(() =>
    Promise.resolve([{ id: 1, codigo: 'clinica_mujer', nombre: 'Clínica de la Mujer' }]),
  ),
  crearEtiquetaArchivo: vi.fn(() => Promise.resolve({ id: 3 })),
  actualizarEtiquetaArchivo: vi.fn(() => Promise.resolve({ id: 1 })),
  desactivarEtiquetaArchivo: vi.fn(() => Promise.resolve({ id: 1 })),
  reactivarEtiquetaArchivo: vi.fn(() => Promise.resolve({ id: 1 })),
}))

function renderPagina() {
  return render(
    <ToastProvider>
      <EtiquetasArchivoPage />
    </ToastProvider>,
  )
}

describe('EtiquetasArchivoPage', () => {
  it('muestra el catálogo y la asignación de la estación', async () => {
    renderPagina()

    expect(
      await screen.findByRole('heading', { name: /etiquetas de archivo/i }),
    ).toBeInTheDocument()
    expect(await screen.findByText('Clínica de la Mujer')).toBeInTheDocument()
    expect(await screen.findByText('Emergencia')).toBeInTheDocument()
    expect(listarCatalogoEtiquetas).toHaveBeenCalled()
  })

  it('permite asignar y guardar etiquetas de una estación', async () => {
    const user = userEvent.setup()
    renderPagina()

    const selector = await screen.findByRole('combobox', { name: /estación/i })
    await user.selectOptions(selector, '1')

    await waitFor(() => expect(listarAsignacionEtiquetas).toHaveBeenCalledWith(1))
    expect(await screen.findByText(/habilitadas \(1\)/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /emergencia/i }))
    expect(await screen.findByText(/habilitadas \(2\)/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /guardar etiquetas/i }))

    await waitFor(() => expect(guardarAsignacionEtiquetas).toHaveBeenCalledWith(1, [1, 2]))
  })
})
