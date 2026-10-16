import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '@/shared/context/AuthContext.jsx'
import { EstacionProvider } from '@/shared/context/EstacionContext.jsx'
import { ThemeProvider } from '@/shared/context/ThemeContext.jsx'
import { ToastProvider } from '@/shared/context/ToastContext.jsx'

vi.mock('@/modules/carnets/api/carnetsApi', () => ({
  listarEspecialidades: vi.fn(),
  listarEspecialidadesActivasEstacion: vi.fn(),
  listarEstaciones: vi.fn(() => Promise.resolve([])),
  listarCarnets: vi.fn(),
  registrarCarnet: vi.fn(),
  corregirEspecialidadCarnet: vi.fn(),
  eliminarCarnet: vi.fn(() => Promise.resolve({})),
  obtenerCarnet: vi.fn(),
  ETIQUETAS_ESTADO_CARNET: {
    registrado: 'Registrado',
  },
}))

import {
  corregirEspecialidadCarnet,
  eliminarCarnet,
  listarCarnets,
  listarEspecialidades,
  registrarCarnet,
} from '@/modules/carnets/api/carnetsApi'
import { hoyIso } from '@/shared/utils/fecha'
import RegistroCarnetsPage from './RegistroCarnetsPage.jsx'

function renderPagina() {
  return render(
    <MemoryRouter initialEntries={['/enfermeria/carnets']}>
      <ThemeProvider>
        <AuthProvider>
          <EstacionProvider>
            <ToastProvider>
              <RegistroCarnetsPage />
            </ToastProvider>
          </EstacionProvider>
        </AuthProvider>
      </ThemeProvider>
    </MemoryRouter>,
  )
}

const campo = () => screen.getByPlaceholderText('Ej. 837871')
const botonRegistrar = () => screen.getByRole('button', { name: /registrar carnet/i })
async function seleccionarEspecialidad() {
  await userEvent.click(await screen.findByRole('radio', { name: 'Hematología' }))
}

const carnetRegistrado = {
  id: 'c-1',
  correlativo: 3,
  especialidadId: 1,
  especialidadNombre: 'Hematología',
  numeroExpediente: '837871',
  pacienteNombre: 'Adolfo Martin Ajucum Cua',
  estado: 'registrado',
  registradoEn: '2026-10-07T12:00:00-06:00',
}

describe('RegistroCarnetsPage', () => {
  beforeEach(() => {
    localStorage.clear()
    listarEspecialidades.mockReset().mockResolvedValue([{ id: 1, nombre: 'Hematología' }])
    listarCarnets.mockReset().mockResolvedValue([])
    registrarCarnet.mockReset()
    corregirEspecialidadCarnet.mockReset()
    eliminarCarnet.mockReset().mockResolvedValue({})
  })

  it('muestra la vista en estado inicial sin registros recientes', async () => {
    renderPagina()

    expect(screen.getByRole('heading', { name: 'Especialidad' })).toBeInTheDocument()
    expect(await screen.findByText('Aún no hay registros para corregir')).toBeInTheDocument()
  })

  it('registra un carnet y muestra correlativo + especialidad', async () => {
    const user = userEvent.setup()
    registrarCarnet.mockResolvedValue(carnetRegistrado)
    renderPagina()

    await seleccionarEspecialidad()
    await user.type(campo(), '837871')
    await user.click(botonRegistrar())

    expect(await screen.findByTestId('correlativo-asignado')).toHaveTextContent('3')
    expect(screen.getByTestId('paciente')).toHaveTextContent('Adolfo Martin Ajucum Cua')
    expect(campo()).toHaveValue('')
    expect(registrarCarnet).toHaveBeenCalledWith({
      numeroExpediente: '837871',
      especialidadId: 1,
      prioritario: false,
      privadoLibertad: false,
    })
  })

  it('permite corregir la especialidad de los últimos registros', async () => {
    const user = userEvent.setup()
    const reciente = { ...carnetRegistrado, fecha: hoyIso() }
    localStorage.setItem(
      'hro_cache_carnets_recientes',
      JSON.stringify({ valor: [reciente], expira: 0 }),
    )
    listarEspecialidades.mockResolvedValue([
      { id: 1, nombre: 'Hematología' },
      { id: 2, nombre: 'Pediatría' },
    ])
    corregirEspecialidadCarnet.mockResolvedValue({
      ...reciente,
      especialidadId: 2,
      especialidadNombre: 'Pediatría',
      correlativo: 1,
    })
    renderPagina()

    await user.click(await screen.findByRole('button', { name: /corregir especialidad/i }))
    await user.selectOptions(screen.getByLabelText(/nueva especialidad/i), '2')
    await user.type(screen.getByLabelText(/motivo/i), 'Especialidad equivocada')
    await user.click(screen.getByRole('button', { name: /^corregir$/i }))

    expect(corregirEspecialidadCarnet).toHaveBeenCalledWith('c-1', {
      especialidadId: 2,
      motivo: 'Especialidad equivocada',
    })
  })

  it('permite eliminar un registro reciente', async () => {
    const user = userEvent.setup()
    const reciente = { ...carnetRegistrado, fecha: hoyIso() }
    localStorage.setItem(
      'hro_cache_carnets_recientes',
      JSON.stringify({ valor: [reciente], expira: 0 }),
    )
    eliminarCarnet.mockResolvedValue({})
    renderPagina()

    await user.click(await screen.findByRole('button', { name: /^eliminar$/i }))
    await user.click(await screen.findByRole('button', { name: /sí, eliminar/i }))

    expect(eliminarCarnet).toHaveBeenCalledWith('c-1')
  })

  it('avisa cuando el expediente ya fue registrado hoy (409)', async () => {
    const user = userEvent.setup()
    registrarCarnet.mockRejectedValue(
      Object.assign(new Error('Este expediente ya fue registrado. Correlativo: 3'), {
        status: 409,
      }),
    )
    renderPagina()

    await seleccionarEspecialidad()
    await user.type(campo(), '837871')
    await user.click(botonRegistrar())

    expect(await screen.findByText(/ya fue registrado/i)).toBeInTheDocument()
  })

  it('avisa cuando el expediente no existe (404)', async () => {
    const user = userEvent.setup()
    registrarCarnet.mockRejectedValue(Object.assign(new Error('no encontrado'), { status: 404 }))
    renderPagina()

    await seleccionarEspecialidad()
    await user.type(campo(), '000000')
    await user.click(botonRegistrar())

    expect(await screen.findByText(/Expediente no encontrado/i)).toBeInTheDocument()
  })

  it('abre el reporte de carnets en un panel lateral', async () => {
    const user = userEvent.setup()
    renderPagina()

    await user.click(screen.getByRole('button', { name: /reporte/i }))

    expect(await screen.findByText('Reporte de carnets por especialidad')).toBeInTheDocument()
  })
})
