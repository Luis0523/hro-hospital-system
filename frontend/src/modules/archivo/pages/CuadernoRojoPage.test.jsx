import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '@/shared/context/AuthContext.jsx'
import { ThemeProvider } from '@/shared/context/ThemeContext.jsx'
import { ToastProvider } from '@/shared/context/ToastContext.jsx'
import CuadernoRojoPage from './CuadernoRojoPage.jsx'

const ETIQUETAS_CAMPOS = [
  'Fecha',
  'Egresos hospitalarios',
  'Sobres (nombre pendiente)',
  'Sobres sellados',
  'T.I.A.',
]

function renderPagina() {
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <CuadernoRojoPage />
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </MemoryRouter>,
  )
}

describe('CuadernoRojoPage', () => {
  it('renderiza el título de la vista', () => {
    renderPagina()
    expect(screen.getByRole('heading', { name: 'Registro del Cuaderno Rojo' })).toBeInTheDocument()
  })

  it('muestra los cinco campos con sus etiquetas', () => {
    renderPagina()
    for (const etiqueta of ETIQUETAS_CAMPOS) {
      expect(screen.getByLabelText(etiqueta)).toBeInTheDocument()
    }
  })

  it('mantiene el orden de los campos del formulario', () => {
    const { container } = renderPagina()
    const nombres = [...container.querySelectorAll('input[name]')].map((input) =>
      input.getAttribute('name'),
    )
    expect(nombres).toEqual(['fecha', 'egresosHospitalarios', 'sobres', 'sobresSellados', 'tia'])
  })

  it('muestra el historial vacío con sus cinco columnas en orden', () => {
    renderPagina()
    expect(screen.getByRole('heading', { name: 'Historial de registros' })).toBeInTheDocument()

    const encabezados = screen.getAllByRole('columnheader').map((th) => th.textContent)
    expect(encabezados).toEqual(ETIQUETAS_CAMPOS)

    expect(screen.getByText('Aún no hay registros en el historial.')).toBeInTheDocument()
  })

  it('no genera registros ficticios ni persiste en el navegador', () => {
    renderPagina()
    // Sin filas de datos: solo el estado vacío dentro del cuerpo de la tabla.
    expect(screen.queryAllByRole('row')).toHaveLength(2)
    const clavesRelevantes = Object.keys(localStorage).filter((clave) =>
      /cuaderno|rojo|historial/i.test(clave),
    )
    expect(clavesRelevantes).toEqual([])
  })

  it('deja Guardar deshabilitado y muestra el aviso de integración pendiente', () => {
    renderPagina()
    expect(screen.getByRole('button', { name: /guardar registro/i })).toBeDisabled()
    expect(screen.getByText('Guardado pendiente de integración')).toBeInTheDocument()
  })

  it('valida cantidades negativas durante la interacción', () => {
    renderPagina()
    fireEvent.change(screen.getByLabelText('Egresos hospitalarios'), { target: { value: '-1' } })
    expect(screen.getByText('La cantidad no puede ser negativa.')).toBeInTheDocument()
  })

  it('valida cantidades decimales', () => {
    renderPagina()
    fireEvent.change(screen.getByLabelText('Sobres sellados'), { target: { value: '1.5' } })
    expect(screen.getByText('La cantidad debe ser un número entero.')).toBeInTheDocument()
  })

  it('valida entradas no numéricas', () => {
    renderPagina()
    fireEvent.change(screen.getByLabelText('T.I.A.'), { target: { value: 'abc' } })
    expect(screen.getByText('La cantidad debe ser un número entero.')).toBeInTheDocument()
  })

  it('acepta valores enteros válidos sin mostrar error', () => {
    renderPagina()
    fireEvent.change(screen.getByLabelText('Egresos hospitalarios'), { target: { value: '3' } })
    expect(screen.queryByText('La cantidad debe ser un número entero.')).not.toBeInTheDocument()
    expect(screen.queryByText('La cantidad no puede ser negativa.')).not.toBeInTheDocument()
  })
})
