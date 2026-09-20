import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TablaCatalogo from './TablaCatalogo.jsx'

const COLUMNAS = [
  { key: 'nombre', label: 'Nombre' },
  { key: 'activo', label: 'Estado' },
]

const DATOS = [
  { id: 1, nombre: 'Medicina Interna', activo: true },
  { id: 2, nombre: 'Cardiología', activo: false },
]

describe('TablaCatalogo', () => {
  it('muestra un indicador de carga', () => {
    render(<TablaCatalogo columnas={COLUMNAS} datos={[]} cargando />)

    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('muestra el error y permite reintentar', async () => {
    const onReintentar = vi.fn()
    render(
      <TablaCatalogo
        columnas={COLUMNAS}
        datos={[]}
        error="Fallo de red"
        onReintentar={onReintentar}
      />,
    )

    expect(screen.getByText('Fallo de red')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(onReintentar).toHaveBeenCalledTimes(1)
  })

  it('muestra estado vacío cuando no hay datos', () => {
    render(
      <TablaCatalogo
        columnas={COLUMNAS}
        datos={[]}
        vacioTitulo="Sin registros"
        vacioDescripcion="Nada por aquí"
      />,
    )

    expect(screen.getByText('Sin registros')).toBeInTheDocument()
    expect(screen.getByText('Nada por aquí')).toBeInTheDocument()
  })

  it('representa los datos en tabla (escritorio) y tarjetas (móvil)', () => {
    render(<TablaCatalogo columnas={COLUMNAS} datos={DATOS} />)

    const escritorio = screen.getByTestId('catalogo-escritorio')
    const movil = screen.getByTestId('catalogo-movil')

    expect(within(escritorio).getByText('Medicina Interna')).toBeInTheDocument()
    expect(within(movil).getByText('Cardiología')).toBeInTheDocument()
    expect(within(escritorio).getByText('Activo')).toBeInTheDocument()
    expect(within(escritorio).getByText('Inactivo')).toBeInTheDocument()
  })

  it('dispara las acciones ver, editar y desactivar del registro activo', async () => {
    const onVer = vi.fn()
    const onEditar = vi.fn()
    const onDesactivar = vi.fn()
    render(
      <TablaCatalogo
        columnas={COLUMNAS}
        datos={DATOS}
        onVer={onVer}
        onEditar={onEditar}
        onDesactivar={onDesactivar}
      />,
    )

    const escritorio = screen.getByTestId('catalogo-escritorio')

    await userEvent.click(within(escritorio).getAllByRole('button', { name: 'Ver' })[0])
    await userEvent.click(within(escritorio).getAllByRole('button', { name: 'Editar' })[0])
    await userEvent.click(within(escritorio).getAllByRole('button', { name: 'Desactivar' })[0])

    expect(onVer).toHaveBeenCalledWith(DATOS[0])
    expect(onEditar).toHaveBeenCalledWith(DATOS[0])
    expect(onDesactivar).toHaveBeenCalledWith(DATOS[0])
  })

  it('no ofrece desactivar para registros inactivos', () => {
    render(<TablaCatalogo columnas={COLUMNAS} datos={[DATOS[1]]} onDesactivar={vi.fn()} />)

    const escritorio = screen.getByTestId('catalogo-escritorio')
    expect(within(escritorio).queryByRole('button', { name: 'Desactivar' })).not.toBeInTheDocument()
  })

  it('muestra Editar por defecto (comportamiento Fase 2)', () => {
    render(<TablaCatalogo columnas={COLUMNAS} datos={DATOS} onEditar={vi.fn()} />)

    const escritorio = screen.getByTestId('catalogo-escritorio')
    expect(within(escritorio).getAllByRole('button', { name: 'Editar' }).length).toBeGreaterThan(0)
  })

  it('oculta Editar cuando permitirEditar es false', () => {
    render(
      <TablaCatalogo
        columnas={COLUMNAS}
        datos={DATOS}
        onVer={vi.fn()}
        onEditar={vi.fn()}
        permitirEditar={false}
      />,
    )

    const escritorio = screen.getByTestId('catalogo-escritorio')
    expect(within(escritorio).queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument()
    expect(within(escritorio).getAllByRole('button', { name: 'Ver' }).length).toBeGreaterThan(0)
  })
})
