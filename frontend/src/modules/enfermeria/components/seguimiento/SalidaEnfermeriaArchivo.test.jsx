import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToastProvider } from '@/shared/context/ToastContext.jsx'

const { actualizarMock, eliminarMock, listarMock } = vi.hoisted(() => ({
  actualizarMock: vi.fn(),
  eliminarMock: vi.fn(),
  listarMock: vi.fn(),
}))

vi.mock('../../api/salidaEnfermeriaArchivoApi', () => ({
  actualizarSalidaEnfermeriaArchivo: actualizarMock,
  descargarSalidasEnfermeriaArchivoPdf: vi.fn(),
  eliminarSalidaEnfermeriaArchivo: eliminarMock,
  listarSalidasEnfermeriaArchivo: listarMock,
  registrarSalidaEnfermeriaArchivo: vi.fn(),
}))

import SalidaEnfermeriaArchivo from './SalidaEnfermeriaArchivo.jsx'

const SALIDAS = [
  {
    id: 'salida-1',
    fecha: '2026-10-27',
    estacionId: 1,
    numeroExpediente: '1001',
    pacienteNombre: 'Paciente Uno',
    tipo: 'presentacion',
    primeraVez: false,
    clinicaPersonalId: null,
    clinicaPersonalNombre: null,
    registradoEn: '2026-10-27T10:00:00-06:00',
  },
  {
    id: 'salida-2',
    fecha: '2026-10-27',
    estacionId: 1,
    numeroExpediente: '2002',
    pacienteNombre: 'Paciente Dos',
    tipo: 'clinica_mujer',
    primeraVez: true,
    clinicaPersonalId: null,
    clinicaPersonalNombre: null,
    registradoEn: '2026-10-27T11:00:00-06:00',
  },
]

function renderComponente() {
  return render(
    <ToastProvider>
      <SalidaEnfermeriaArchivo
        estacionId={1}
        fecha="2026-10-27"
        clinicas={[{ id: 'clinica-1', nombre: 'Clínica 1' }]}
      />
    </ToastProvider>,
  )
}

beforeEach(() => {
  actualizarMock.mockReset()
  eliminarMock.mockReset()
  listarMock.mockReset()
  listarMock.mockResolvedValue(SALIDAS)
  actualizarMock.mockImplementation(async (id, datos) => ({
    ...SALIDAS.find((salida) => salida.id === id),
    ...datos,
    clinicaPersonalNombre: datos.clinicaPersonalId ? 'Clínica 1' : null,
  }))
  eliminarMock.mockResolvedValue({ ok: true })
})

describe('SalidaEnfermeriaArchivo', () => {
  it('muestra el buscador visible y filtra por expediente', async () => {
    const user = userEvent.setup()
    renderComponente()

    expect((await screen.findAllByText('Paciente Uno')).length).toBeGreaterThan(0)
    const buscador = screen.getByPlaceholderText('Expediente, paciente o etiqueta')
    await user.type(buscador, '1001')

    expect(screen.getAllByText('Paciente Uno').length).toBeGreaterThan(0)
    expect(screen.queryAllByText('Paciente Dos')).toHaveLength(0)
  })

  it('incluye la etiqueta Clínica de la Mujer junto a Presentación', async () => {
    renderComponente()

    expect(await screen.findByRole('button', { name: /Presentación/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Clínica de la Mujer/ })).toBeInTheDocument()
  })

  it('permite editar una salida', async () => {
    const user = userEvent.setup()
    renderComponente()

    const [editar] = await screen.findAllByRole('button', { name: 'Editar 10-01' })
    await user.click(editar)
    const etiqueta = screen.getByLabelText('Etiqueta')
    await user.selectOptions(etiqueta, 'clinica_mujer')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    await waitFor(() =>
      expect(actualizarMock).toHaveBeenCalledWith(
        'salida-1',
        expect.objectContaining({ numeroExpediente: '1001', tipo: 'clinica_mujer' }),
      ),
    )
  })

  it('permite eliminar una salida con confirmación', async () => {
    const user = userEvent.setup()
    renderComponente()

    const [eliminar] = await screen.findAllByRole('button', { name: 'Eliminar 10-01' })
    await user.click(eliminar)
    await user.click(screen.getByRole('button', { name: 'Eliminar' }))

    await waitFor(() => expect(eliminarMock).toHaveBeenCalledWith('salida-1'))
    expect(screen.queryAllByText('Paciente Uno')).toHaveLength(0)
  })
})
