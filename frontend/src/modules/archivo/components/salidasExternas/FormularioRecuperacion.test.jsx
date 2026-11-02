import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FormularioRecuperacion from './FormularioRecuperacion.jsx'

function propiedades(overrides = {}) {
  return {
    abierto: true,
    onCerrar: vi.fn(),
    onRecuperar: vi.fn(),
    recuperando: false,
    error: null,
    ...overrides,
  }
}

async function llenar(usuario, { hora = '09:15' } = {}) {
  await usuario.type(screen.getByLabelText('Número de expediente a recuperar'), '927581')
  await usuario.type(screen.getByLabelText('Persona que retiró'), 'Ana Ramírez')
  await usuario.type(screen.getByLabelText('Motivo'), 'Tesis')
  await usuario.type(screen.getByLabelText('Fecha original de salida'), '30/10/2026')
  if (hora) await usuario.type(screen.getByLabelText('Hora original de salida'), hora)
}

describe('FormularioRecuperacion', () => {
  it('no muestra el modal cuando está cerrado', () => {
    render(<FormularioRecuperacion {...propiedades({ abierto: false })} />)

    expect(screen.queryByLabelText('Número de expediente a recuperar')).not.toBeInTheDocument()
  })

  it('muestra el modal con los cinco campos', () => {
    render(<FormularioRecuperacion {...propiedades()} />)

    expect(screen.getByLabelText('Número de expediente a recuperar')).toBeInTheDocument()
    expect(screen.getByLabelText('Persona que retiró')).toBeInTheDocument()
    expect(screen.getByLabelText('Motivo')).toBeInTheDocument()
    expect(screen.getByLabelText('Fecha original de salida')).toBeInTheDocument()
    expect(screen.getByLabelText('Hora original de salida')).toBeInTheDocument()
    expect(screen.getByText(/HH:mm \(ejemplo 09:15\)/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument()
  })

  it('cancela sin llamar a la API', async () => {
    const props = propiedades()
    const usuario = userEvent.setup()
    render(<FormularioRecuperacion {...props} />)

    await usuario.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(props.onCerrar).toHaveBeenCalledTimes(1)
    expect(props.onRecuperar).not.toHaveBeenCalled()
  })

  it('exige los cinco datos antes de llamar a la API', async () => {
    const props = propiedades()
    const usuario = userEvent.setup()
    render(<FormularioRecuperacion {...props} />)

    await usuario.click(screen.getByRole('button', { name: 'Recuperar préstamo' }))

    expect(screen.getByText('Faltan datos')).toBeInTheDocument()
    expect(props.onRecuperar).not.toHaveBeenCalled()
  })

  it('no asume una hora por defecto', async () => {
    const props = propiedades()
    const usuario = userEvent.setup()
    render(<FormularioRecuperacion {...props} />)

    await llenar(usuario, { hora: null })
    await usuario.click(screen.getByRole('button', { name: 'Recuperar préstamo' }))

    expect(props.onRecuperar).not.toHaveBeenCalled()
  })

  it('envía fecha y hora originales', async () => {
    const props = propiedades({ onRecuperar: vi.fn().mockResolvedValue({ id: 'se-1' }) })
    const usuario = userEvent.setup()
    render(<FormularioRecuperacion {...props} />)

    await llenar(usuario)
    await usuario.click(screen.getByRole('button', { name: 'Recuperar préstamo' }))

    expect(props.onRecuperar).toHaveBeenCalledWith({
      numeroExpediente: '927581',
      personaRetira: 'Ana Ramírez',
      motivo: 'Tesis',
      fechaSalida: '2026-10-30',
      horaSalida: '09:15',
    })
  })

  it('cierra el modal después del éxito', async () => {
    const props = propiedades({ onRecuperar: vi.fn().mockResolvedValue({ id: 'se-1' }) })
    const usuario = userEvent.setup()
    render(<FormularioRecuperacion {...props} />)

    await llenar(usuario)
    await usuario.click(screen.getByRole('button', { name: 'Recuperar préstamo' }))

    expect(props.onCerrar).toHaveBeenCalledTimes(1)
  })

  it('muestra el error sin cerrar ni perder los campos', async () => {
    const props = propiedades({ onRecuperar: vi.fn().mockResolvedValue(null) })
    const usuario = userEvent.setup()
    const { rerender } = render(<FormularioRecuperacion {...props} />)

    await llenar(usuario)
    await usuario.click(screen.getByRole('button', { name: 'Recuperar préstamo' }))

    rerender(
      <FormularioRecuperacion
        {...props}
        error={{ codigo: 'SALIDAS_EXTERNAS_PRESTAMO_DUPLICADO', mensaje: 'Ya tiene un préstamo.' }}
      />,
    )

    expect(props.onCerrar).not.toHaveBeenCalled()
    expect(screen.getByLabelText('Número de expediente a recuperar')).toHaveValue('927581')
    expect(screen.getByText('No se pudo recuperar el préstamo')).toBeInTheDocument()
    expect(screen.getByText('Ya tiene un préstamo.')).toBeInTheDocument()
  })

  it('deshabilita las acciones mientras recupera', async () => {
    const props = propiedades({ recuperando: true })
    const usuario = userEvent.setup()
    render(<FormularioRecuperacion {...props} />)

    expect(screen.getByRole('button', { name: 'Recuperando…' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled()

    await usuario.click(screen.getByRole('button', { name: 'Recuperando…' }))
    expect(props.onRecuperar).not.toHaveBeenCalled()
  })

  it('limpia los campos al reabrir el modal', async () => {
    const props = propiedades({ onRecuperar: vi.fn().mockResolvedValue(null) })
    const usuario = userEvent.setup()
    const { rerender } = render(<FormularioRecuperacion {...props} />)

    await llenar(usuario)
    rerender(<FormularioRecuperacion {...props} abierto={false} />)
    rerender(<FormularioRecuperacion {...props} abierto />)

    expect(screen.getByLabelText('Número de expediente a recuperar')).toHaveValue('')
    expect(screen.getByLabelText('Persona que retiró')).toHaveValue('')
  })
})

describe('máscaras de fecha y hora', () => {
  const fechaInput = () => screen.getByLabelText('Fecha original de salida')
  const horaInput = () => screen.getByLabelText('Hora original de salida')

  function abrir(overrides = {}) {
    const props = propiedades({
      onRecuperar: vi.fn().mockResolvedValue({ id: 'se-1' }),
      ...overrides,
    })
    const usuario = userEvent.setup()
    render(<FormularioRecuperacion {...props} />)
    return { usuario, props }
  }

  async function completar(usuario, { fecha = '01112026', hora = '0930' } = {}) {
    await usuario.type(screen.getByLabelText('Número de expediente a recuperar'), '111111')
    await usuario.type(screen.getByLabelText('Persona que retiró'), 'Ana Ramírez')
    await usuario.type(screen.getByLabelText('Motivo'), 'Tesis')
    if (fecha) await usuario.type(fechaInput(), fecha)
    if (hora) await usuario.type(horaInput(), hora)
  }

  it('coloca las barras automáticamente al escribir 01112026', async () => {
    const { usuario } = abrir()
    await usuario.type(fechaInput(), '01112026')
    expect(fechaInput()).toHaveValue('01/11/2026')
  })

  it('coloca los dos puntos automáticamente al escribir 0930', async () => {
    const { usuario } = abrir()
    await usuario.type(horaInput(), '0930')
    expect(horaInput()).toHaveValue('09:30')
  })

  it('acepta una hora de la tarde 1545', async () => {
    const { usuario } = abrir()
    await usuario.type(horaInput(), '1545')
    expect(horaInput()).toHaveValue('15:45')
  })

  it('acepta entradas que ya traen separadores', async () => {
    const { usuario } = abrir()
    await usuario.type(fechaInput(), '01/11/2026')
    await usuario.type(horaInput(), '15:45')

    expect(fechaInput()).toHaveValue('01/11/2026')
    expect(horaInput()).toHaveValue('15:45')
  })

  it('muestra una fecha parcial sin completarla', async () => {
    const { usuario } = abrir()
    await usuario.type(fechaInput(), '0111')
    expect(fechaInput()).toHaveValue('01/11')
  })

  it('muestra una hora parcial sin completarla', async () => {
    const { usuario } = abrir()
    await usuario.type(horaInput(), '09')
    expect(horaInput()).toHaveValue('09')

    await usuario.type(horaInput(), '3')
    expect(horaInput()).toHaveValue('09:3')
  })

  it('permite borrar con Backspace', async () => {
    const { usuario } = abrir()
    await usuario.type(fechaInput(), '01112026')

    await usuario.type(fechaInput(), '{Backspace}')
    expect(fechaInput()).toHaveValue('01/11/202')
  })

  it('borra un dígito al pulsar Backspace sobre la barra', async () => {
    const { usuario } = abrir()
    const input = fechaInput()
    await usuario.type(input, '01112026')
    input.setSelectionRange(3, 3)

    await usuario.keyboard('{Backspace}')

    expect(input.value.replace(/\D/g, '').length).toBe(7)
  })

  it('borra un dígito al pulsar Delete sobre la barra', async () => {
    const { usuario } = abrir()
    const input = fechaInput()
    await usuario.type(input, '01112026')
    input.setSelectionRange(2, 2)

    await usuario.keyboard('{Delete}')

    expect(input.value.replace(/\D/g, '').length).toBe(7)
  })

  it('permite sustituir el valor completo', async () => {
    const { usuario } = abrir()
    await usuario.type(fechaInput(), '01112026')
    await usuario.clear(fechaInput())
    await usuario.type(fechaInput(), '25122026')

    expect(fechaInput()).toHaveValue('25/12/2026')
  })

  it('acepta pegar una fecha DD/MM/AAAA o ISO', async () => {
    abrir()

    fireEvent.change(fechaInput(), { target: { value: '01/11/2026' } })
    expect(fechaInput()).toHaveValue('01/11/2026')

    fireEvent.change(fechaInput(), { target: { value: '2026-11-01' } })
    expect(fechaInput()).toHaveValue('01/11/2026')
  })

  it('acepta pegar una hora con o sin separador', async () => {
    abrir()

    fireEvent.change(horaInput(), { target: { value: '0930' } })
    expect(horaInput()).toHaveValue('09:30')

    fireEvent.change(horaInput(), { target: { value: '9:30' } })
    expect(horaInput()).toHaveValue('09:30')
  })

  it('rechaza una fecha inexistente sin llamar a la API', async () => {
    const { usuario, props } = abrir()
    await completar(usuario, { fecha: '31022026' })

    expect(fechaInput()).toHaveValue('31/02/2026')
    await usuario.click(screen.getByRole('button', { name: 'Recuperar préstamo' }))

    expect(screen.getByText(/La fecha original no es válida/)).toBeInTheDocument()
    expect(props.onRecuperar).not.toHaveBeenCalled()
  })

  it('rechaza una hora fuera de rango sin llamar a la API', async () => {
    const { usuario, props } = abrir()
    await completar(usuario, { hora: '2590' })

    expect(horaInput()).toHaveValue('25:90')
    await usuario.click(screen.getByRole('button', { name: 'Recuperar préstamo' }))

    expect(screen.getByText(/La hora original no es válida/)).toBeInTheDocument()
    expect(props.onRecuperar).not.toHaveBeenCalled()
  })

  it('rechaza una fecha futura', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-11-02T18:00:00.000Z'))

    try {
      const { usuario, props } = abrir()
      await completar(usuario, { fecha: '03112026', hora: '0900' })

      await usuario.click(screen.getByRole('button', { name: 'Recuperar préstamo' }))

      expect(screen.getByText(/no pueden ser posteriores/)).toBeInTheDocument()
      expect(props.onRecuperar).not.toHaveBeenCalled()
    } finally {
      vi.useRealTimers()
    }
  })

  it('convierte DD/MM/AAAA a YYYY-MM-DD al recuperar', async () => {
    const { usuario, props } = abrir()
    await completar(usuario, { fecha: '01112026', hora: '0930' })

    await usuario.click(screen.getByRole('button', { name: 'Recuperar préstamo' }))

    expect(props.onRecuperar).toHaveBeenCalledWith({
      numeroExpediente: '111111',
      personaRetira: 'Ana Ramírez',
      motivo: 'Tesis',
      fechaSalida: '2026-11-01',
      horaSalida: '09:30',
    })
  })

  it('expone controles numéricos para teclado y móvil', () => {
    abrir()

    expect(fechaInput()).toHaveAttribute('inputmode', 'numeric')
    expect(horaInput()).toHaveAttribute('inputmode', 'numeric')
    expect(fechaInput()).toHaveAttribute('placeholder', 'DD/MM/AAAA')
    expect(horaInput()).toHaveAttribute('placeholder', 'HH:mm')
  })

  it('limita la altura y desplaza verticalmente en pantallas pequeñas', () => {
    abrir()

    const scroll = screen.getByTestId('recuperacion-scroll')

    expect(scroll).toHaveClass('max-h-[calc(100dvh-9rem)]')
    expect(scroll).toHaveClass('overflow-y-auto')
    expect(scroll).not.toHaveClass('overflow-x-auto')

    // Campos, validaciones y ambos botones quedan dentro del área desplazable.
    expect(within(scroll).getByLabelText('Número de expediente a recuperar')).toBeInTheDocument()
    expect(within(scroll).getByLabelText('Fecha original de salida')).toBeInTheDocument()
    expect(within(scroll).getByRole('button', { name: 'Cancelar' })).toBeInTheDocument()
    expect(within(scroll).getByRole('button', { name: 'Recuperar préstamo' })).toBeInTheDocument()
  })

  it('cierra con la tecla Escape', async () => {
    const props = propiedades()
    const usuario = userEvent.setup()
    render(<FormularioRecuperacion {...props} />)

    await usuario.keyboard('{Escape}')

    expect(props.onCerrar).toHaveBeenCalled()
  })
})
