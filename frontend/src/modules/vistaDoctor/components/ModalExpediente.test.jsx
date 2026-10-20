import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ModalExpediente from './ModalExpediente.jsx'
import { normalizarTurno } from '../api/doctorMappers'
import { turnosDeClinica } from '../api/mockData'

const TURNOS = turnosDeClinica(101).map(normalizarTurno)
const CON_EXPEDIENTE = TURNOS.find((turno) => turno.id === 1001)
const SIN_EXPEDIENTE = TURNOS.find((turno) => turno.id === 1006)
const IDENTIFICADO = {
  ...CON_EXPEDIENTE,
  identificado: true,
  expediente: '0000000001',
  pacienteNombre: 'Rosa María Demo',
}

function renderModal(props = {}) {
  const onCerrar = vi.fn()
  const onRegistrar = vi.fn().mockResolvedValue({})
  render(
    <ModalExpediente
      abierto
      turno={IDENTIFICADO}
      onCerrar={onCerrar}
      onRegistrar={onRegistrar}
      {...props}
    />,
  )
  return { onCerrar, onRegistrar }
}

function dialogo() {
  return screen.getByRole('dialog')
}

function campo() {
  return within(dialogo()).getByRole('textbox', { name: /Número de expediente/i })
}

describe('ModalExpediente', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('muestra el expediente actual y permite cancelar sin guardar', async () => {
    const usuario = userEvent.setup()
    const { onCerrar, onRegistrar } = renderModal()

    expect(campo()).toHaveValue('0000000001')
    expect(within(dialogo()).getByText(/Paciente verificado/)).toBeInTheDocument()

    await usuario.click(within(dialogo()).getByRole('button', { name: 'Cancelar' }))

    expect(onCerrar).toHaveBeenCalledTimes(1)
    expect(onRegistrar).not.toHaveBeenCalled()
  })

  it('no expone nombre ni expediente antes de identificar el turno', () => {
    renderModal({ turno: CON_EXPEDIENTE })

    expect(campo()).toHaveValue('')
    expect(within(dialogo()).getByText(/Pendiente de identificar/)).toBeInTheDocument()
    expect(within(dialogo()).getByText(/Expediente actual: sin registrar/)).toBeInTheDocument()
    expect(within(dialogo()).queryByText(/Rosa María Demo/)).not.toBeInTheDocument()
  })

  it('consulta un expediente válido y confirma la asociación', async () => {
    const usuario = userEvent.setup()
    const { onRegistrar } = renderModal({ turno: SIN_EXPEDIENTE })

    await usuario.type(campo(), '0000000006')
    await usuario.click(within(dialogo()).getByRole('button', { name: 'Consultar expediente' }))

    expect(
      await within(dialogo()).findByText(/Carlos Eduardo Demo · 0000000006/),
    ).toBeInTheDocument()
    await usuario.click(within(dialogo()).getByRole('button', { name: 'Asociar expediente' }))

    await waitFor(() => expect(onRegistrar).toHaveBeenCalledWith('0000000006'))
  })

  it('rechaza entradas vacías y expedientes inexistentes', async () => {
    const usuario = userEvent.setup()
    renderModal({ turno: SIN_EXPEDIENTE })

    await usuario.click(within(dialogo()).getByRole('button', { name: 'Consultar expediente' }))
    expect(
      await within(dialogo()).findByText(/Ingresa un número de expediente válido/i),
    ).toBeInTheDocument()

    await usuario.type(campo(), '9999999999')
    await usuario.click(within(dialogo()).getByRole('button', { name: 'Consultar expediente' }))
    expect(
      await within(dialogo()).findByText(/No encontramos un paciente ficticio/i),
    ).toBeInTheDocument()
  })

  it.each(['12A45', '123-456', '12.3', '-1', '12345678901'])(
    'rechaza el formato inválido %s',
    async (valor) => {
      const usuario = userEvent.setup()
      const { onRegistrar } = renderModal({ turno: SIN_EXPEDIENTE })

      fireEvent.change(campo(), { target: { value: valor } })
      await usuario.click(within(dialogo()).getByRole('button', { name: 'Consultar expediente' }))

      expect(await within(dialogo()).findByText(/de 1 a 10 dígitos numéricos/i)).toBeInTheDocument()
      expect(within(dialogo()).getByRole('button', { name: 'Asociar expediente' })).toBeDisabled()
      expect(onRegistrar).not.toHaveBeenCalled()
    },
  )

  it('rechaza un texto pegado con formato inválido', async () => {
    renderModal({ turno: SIN_EXPEDIENTE })

    fireEvent.paste(campo(), {
      clipboardData: { getData: () => '12A45' },
    })

    expect(await within(dialogo()).findByText(/de 1 a 10 dígitos numéricos/i)).toBeInTheDocument()
  })

  it('bloquea expedientes de otro paciente', async () => {
    const usuario = userEvent.setup()
    const { onRegistrar } = renderModal()

    await usuario.clear(campo())
    await usuario.type(campo(), '0000000999')
    await usuario.click(within(dialogo()).getByRole('button', { name: 'Consultar expediente' }))

    expect(
      await within(dialogo()).findByText(/El expediente pertenece a otro paciente/),
    ).toBeInTheDocument()
    expect(within(dialogo()).getByRole('button', { name: 'Asociar expediente' })).toBeDisabled()
    expect(onRegistrar).not.toHaveBeenCalled()
  })

  it('mantiene deshabilitada la edición si la jornada está cerrada', () => {
    renderModal({ deshabilitado: true })

    expect(campo()).toBeDisabled()
    expect(within(dialogo()).getByRole('button', { name: 'Consultar expediente' })).toBeDisabled()
    expect(within(dialogo()).getByRole('button', { name: 'Asociar expediente' })).toBeDisabled()
  })
})
