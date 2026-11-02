import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PanelPrestamo from './PanelPrestamo.jsx'
import { CODIGO_ENTRADA_INVALIDA, CODIGO_PRESTAMO_DUPLICADO } from '../../api/salidasExternasApi'

function propiedades(overrides = {}) {
  return {
    personaRetira: 'Ana Ramírez',
    onPersonaRetira: vi.fn(),
    motivo: 'Tesis',
    onMotivo: vi.fn(),
    numeroExpediente: '927581',
    onNumeroExpediente: vi.fn(),
    onRegistrar: vi.fn(),
    guardando: false,
    error: null,
    exito: null,
    ...overrides,
  }
}

describe('PanelPrestamo', () => {
  it('muestra los campos con etiquetas accesibles', () => {
    render(<PanelPrestamo {...propiedades()} />)

    expect(screen.getByLabelText('Persona que retira')).toHaveValue('Ana Ramírez')
    expect(screen.getByLabelText('Motivo del préstamo')).toHaveValue('Tesis')
    expect(screen.getByLabelText('Número de expediente')).toHaveValue('927581')
    expect(screen.getByRole('button', { name: 'Registrar préstamo' })).toBeEnabled()
  })

  it('registra con Enter desde el campo del expediente', async () => {
    const props = propiedades()
    const usuario = userEvent.setup()
    render(<PanelPrestamo {...props} />)

    await usuario.type(screen.getByLabelText('Número de expediente'), '{Enter}')

    expect(props.onRegistrar).toHaveBeenCalledTimes(1)
  })

  it('registra con el botón', async () => {
    const props = propiedades()
    const usuario = userEvent.setup()
    render(<PanelPrestamo {...props} />)

    await usuario.click(screen.getByRole('button', { name: 'Registrar préstamo' }))

    expect(props.onRegistrar).toHaveBeenCalledTimes(1)
  })

  it('deshabilita el botón y no registra mientras guarda', async () => {
    const props = propiedades({ guardando: true })
    const usuario = userEvent.setup()
    render(<PanelPrestamo {...props} />)

    const boton = screen.getByRole('button', { name: 'Registrando…' })
    expect(boton).toBeDisabled()

    await usuario.click(boton)
    expect(props.onRegistrar).not.toHaveBeenCalled()
  })

  it('no registra un segundo envío con doble Enter', async () => {
    const props = propiedades()
    const usuario = userEvent.setup()
    const { rerender } = render(<PanelPrestamo {...props} />)

    await usuario.type(screen.getByLabelText('Número de expediente'), '{Enter}')
    expect(props.onRegistrar).toHaveBeenCalledTimes(1)

    rerender(<PanelPrestamo {...props} guardando />)
    await usuario.type(screen.getByLabelText('Número de expediente'), '{Enter}')

    expect(props.onRegistrar).toHaveBeenCalledTimes(1)
  })

  it('muestra el error de datos incompletos', () => {
    render(
      <PanelPrestamo
        {...propiedades({
          error: {
            codigo: CODIGO_ENTRADA_INVALIDA,
            status: 400,
            mensaje: 'La persona que retira es obligatoria.',
            campo: 'personaRetira',
          },
        })}
      />,
    )

    const alerta = screen.getByRole('alert')
    expect(alerta).toHaveTextContent('Revise los datos')
    expect(alerta).toHaveTextContent('La persona que retira es obligatoria.')
  })

  it('muestra el préstamo activo con su detalle', () => {
    render(
      <PanelPrestamo
        {...propiedades({
          error: {
            codigo: CODIGO_PRESTAMO_DUPLICADO,
            status: 409,
            mensaje: 'El expediente 9275-81 ya tiene un préstamo pendiente.',
            registro: {
              personaRetira: 'Luis Pérez',
              fechaSalida: '2026-11-02T15:00:00.000Z',
            },
          },
        })}
      />,
    )

    const alerta = screen.getByRole('alert')
    expect(alerta).toHaveTextContent('Préstamo activo')
    expect(alerta).toHaveTextContent('Prestado a Luis Pérez el 02/11/2026 09:00.')
    expect(alerta).toHaveTextContent(
      'No puede registrarse de nuevo mientras el préstamo siga pendiente.',
    )
  })

  it('muestra un error inesperado sin detalles técnicos', () => {
    render(
      <PanelPrestamo
        {...propiedades({
          error: { codigo: null, status: 500, mensaje: 'No se pudo registrar el préstamo.' },
        })}
      />,
    )

    const alerta = screen.getByRole('alert')
    expect(alerta).toHaveTextContent('No se pudo registrar')
    expect(alerta).toHaveTextContent('No se pudo registrar el préstamo.')
  })

  it('muestra el éxito del registro', () => {
    render(
      <PanelPrestamo
        {...propiedades({
          exito: 'Préstamo registrado para el expediente 927581.',
        })}
      />,
    )

    const alerta = screen.getByRole('alert')
    expect(alerta).toHaveTextContent('Préstamo guardado')
    expect(alerta).toHaveTextContent('Préstamo registrado para el expediente 927581.')
    expect(alerta).toHaveTextContent('Puede capturar el siguiente expediente.')
  })

  it('reenfoca el expediente después de un registro exitoso', () => {
    const { rerender } = render(
      <PanelPrestamo {...propiedades({ numeroExpediente: '927581', guardando: true })} />,
    )

    rerender(<PanelPrestamo {...propiedades({ numeroExpediente: '', guardando: false })} />)

    expect(screen.getByLabelText('Número de expediente')).toHaveFocus()
  })

  it('no reenfoca cuando el registro falló', () => {
    const { rerender } = render(
      <PanelPrestamo {...propiedades({ numeroExpediente: '927581', guardando: true })} />,
    )

    rerender(
      <PanelPrestamo
        {...propiedades({
          numeroExpediente: '927581',
          guardando: false,
          error: {
            codigo: CODIGO_ENTRADA_INVALIDA,
            status: 400,
            mensaje: 'La persona que retira es obligatoria.',
            campo: 'personaRetira',
          },
        })}
      />,
    )

    expect(screen.getByLabelText('Número de expediente')).not.toHaveFocus()
  })
})

