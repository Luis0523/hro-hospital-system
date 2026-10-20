import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
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
  'Sobres emergencia',
  'Sobres sellados',
  'TIA',
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
    fireEvent.change(screen.getByLabelText('TIA'), { target: { value: 'abc' } })
    expect(screen.getByText('La cantidad debe ser un número entero.')).toBeInTheDocument()
  })

  it('acepta valores enteros válidos sin mostrar error', () => {
    renderPagina()
    fireEvent.change(screen.getByLabelText('Egresos hospitalarios'), { target: { value: '3' } })
    expect(screen.queryByText('La cantidad debe ser un número entero.')).not.toBeInTheDocument()
    expect(screen.queryByText('La cantidad no puede ser negativa.')).not.toBeInTheDocument()
  })

  it('ofrece un enlace de descarga que apunta a la plantilla PDF real', () => {
    renderPagina()
    const enlace = screen.getByRole('link', { name: /descargar plantilla pdf/i })

    expect(enlace).toHaveAttribute('href', '/plantillas/cuaderno-rojo.pdf')
    expect(enlace).toHaveAttribute('download', 'cuaderno-rojo.pdf')
  })

  it('incluye la plantilla PDF en los recursos públicos que se publican', () => {
    const ruta = resolve(process.cwd(), 'public/plantillas/cuaderno-rojo.pdf')

    expect(existsSync(ruta)).toBe(true)
    expect(readFileSync(ruta, 'latin1').slice(0, 5)).toBe('%PDF-')
  })
})
