import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PanelDevolucion from './PanelDevolucion.jsx'
import {
  CODIGO_ENTRADA_INVALIDA,
  CODIGO_SIN_PRESTAMO_PENDIENTE,
  CODIGO_YA_DEVUELTO,
} from '../../api/salidasExternasApi'

function propiedades(overrides = {}) {
  return {
    numeroExpediente: '927581',
    onNumeroExpediente: vi.fn(),
    onRegistrar: vi.fn(),
    guardando: false,
    error: null,
    exito: null,
    ...overrides,
  }
}

describe('PanelDevolucion', () => {
  it('muestra el formulario con etiquetas accesibles', () => {
    render(<PanelDevolucion {...propiedades()} />)

    expect(screen.getByLabelText('Número de expediente')).toHaveValue('927581')
    expect(screen.getByRole('button', { name: 'Registrar devolución' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Ingreso manual' })).toBeEnabled()
  })

  it('registra con Enter en una sola operación', async () => {
    const props = propiedades()
    const usuario = userEvent.setup()
    render(<PanelDevolucion {...props} />)

    await usuario.type(screen.getByLabelText('Número de expediente'), '{Enter}')

    expect(props.onRegistrar).toHaveBeenCalledTimes(1)
  })

  it('registra con el botón', async () => {
    const props = propiedades()
    const usuario = userEvent.setup()
    render(<PanelDevolucion {...props} />)

    await usuario.click(screen.getByRole('button', { name: 'Registrar devolución' }))

    expect(props.onRegistrar).toHaveBeenCalledTimes(1)
  })

  it('deshabilita la acción mientras guarda', async () => {
    const props = propiedades({ guardando: true })
    const usuario = userEvent.setup()
    render(<PanelDevolucion {...props} />)

    const boton = screen.getByRole('button', { name: 'Registrando…' })
    expect(boton).toBeDisabled()

    await usuario.click(boton)
    expect(props.onRegistrar).not.toHaveBeenCalled()
  })

  it('avisa cuando no existe préstamo pendiente', () => {
    render(
      <PanelDevolucion
        {...propiedades({
          error: {
            codigo: CODIGO_SIN_PRESTAMO_PENDIENTE,
            status: 404,
            mensaje: 'No hay un préstamo pendiente para el expediente 9275-81.',
          },
        })}
      />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent(
      'No existe un préstamo pendiente para este expediente.',
    )
  })

  it('avisa cuando el expediente ya fue devuelto', () => {
    render(
      <PanelDevolucion
        {...propiedades({
          error: {
            codigo: CODIGO_YA_DEVUELTO,
            status: 409,
            mensaje: 'El expediente 9275-81 ya fue devuelto.',
          },
        })}
      />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('Devolución ya registrada')
  })

  it('avisa cuando el número no es válido', () => {
    render(
      <PanelDevolucion
        {...propiedades({
          error: {
            codigo: CODIGO_ENTRADA_INVALIDA,
            status: 400,
            mensaje: 'El número de expediente contiene caracteres no permitidos.',
          },
        })}
      />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('Revise el expediente')
  })

  it('muestra un error inesperado', () => {
    render(
      <PanelDevolucion
        {...propiedades({
          error: { codigo: null, status: 500, mensaje: 'No se pudo registrar la devolución.' },
        })}
      />,
    )

    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo registrar la devolución')
  })

  it('muestra el éxito', () => {
    render(
      <PanelDevolucion
        {...propiedades({ exito: 'Devolución registrada para el expediente 9275-81.' })}
      />,
    )

    const alerta = screen.getByRole('alert')
    expect(alerta).toHaveTextContent('Devolución guardada')
    expect(alerta).toHaveTextContent('Puede capturar el siguiente expediente.')
  })

  it('reenfoca el campo después de una devolución exitosa', () => {
    const { rerender } = render(
      <PanelDevolucion {...propiedades({ numeroExpediente: '927581', guardando: true })} />,
    )

    rerender(<PanelDevolucion {...propiedades({ numeroExpediente: '', guardando: false })} />)

    expect(screen.getByLabelText('Número de expediente')).toHaveFocus()
  })

  it('no reenfoca cuando la devolución falló', () => {
    const { rerender } = render(
      <PanelDevolucion {...propiedades({ numeroExpediente: '927581', guardando: true })} />,
    )

    rerender(
      <PanelDevolucion
        {...propiedades({
          numeroExpediente: '927581',
          guardando: false,
          error: {
            codigo: CODIGO_SIN_PRESTAMO_PENDIENTE,
            status: 404,
            mensaje: 'Sin pendiente.',
          },
        })}
      />,
    )

    expect(screen.getByLabelText('Número de expediente')).not.toHaveFocus()
  })

  it('rechaza letras en la captura normal sin alterar el valor', () => {
    const props = propiedades({ numeroExpediente: '927581' })
    render(<PanelDevolucion {...props} />)

    fireEvent.change(screen.getByLabelText('Número de expediente'), {
      target: { value: '9275-81' },
    })

    expect(props.onNumeroExpediente).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent('Solo se admiten dígitos')
  })

  it('permite el ingreso manual con un único guion', async () => {
    const props = propiedades({ numeroExpediente: '' })
    const usuario = userEvent.setup()
    render(<PanelDevolucion {...props} />)

    await usuario.click(screen.getByRole('button', { name: 'Ingreso manual' }))
    expect(props.onNumeroExpediente).toHaveBeenCalledWith('', null)

    fireEvent.change(screen.getByLabelText('Número de expediente'), {
      target: { value: '91-1330' },
    })

    expect(props.onNumeroExpediente).toHaveBeenLastCalledWith('91-1330', '91-1330')
  })

  it('rechaza dos guiones en el ingreso manual', async () => {
    const props = propiedades({ numeroExpediente: '' })
    const usuario = userEvent.setup()
    render(<PanelDevolucion {...props} />)

    await usuario.click(screen.getByRole('button', { name: 'Ingreso manual' }))
    props.onNumeroExpediente.mockClear()

    fireEvent.change(screen.getByLabelText('Número de expediente'), {
      target: { value: '91-13-30' },
    })

    expect(props.onNumeroExpediente).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent('un único guion')
  })
})