it('filtra números en la persona y avisa', () => {
  const props = propiedades({ personaRetira: '' })
  render(<PanelPrestamo {...props} />)

  fireEvent.change(screen.getByLabelText('Persona que retira'), {
    target: { value: 'Ana 123' },
  })

  expect(props.onPersonaRetira).toHaveBeenCalledWith('Ana ')
  expect(
    screen.getByText('Solo se permiten letras, espacios y signos de nombre.'),
  ).toBeInTheDocument()
})

it('rechaza guiones en la captura normal', () => {
  const props = propiedades({ numeroExpediente: '' })
  render(<PanelPrestamo {...props} />)

  fireEvent.change(screen.getByLabelText('Número de expediente'), {
    target: { value: '9275-81' },
  })

  expect(props.onNumeroExpediente).not.toHaveBeenCalled()
  expect(screen.getByText(/Solo se admiten dígitos/)).toBeInTheDocument()
})

it('alterna al ingreso manual y limpia el número', async () => {
  const props = propiedades({ numeroExpediente: '927581' })
  const usuario = userEvent.setup()
  render(<PanelPrestamo {...props} />)

  await usuario.click(screen.getByRole('button', { name: 'Ingreso manual' }))

  expect(props.onNumeroExpediente).toHaveBeenCalledWith('', null)
  expect(screen.getByPlaceholderText('Ejemplo: 91-1330')).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Captura normal' })).toBeInTheDocument()
})

it('envía la presentación del ingreso manual', async () => {
  const props = propiedades({ numeroExpediente: '' })
  const usuario = userEvent.setup()
  render(<PanelPrestamo {...props} />)

  await usuario.click(screen.getByRole('button', { name: 'Ingreso manual' }))
  props.onNumeroExpediente.mockClear()

  fireEvent.change(screen.getByLabelText('Número de expediente'), {
    target: { value: '91-1330' },
  })

  expect(props.onNumeroExpediente).toHaveBeenLastCalledWith('91-1330', '91-1330')
})

it('rechaza más de un guion en el ingreso manual', async () => {
  const props = propiedades({ numeroExpediente: '' })
  const usuario = userEvent.setup()
  render(<PanelPrestamo {...props} />)

  await usuario.click(screen.getByRole('button', { name: 'Ingreso manual' }))
  props.onNumeroExpediente.mockClear()

  fireEvent.change(screen.getByLabelText('Número de expediente'), {
    target: { value: '91-13-30' },
  })

  expect(props.onNumeroExpediente).not.toHaveBeenCalled()
  expect(screen.getByText(/un único guion entre grupos/)).toBeInTheDocument()
})
