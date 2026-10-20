import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AccesoDoctor from './AccesoDoctor.jsx'
import { CLINICAS_MOCK } from '../api/mockData'

const clinica = CLINICAS_MOCK[0]
const asignacion = clinica.asignacion

function renderAcceso(onIdentificado = vi.fn()) {
  render(<AccesoDoctor clinica={clinica} asignacion={asignacion} onIdentificado={onIdentificado} />)
  return onIdentificado
}

function campoColegiado() {
  return screen.getByRole('textbox', { name: /Número de colegiado/i })
}

describe('AccesoDoctor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
  })

  it('valida el formato numérico antes de consultar', async () => {
    const usuario = userEvent.setup()
    const onIdentificado = renderAcceso()

    await usuario.type(campoColegiado(), 'abc')
    await usuario.click(screen.getByRole('button', { name: 'Continuar' }))

    expect(await screen.findByText(/Ingresa un número de colegiado válido/i)).toBeInTheDocument()
    expect(onIdentificado).not.toHaveBeenCalled()
  })

  it('identifica con un colegiado numérico sin prefijo', async () => {
    const usuario = userEvent.setup()
    const onIdentificado = renderAcceso()

    await usuario.type(campoColegiado(), '1001')
    await usuario.click(screen.getByRole('button', { name: 'Continuar' }))

    await waitFor(() => expect(onIdentificado).toHaveBeenCalledTimes(1))
    expect(onIdentificado).toHaveBeenCalledWith(
      expect.objectContaining({
        nombre: 'Dra. Ana Lucía Demo',
        colegiado: '1001',
      }),
    )
  })

  it('muestra un error claro para un colegiado inexistente', async () => {
    const usuario = userEvent.setup()
    const onIdentificado = renderAcceso()

    await usuario.type(campoColegiado(), '9999')
    await usuario.click(screen.getByRole('button', { name: 'Continuar' }))

    expect(
      await screen.findByText('No encontramos un médico con ese número de colegiado.'),
    ).toBeInTheDocument()
    expect(onIdentificado).not.toHaveBeenCalled()
  })

  it('rechaza a un médico inactivo', async () => {
    const usuario = userEvent.setup()
    const onIdentificado = renderAcceso()

    await usuario.type(campoColegiado(), '2001')
    await usuario.click(screen.getByRole('button', { name: 'Continuar' }))

    expect(
      await screen.findByText('El médico está inactivo. Contacta al administrador.'),
    ).toBeInTheDocument()
    expect(onIdentificado).not.toHaveBeenCalled()
  })

  it('no pide el nombre ni una selección de clínica', () => {
    renderAcceso()

    expect(screen.getByText(/Clínica 3 · Consulta Externa/)).toBeInTheDocument()
    expect(screen.getByText(/Medicina Interna · Nivel 2/)).toBeInTheDocument()
    expect(screen.getByText(/Válidos: 1001, 1002, 3001/)).toBeInTheDocument()
    expect(screen.queryByLabelText(/nombre del médico/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  })
})
