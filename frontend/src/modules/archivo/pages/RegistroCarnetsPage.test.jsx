import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '@/shared/context/AuthContext.jsx'
import { ThemeProvider } from '@/shared/context/ThemeContext.jsx'
import { ToastProvider } from '@/shared/context/ToastContext.jsx'

vi.mock('@/modules/carnets/api/carnetsApi', () => ({
  listarEspecialidades: vi.fn(),
  listarCarnets: vi.fn(),
  registrarCarnet: vi.fn(),
  ETIQUETAS_ESTADO_CARNET: {
    registrado: 'Registrado',
    encontrado: 'Encontrado',
  },
}))

import {
  listarCarnets,
  listarEspecialidades,
  registrarCarnet,
} from '@/modules/carnets/api/carnetsApi'
import RegistroCarnetsPage from './RegistroCarnetsPage.jsx'

function renderPagina() {
  return render(
    <MemoryRouter initialEntries={['/enfermeria/carnets']}>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <RegistroCarnetsPage />
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </MemoryRouter>,
  )
}

const campo = () => screen.getByPlaceholderText('Ej. 837871')
const botonRegistrar = () => screen.getByRole('button', { name: /registrar carnet/i })
const selectEspecialidad = () => screen.getByLabelText(/especialidad/i)

async function seleccionarEspecialidad() {
  await userEvent.selectOptions(selectEspecialidad(), '1')
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
  })

  it('muestra la vista en estado inicial sin registros', async () => {
    renderPagina()

    expect(screen.getByRole('heading', { name: 'Registro de carnets' })).toBeInTheDocument()
    expect(await screen.findByText('Aún no hay carnets registrados hoy')).toBeInTheDocument()
  })

  it('registra un carnet y muestra correlativo + especialidad', async () => {
    const user = userEvent.setup()
    registrarCarnet.mockResolvedValue(carnetRegistrado)
    renderPagina()

    await screen.findByRole('option', { name: 'Hematología' })
    await seleccionarEspecialidad()
    await user.type(campo(), '837871')
    await user.click(botonRegistrar())

    expect(await screen.findByTestId('correlativo-asignado')).toHaveTextContent('3')
    expect(screen.getByTestId('paciente')).toHaveTextContent('Adolfo Martin Ajucum Cua')
    expect(campo()).toHaveValue('')
    expect(registrarCarnet).toHaveBeenCalledWith({
      numeroExpediente: '837871',
      especialidadId: 1,
    })
  })

  it('avisa cuando el expediente ya fue registrado hoy (409)', async () => {
    const user = userEvent.setup()
    registrarCarnet.mockRejectedValue(
      Object.assign(new Error('Este expediente ya fue registrado. Correlativo: 3'), {
        status: 409,
      }),
    )
    renderPagina()

    await screen.findByRole('option', { name: 'Hematología' })
    await seleccionarEspecialidad()
    await user.type(campo(), '837871')
    await user.click(botonRegistrar())

    expect(await screen.findByText(/ya fue registrado/i)).toBeInTheDocument()
  })

  it('avisa cuando el expediente no existe (404)', async () => {
    const user = userEvent.setup()
    registrarCarnet.mockRejectedValue(
      Object.assign(new Error('no encontrado'), { status: 404 }),
    )
    renderPagina()

    await screen.findByRole('option', { name: 'Hematología' })
    await seleccionarEspecialidad()
    await user.type(campo(), '000000')
    await user.click(botonRegistrar())

    expect(await screen.findByText(/Expediente no encontrado/i)).toBeInTheDocument()
  })
})
