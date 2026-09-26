import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import ControlPantallaCompleta, { soportaPantallaCompleta } from './ControlPantallaCompleta.jsx'

function crearEntorno({ soportado = true } = {}) {
  const oyentes = new Map()

  const documento = {
    fullscreenElement: null,
    addEventListener: vi.fn((evento, callback) => {
      if (!oyentes.has(evento)) oyentes.set(evento, new Set())
      oyentes.get(evento).add(callback)
    }),
    removeEventListener: vi.fn((evento, callback) => {
      oyentes.get(evento)?.delete(callback)
    }),
    exitFullscreen: vi.fn(() => {
      documento.fullscreenElement = null
      return Promise.resolve()
    }),
    documentElement: {},
  }

  if (soportado) {
    documento.documentElement.requestFullscreen = vi.fn(() => {
      documento.fullscreenElement = documento.documentElement
      return Promise.resolve()
    })
  }

  const emitir = (evento) => {
    oyentes.get(evento)?.forEach((callback) => callback())
  }

  return { entorno: { document: documento }, documento, emitir }
}

describe('ControlPantallaCompleta', () => {
  it('detecta si la Fullscreen API está disponible', () => {
    expect(soportaPantallaCompleta({ document: {} })).toBe(false)
    expect(soportaPantallaCompleta(crearEntorno().entorno)).toBe(true)
    expect(soportaPantallaCompleta(crearEntorno({ soportado: false }).entorno)).toBe(false)
  })

  it('muestra "Pantalla completa" cuando no está activa', () => {
    const { entorno } = crearEntorno()

    render(<ControlPantallaCompleta entorno={entorno} />)

    expect(screen.getByRole('button', { name: /pantalla completa/i })).toBeInTheDocument()
  })

  it('ejecuta requestFullscreen al hacer click', async () => {
    const { entorno, documento } = crearEntorno()

    render(<ControlPantallaCompleta entorno={entorno} />)
    await userEvent.click(screen.getByRole('button', { name: /pantalla completa/i }))

    expect(documento.documentElement.requestFullscreen).toHaveBeenCalledTimes(1)
  })

  it('cambia a "Salir de pantalla completa" al sincronizar fullscreenchange', async () => {
    const { entorno, emitir } = crearEntorno()

    render(<ControlPantallaCompleta entorno={entorno} />)
    await userEvent.click(screen.getByRole('button', { name: /pantalla completa/i }))

    act(() => emitir('fullscreenchange'))

    expect(screen.getByRole('button', { name: /salir de pantalla completa/i })).toBeInTheDocument()
  })

  it('ejecuta exitFullscreen y vuelve al estado inicial', async () => {
    const { entorno, documento, emitir } = crearEntorno()

    render(<ControlPantallaCompleta entorno={entorno} />)
    await userEvent.click(screen.getByRole('button', { name: /pantalla completa/i }))
    act(() => emitir('fullscreenchange'))

    await userEvent.click(screen.getByRole('button', { name: /salir de pantalla completa/i }))
    expect(documento.exitFullscreen).toHaveBeenCalledTimes(1)

    act(() => emitir('fullscreenchange'))

    expect(screen.getByRole('button', { name: /^pantalla completa$/i })).toBeInTheDocument()
  })

  it('sincroniza el estado visual con fullscreenchange', () => {
    const { entorno, documento, emitir } = crearEntorno()

    render(<ControlPantallaCompleta entorno={entorno} />)
    expect(screen.getByRole('button', { name: /^pantalla completa$/i })).toBeInTheDocument()

    documento.fullscreenElement = documento.documentElement
    act(() => emitir('fullscreenchange'))
    expect(screen.getByRole('button', { name: /salir de pantalla completa/i })).toBeInTheDocument()

    documento.fullscreenElement = null
    act(() => emitir('fullscreenchange'))
    expect(screen.getByRole('button', { name: /^pantalla completa$/i })).toBeInTheDocument()
  })

  it('no rompe cuando la Fullscreen API no está disponible', () => {
    const { entorno } = crearEntorno({ soportado: false })

    render(<ControlPantallaCompleta entorno={entorno} />)

    expect(screen.getByText('Pantalla completa no disponible')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('no rompe si requestFullscreen es rechazado', async () => {
    const { entorno, documento } = crearEntorno()
    documento.documentElement.requestFullscreen = vi.fn(() => Promise.reject(new Error('denegado')))

    render(<ControlPantallaCompleta entorno={entorno} />)
    await userEvent.click(screen.getByRole('button', { name: /^pantalla completa$/i }))

    expect(screen.getByRole('button', { name: /^pantalla completa$/i })).toBeInTheDocument()
  })

  it('elimina el listener de fullscreenchange al desmontar', () => {
    const { entorno, documento } = crearEntorno()

    const { unmount } = render(<ControlPantallaCompleta entorno={entorno} />)
    const callbackRegistrado = documento.addEventListener.mock.calls[0][1]

    unmount()

    expect(documento.removeEventListener).toHaveBeenCalledWith(
      'fullscreenchange',
      callbackRegistrado,
    )
  })
})
