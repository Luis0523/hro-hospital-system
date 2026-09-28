import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useLectorCamara } from '../hooks/useLectorCamara'
import ScannerExpediente from './ScannerExpediente.jsx'

vi.mock('../hooks/useLectorCamara', () => ({ useLectorCamara: vi.fn() }))

function configurarHook(overrides = {}) {
  useLectorCamara.mockReturnValue({
    videoRef: { current: null },
    activo: false,
    error: null,
    soporteCamara: true,
    soporteDetector: true,
    iniciar: vi.fn(),
    detener: vi.fn(),
    ...overrides,
  })
}

function renderScanner(props = {}) {
  return render(
    <ScannerExpediente
      value=""
      onChange={() => {}}
      onSubmit={(event) => event.preventDefault()}
      {...props}
    />,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('ScannerExpediente', () => {
  it('mantiene la búsqueda manual y la opción de cámara', () => {
    configurarHook()
    renderScanner()

    expect(screen.getByLabelText('Buscar expediente por código')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Buscar' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /escanear con cámara/i })).toBeInTheDocument()
    expect(screen.queryByText(/campo simulado/i)).not.toBeInTheDocument()
  })

  it('activa la cámara con el botón', async () => {
    const iniciar = vi.fn()
    configurarHook({ iniciar })
    const user = userEvent.setup()
    renderScanner()

    await user.click(screen.getByRole('button', { name: /escanear con cámara/i }))

    expect(iniciar).toHaveBeenCalledTimes(1)
  })

  it('muestra la vista de cámara activa y permite cerrarla', async () => {
    const detener = vi.fn()
    configurarHook({ activo: true, detener })
    const user = userEvent.setup()
    renderScanner()

    expect(screen.getByLabelText('Vista de cámara')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /cerrar cámara/i }))
    expect(detener).toHaveBeenCalledTimes(1)
  })

  it('muestra el aviso cuando la cámara no está disponible', () => {
    configurarHook({
      error: 'Permiso de cámara denegado. Use la búsqueda manual.',
      soporteCamara: false,
      soporteDetector: false,
    })
    renderScanner()

    expect(screen.getByText('Cámara no disponible')).toBeInTheDocument()
    expect(screen.getByText(/permiso de cámara denegado/i)).toBeInTheDocument()
    expect(screen.getByLabelText('Buscar expediente por código')).toBeInTheDocument()
  })

  it('envía la búsqueda manual', async () => {
    configurarHook()
    const onSubmit = vi.fn((event) => event.preventDefault())
    const user = userEvent.setup()
    renderScanner({ value: 'EXP-2024-035', onSubmit })

    await user.click(screen.getByRole('button', { name: 'Buscar' }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
  })
})
