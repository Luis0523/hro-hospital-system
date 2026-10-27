import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BuscadorSalidaHospital from './BuscadorSalidaHospital.jsx'

describe('BuscadorSalidaHospital', () => {
  it('deshabilita el botón mientras no hay número', () => {
    render(<BuscadorSalidaHospital value="" onChange={() => {}} onAgregar={() => true} />)

    expect(screen.getByRole('button', { name: /buscar y registrar expediente/i })).toBeDisabled()
  })

  it('registra el expediente al pulsar el botón, sin depender de Enter', async () => {
    const user = userEvent.setup()
    const onAgregar = vi.fn(() => true)
    const onChange = vi.fn()

    render(<BuscadorSalidaHospital value="1234-56" onChange={onChange} onAgregar={onAgregar} />)

    await user.click(screen.getByRole('button', { name: /buscar y registrar expediente/i }))

    expect(onAgregar).toHaveBeenCalledWith('1234-56')
    expect(onChange).toHaveBeenCalledWith('')
  })

  it('mantiene el envío con Enter', async () => {
    const user = userEvent.setup()
    const onAgregar = vi.fn(() => true)

    render(<BuscadorSalidaHospital value="9876-54" onChange={() => {}} onAgregar={onAgregar} />)

    await user.type(screen.getByLabelText(/expediente \(consulta al registro médico\)/i), '{Enter}')

    expect(onAgregar).toHaveBeenCalledWith('9876-54')
  })

  it('permite marcar la salida como Clínica de la Mujer', async () => {
    const user = userEvent.setup()
    const onCambiarClinicaMujer = vi.fn()

    render(
      <BuscadorSalidaHospital
        value=""
        onChange={() => {}}
        onAgregar={() => true}
        esClinicaMujer={false}
        onCambiarClinicaMujer={onCambiarClinicaMujer}
      />,
    )

    await user.click(screen.getByRole('checkbox', { name: /clínica de la mujer/i }))

    expect(onCambiarClinicaMujer).toHaveBeenCalledWith(true)
  })
})
