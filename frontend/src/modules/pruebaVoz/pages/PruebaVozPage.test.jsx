import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PruebaVozPage from './PruebaVozPage.jsx'

function eventoResultado(texto, { final = true, confianza = 0.9 } = {}) {
  const alternativa = { transcript: texto, confidence: confianza }
  const resultado = Object.assign([alternativa], { isFinal: final })
  return { resultIndex: 0, results: [resultado] }
}

class ReconocimientoFalso {
  constructor() {
    ReconocimientoFalso.ultima = this
  }

  start() {
    this.onstart?.()
  }

  stop() {
    this.onend?.()
  }

  abort() {}
}

describe('PruebaVozPage', () => {
  beforeEach(() => {
    window.SpeechRecognition = ReconocimientoFalso
  })

  afterEach(() => {
    delete window.SpeechRecognition
    delete window.webkitSpeechRecognition
    ReconocimientoFalso.ultima = null
  })

  it('muestra el input y el botón de grabar', () => {
    render(<PruebaVozPage />)

    expect(screen.getByLabelText(/número de expediente/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /grabar/i })).toBeEnabled()
  })

  it('transcribe, normaliza y vuelve a grabar cuando deja de haber voz', async () => {
    const usuario = userEvent.setup()
    render(<PruebaVozPage />)

    await usuario.click(screen.getByRole('button', { name: /grabar/i }))
    expect(screen.getByRole('button', { name: /detener/i })).toBeInTheDocument()

    const reconocimiento = ReconocimientoFalso.ultima
    act(() => {
      reconocimiento.onresult(eventoResultado('noventa doce cero uno'))
    })

    expect(screen.getByLabelText(/número de expediente/i)).toHaveValue('901201')
    expect(screen.getByText('901201', { selector: 'p' })).toBeInTheDocument()

    act(() => reconocimiento.onend())
    expect(screen.getByRole('button', { name: /grabar/i })).toBeInTheDocument()
  })

  it('muestra el error de permiso denegado', async () => {
    const usuario = userEvent.setup()
    render(<PruebaVozPage />)

    await usuario.click(screen.getByRole('button', { name: /grabar/i }))
    const reconocimiento = ReconocimientoFalso.ultima
    act(() => {
      reconocimiento.onerror({ error: 'not-allowed' })
      reconocimiento.onend()
    })

    expect(screen.getByText(/permiso de micrófono denegado/i)).toBeInTheDocument()
  })

  it('explica las causas del error de red', async () => {
    const usuario = userEvent.setup()
    render(<PruebaVozPage />)

    await usuario.click(screen.getByRole('button', { name: /grabar/i }))
    const reconocimiento = ReconocimientoFalso.ultima
    act(() => {
      reconocimiento.onerror({ error: 'network' })
      reconocimiento.onend()
    })

    expect(screen.getByText(/no se pudo conectar con el servicio/i)).toBeInTheDocument()
    expect(screen.getByText(/posibles causas/i)).toBeInTheDocument()
    expect(screen.getByText(/servicio externo de google/i)).toBeInTheDocument()
  })

  it('avisa cuando el navegador no soporta la API', () => {
    delete window.SpeechRecognition
    render(<PruebaVozPage />)

    expect(screen.getByText(/no soporta la web speech api/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /grabar/i })).toBeDisabled()
  })
})
