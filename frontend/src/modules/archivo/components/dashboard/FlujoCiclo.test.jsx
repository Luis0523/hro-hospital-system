import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ORDEN_ESTADOS } from '../../estadosExpediente'
import FlujoCiclo from './FlujoCiclo.jsx'

const POR_ESTADO = ORDEN_ESTADOS.map((estado, indice) => ({ estado, total: indice + 1 }))

describe('FlujoCiclo', () => {
  it('muestra los 7 pasos en el orden de ORDEN_ESTADOS', () => {
    render(<FlujoCiclo porEstado={POR_ESTADO} />)

    expect(screen.getAllByRole('listitem')).toHaveLength(ORDEN_ESTADOS.length)
    expect(screen.getByText('Pendiente de localizar')).toBeInTheDocument()
    expect(screen.getByText('Archivado')).toBeInTheDocument()
  })

  it('no incluye la excepción no_localizado en la secuencia', () => {
    render(<FlujoCiclo porEstado={[...POR_ESTADO, { estado: 'no_localizado', total: 9 }]} />)

    expect(screen.queryByText('No localizado')).not.toBeInTheDocument()
  })

  it('muestra el total de cada paso', () => {
    render(<FlujoCiclo porEstado={POR_ESTADO} />)

    // El primer paso (pendiente_localizar) recibe total 1.
    const primerPaso = screen.getAllByRole('listitem')[0]
    expect(primerPaso).toHaveTextContent('1')
  })
})
