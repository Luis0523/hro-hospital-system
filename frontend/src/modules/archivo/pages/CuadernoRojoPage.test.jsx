import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '@/shared/context/AuthContext.jsx'
import { ThemeProvider } from '@/shared/context/ThemeContext.jsx'
import { ToastProvider } from '@/shared/context/ToastContext.jsx'
import { hoyIso } from '@/shared/utils/fecha'
import { guardarCuadernoRojoMock, reiniciarCuadernoRojoMock } from '../api/cuadernoRojoMock'
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

async function esperarFormularioListo() {
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: /guardar registro|actualizar registro/i }),
    ).not.toBeDisabled(),
  )
}

function llenarFormulario({ fecha, egresos, emergencia, sellados, tia }) {
  if (fecha) fireEvent.change(screen.getByLabelText('Fecha'), { target: { value: fecha } })
  fireEvent.change(screen.getByLabelText('Egresos hospitalarios'), {
    target: { value: egresos },
  })
  fireEvent.change(screen.getByLabelText('Sobres emergencia'), {
    target: { value: emergencia },
  })
  fireEvent.change(screen.getByLabelText('Sobres sellados'), { target: { value: sellados } })
  fireEvent.change(screen.getByLabelText('TIA'), { target: { value: tia } })
}

beforeEach(() => {
  localStorage.clear()
  reiniciarCuadernoRojoMock()
})

describe('CuadernoRojoPage', () => {
  it('renderiza el título de la vista', () => {
    renderPagina()
    expect(screen.getByRole('heading', { name: 'Registro del Cuaderno Rojo' })).toBeInTheDocument()
  })

  it('muestra los cinco campos con sus etiquetas y la fecha de hoy por defecto', () => {
    renderPagina()
    for (const etiqueta of ETIQUETAS_CAMPOS) {
      expect(screen.getByLabelText(new RegExp(`^${etiqueta}`))).toBeInTheDocument()
    }
    expect(screen.getByLabelText(/^Fecha/)).toHaveValue(hoyIso())
  })

  it('mantiene el orden de los campos del formulario', () => {
    const { container } = renderPagina()
    const nombres = [...container.querySelectorAll('input[name]')].map((input) =>
      input.getAttribute('name'),
    )
    expect(nombres).toEqual(['fecha', 'egresosHospitalarios', 'sobres', 'sobresSellados', 'tia'])
  })

  it('muestra el historial vacío y luego el registro guardado', async () => {
    renderPagina()
    expect(await screen.findByText('Aún no hay registros en el historial.')).toBeInTheDocument()
    await esperarFormularioListo()

    llenarFormulario({ egresos: '3', emergencia: '4', sellados: '5', tia: '6' })
    fireEvent.click(screen.getByRole('button', { name: /guardar registro/i }))

    expect(await screen.findByText('Registro guardado')).toBeInTheDocument()
    expect(await screen.findByText('1 día registrado.')).toBeInTheDocument()
    expect(screen.queryByText('Aún no hay registros en el historial.')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /actualizar registro/i })).toBeInTheDocument()
  })

  it('muestra el aviso de fecha existente y actualiza en lugar de duplicar', async () => {
    guardarCuadernoRojoMock(hoyIso(), {
      egresosHospitalarios: 1,
      sobresEmergencia: 2,
      sobresSellados: 3,
      tia: 4,
    })

    renderPagina()
    expect(await screen.findByText('Esta fecha ya tiene un registro')).toBeInTheDocument()
    await esperarFormularioListo()
    expect(screen.getByLabelText('Egresos hospitalarios')).toHaveValue('1')

    llenarFormulario({ egresos: '10', emergencia: '20', sellados: '30', tia: '40' })
    fireEvent.click(screen.getByRole('button', { name: /actualizar registro/i }))

    expect(await screen.findByText('Registro guardado')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText('1 día registrado.')).toBeInTheDocument())
    expect(screen.getAllByText('10').length).toBeGreaterThan(0)
    expect(screen.queryByText('Aún no hay registros en el historial.')).not.toBeInTheDocument()
  })

  it('valida cantidades negativas y no guarda', async () => {
    renderPagina()
    await esperarFormularioListo()
    llenarFormulario({ egresos: '-1', emergencia: '0', sellados: '0', tia: '0' })
    fireEvent.click(screen.getByRole('button', { name: /guardar registro/i }))

    expect(await screen.findByText('La cantidad no puede ser negativa.')).toBeInTheDocument()
    expect(screen.queryByText('Registro guardado')).not.toBeInTheDocument()
  })

  it('valida cantidades decimales y no numéricas', async () => {
    renderPagina()
    await esperarFormularioListo()
    llenarFormulario({ egresos: '0', emergencia: '0', sellados: '1.5', tia: 'abc' })
    fireEvent.click(screen.getByRole('button', { name: /guardar registro/i }))

    expect(await screen.findAllByText('La cantidad debe ser un número entero.')).toHaveLength(2)
  })

  it('no persiste datos en el navegador', () => {
    renderPagina()
    const clavesRelevantes = Object.keys(localStorage).filter((clave) =>
      /cuaderno|rojo|historial/i.test(clave),
    )
    expect(clavesRelevantes).toEqual([])
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
