import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '@/shared/context/AuthContext.jsx'
import { ThemeProvider } from '@/shared/context/ThemeContext.jsx'
import { ToastProvider } from '@/shared/context/ToastContext.jsx'

// Se mockea el escáner de cámara para capturar el callback de lectura y
// verificar que al escanear un código se registra solo (equivalente a Enter).
const { callbackRef } = vi.hoisted(() => ({ callbackRef: { actual: null } }))

vi.mock('../hooks/useEscanerCodigo', () => ({
  useEscanerCodigo: (onCodigo) => {
    callbackRef.actual = onCodigo
    return {
      videoRef: { current: null },
      activo: false,
      error: null,
      soporteCamara: true,
      iniciar: vi.fn(),
      detener: vi.fn(),
    }
  },
}))

vi.mock('@/modules/carnets/api/carnetsApi', () => ({
  listarEspecialidades: vi.fn(() => Promise.resolve([{ id: 1, nombre: 'Hematología' }])),
  listarCarnets: vi.fn(() => Promise.resolve([])),
  registrarCarnet: vi.fn(),
  ETIQUETAS_ESTADO_CARNET: { registrado: 'Registrado' },
}))

import { registrarCarnet } from '@/modules/carnets/api/carnetsApi'
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

describe('RegistroCarnetsPage — escaneo con cámara', () => {
  beforeEach(() => {
    localStorage.clear()
    registrarCarnet.mockReset()
  })

  it('registra automáticamente al leer un código, sin pasos adicionales', async () => {
    registrarCarnet.mockResolvedValue({
      correlativo: 5,
      especialidadNombre: 'Hematología',
      numeroExpediente: '837871',
      pacienteNombre: 'Adolfo Martin Ajucum Cua',
      estado: 'registrado',
      registradoEn: '2026-10-07T12:00:00-06:00',
    })
    renderPagina()

    await screen.findByRole('option', { name: 'Hematología' })
    await userEvent.selectOptions(screen.getByLabelText(/especialidad/i), '1')

    await act(async () => {
      await callbackRef.actual('837871')
    })

    expect(await screen.findByTestId('correlativo-asignado')).toHaveTextContent('5')
    expect(screen.getByTestId('paciente')).toHaveTextContent('Adolfo Martin Ajucum Cua')
    expect(registrarCarnet).toHaveBeenCalledWith({
      numeroExpediente: '837871',
      especialidadId: 1,
    })
  })
})
