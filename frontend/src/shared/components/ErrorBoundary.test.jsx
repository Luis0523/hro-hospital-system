import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ErrorBoundary from './ErrorBoundary.jsx'

function ComponenteQueFalla() {
  throw new Error('fallo de prueba')
}

describe('ErrorBoundary', () => {
  it('muestra el estado de fallback cuando un hijo lanza un error', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <ErrorBoundary>
        <ComponenteQueFalla />
      </ErrorBoundary>,
    )

    expect(screen.getByText('Ocurrió un error inesperado')).toBeInTheDocument()
    expect(screen.getByText('fallo de prueba')).toBeInTheDocument()

    console.error.mockRestore()
  })
})
