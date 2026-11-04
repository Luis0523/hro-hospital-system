import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '@/shared/context/AuthContext.jsx'
import { ThemeProvider } from '@/shared/context/ThemeContext.jsx'
import { ToastProvider } from '@/shared/context/ToastContext.jsx'
import { formatearFechaLarga, hoyIsoGuatemala } from '@/shared/utils/fecha'
import { guardarCuadernoRojoMock, reiniciarCuadernoRojoMock } from '../api/cuadernoRojoMock'
import CuadernoRojoPage from './CuadernoRojoPage.jsx'

beforeAll(() => {
  if (typeof globalThis.ResizeObserver === 'undefined') {
    globalThis.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  }
})

const HOY = hoyIsoGuatemala()
const ANIO = HOY.slice(0, 4)
const FECHA_HOY_LARGA = formatearFechaLarga(HOY)
const FECHA_A = `${ANIO}-10-15`
const FECHA_B = `${ANIO}-10-16`
const CORTA_A = `15/10/${ANIO}`

const ETIQUETAS_CAMPOS = [
  'Fecha del registro',
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
  if (fecha) {
    fireEvent.change(screen.getByLabelText(/^Fecha del registro/), {
      target: { value: fecha },
    })
  }
  fireEvent.change(screen.getByLabelText('Egresos hospitalarios'), {
    target: { value: egresos },
  })
  fireEvent.change(screen.getByLabelText('Sobres emergencia'), {
    target: { value: emergencia },
  })
  fireEvent.change(screen.getByLabelText('Sobres sellados'), { target: { value: sellados } })
  fireEvent.change(screen.getByLabelText('TIA'), { target: { value: tia } })
}

function botonesEditar(fechaCorta) {
  return screen.getAllByRole('button', { name: `Editar registro del ${fechaCorta}` })
}

beforeEach(() => {
  localStorage.clear()
  reiniciarCuadernoRojoMock()
})

afterEach(() => {
  document.documentElement.classList.remove('dark')
})

describe('CuadernoRojoPage', () => {
  it('muestra el encabezado institucional, la fecha de Guatemala y la plantilla PDF', () => {
    renderPagina()

    expect(screen.getByRole('heading', { name: 'Cuaderno Rojo' })).toBeInTheDocument()
    expect(screen.getByText('Registro diario de Archivo')).toBeInTheDocument()
    expect(screen.getByText(/Hoy en Guatemala/)).toHaveTextContent(FECHA_HOY_LARGA)
    expect(screen.getByRole('link', { name: /plantilla pdf/i })).toHaveAttribute(
      'href',
      '/plantillas/cuaderno-rojo.pdf',
    )
  })

  it('muestra los cinco campos con sus etiquetas y la fecha de hoy en Guatemala', () => {
    renderPagina()
    for (const etiqueta of ETIQUETAS_CAMPOS) {
      expect(screen.getByLabelText(new RegExp(`^${etiqueta}`))).toBeInTheDocument()
    }
    expect(screen.getByLabelText(/^Fecha del registro/)).toHaveValue(HOY)
  })

  it('mantiene el orden de los campos del formulario', () => {
    const { container } = renderPagina()
    const nombres = [...container.querySelectorAll('input[name]')].map((input) =>
      input.getAttribute('name'),
    )
    expect(nombres).toEqual(['fecha', 'egresosHospitalarios', 'sobres', 'sobresSellados', 'tia'])
  })

  it('crea un registro sin modal y actualiza el estado y el historial', async () => {
    renderPagina()
    expect(await screen.findByText(/Sin registros/)).toBeInTheDocument()
    await esperarFormularioListo()

    llenarFormulario({ egresos: '3', emergencia: '4', sellados: '5', tia: '6' })
    fireEvent.click(screen.getByRole('button', { name: /guardar registro/i }))

    expect(await screen.findByText('Registro creado')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(await screen.findByText('1 día registrado.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /actualizar registro/i })).toBeInTheDocument()
    expect(screen.getByText('Editando')).toBeInTheDocument()
  })

  it('muestra el estado Editando y confirma la actualización en el modal', async () => {
    guardarCuadernoRojoMock(HOY, {
      egresosHospitalarios: 1,
      sobresEmergencia: 2,
      sobresSellados: 3,
      tia: 4,
    })

    renderPagina()
    expect(await screen.findByText('Se actualizará el registro existente.')).toBeInTheDocument()
    expect(screen.getByText('Editando')).toBeInTheDocument()
    await esperarFormularioListo()
    expect(screen.getByLabelText('Egresos hospitalarios')).toHaveValue('1')

    llenarFormulario({ egresos: '10', emergencia: '20', sellados: '30', tia: '40' })
    fireEvent.click(screen.getByRole('button', { name: /actualizar registro/i }))

    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Actualizar registro' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))

    expect(await screen.findByText('Registro actualizado')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByText('1 día registrado.')).toBeInTheDocument())
    expect(screen.getAllByText('10').length).toBeGreaterThan(0)
  })

  it('cancela la actualización sin guardar y conserva lo escrito', async () => {
    guardarCuadernoRojoMock(HOY, {
      egresosHospitalarios: 1,
      sobresEmergencia: 2,
      sobresSellados: 3,
      tia: 4,
    })

    renderPagina()
    await screen.findByText('Se actualizará el registro existente.')
    await esperarFormularioListo()

    llenarFormulario({ egresos: '99', emergencia: '20', sellados: '30', tia: '40' })
    fireEvent.click(screen.getByRole('button', { name: /actualizar registro/i }))

    const dialogo = await screen.findByRole('dialog')
    fireEvent.click(within(dialogo).getByRole('button', { name: 'Cancelar' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(screen.getByLabelText('Egresos hospitalarios')).toHaveValue('99')
    expect(screen.queryByText('Registro actualizado')).not.toBeInTheDocument()
  })

  it('cierra el modal con Escape sin guardar', async () => {
    guardarCuadernoRojoMock(HOY, {
      egresosHospitalarios: 1,
      sobresEmergencia: 2,
      sobresSellados: 3,
      tia: 4,
    })

    renderPagina()
    await screen.findByText('Se actualizará el registro existente.')
    await esperarFormularioListo()

    fireEvent.click(screen.getByRole('button', { name: /actualizar registro/i }))
    await screen.findByRole('dialog')

    fireEvent.keyDown(document, { key: 'Escape', keyCode: 27 })

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(screen.queryByText('Registro actualizado')).not.toBeInTheDocument()
  })

  it('carga un registro del historial sin cambiar la fecha operativa del encabezado', async () => {
    guardarCuadernoRojoMock(FECHA_A, {
      egresosHospitalarios: 11,
      sobresEmergencia: 12,
      sobresSellados: 13,
      tia: 14,
    })
    guardarCuadernoRojoMock(FECHA_B, {
      egresosHospitalarios: 21,
      sobresEmergencia: 22,
      sobresSellados: 23,
      tia: 24,
    })

    renderPagina()
    await screen.findByText('2 días registrados.')

    fireEvent.click(botonesEditar(CORTA_A)[0])

    expect(screen.getByLabelText(/^Fecha del registro/)).toHaveValue(FECHA_A)
    expect(screen.getByLabelText('Egresos hospitalarios')).toHaveValue('11')
    expect(screen.getByLabelText('Sobres emergencia')).toHaveValue('12')
    expect(screen.getByLabelText('TIA')).toHaveValue('14')
    expect(screen.getAllByText('En edición').length).toBeGreaterThan(0)
    expect(screen.getByText(/Hoy en Guatemala/)).toHaveTextContent(FECHA_HOY_LARGA)
  })

  it('protege los cambios locales antes de editar otro registro', async () => {
    guardarCuadernoRojoMock(FECHA_A, {
      egresosHospitalarios: 11,
      sobresEmergencia: 12,
      sobresSellados: 13,
      tia: 14,
    })

    renderPagina()
    await screen.findByText('1 día registrado.')
    await esperarFormularioListo()

    fireEvent.change(screen.getByLabelText('Egresos hospitalarios'), { target: { value: '77' } })
    fireEvent.click(botonesEditar(CORTA_A)[0])

    expect(await screen.findByText('Cambios sin guardar')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Seguir editando' }))

    await waitFor(() => expect(screen.queryByText('Cambios sin guardar')).not.toBeInTheDocument())
    expect(screen.getByLabelText('Egresos hospitalarios')).toHaveValue('77')

    fireEvent.click(botonesEditar(CORTA_A)[0])
    fireEvent.click(await screen.findByRole('button', { name: 'Descartar cambios' }))

    expect(screen.getByLabelText(/^Fecha del registro/)).toHaveValue(FECHA_A)
    expect(screen.getByLabelText('Egresos hospitalarios')).toHaveValue('11')
  })

  it('protege los cambios al cambiar manualmente la fecha', async () => {
    renderPagina()
    await esperarFormularioListo()

    fireEvent.change(screen.getByLabelText('Egresos hospitalarios'), {
      target: { value: '77' },
    })
    fireEvent.change(screen.getByLabelText(/^Fecha del registro/), {
      target: { value: FECHA_A },
    })

    expect(await screen.findByText('Cambios sin guardar')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Seguir editando' }))

    await waitFor(() => expect(screen.queryByText('Cambios sin guardar')).not.toBeInTheDocument())
    expect(screen.getByLabelText(/^Fecha del registro/)).toHaveValue(HOY)
    expect(screen.getByLabelText('Egresos hospitalarios')).toHaveValue('77')

    fireEvent.change(screen.getByLabelText(/^Fecha del registro/), {
      target: { value: FECHA_A },
    })
    fireEvent.click(await screen.findByRole('button', { name: 'Descartar cambios' }))

    await waitFor(() => expect(screen.getByLabelText(/^Fecha del registro/)).toHaveValue(FECHA_A))
    await esperarFormularioListo()
    expect(screen.getByLabelText('Egresos hospitalarios')).toHaveValue('')
  })

  it('valida cantidades negativas y no guarda', async () => {
    renderPagina()
    await esperarFormularioListo()
    llenarFormulario({ egresos: '-1', emergencia: '0', sellados: '0', tia: '0' })
    fireEvent.click(screen.getByRole('button', { name: /guardar registro/i }))

    expect(await screen.findByText('La cantidad no puede ser negativa.')).toBeInTheDocument()
    expect(screen.queryByText('Registro creado')).not.toBeInTheDocument()
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

  it('mantiene la funcionalidad con el tema oscuro', async () => {
    localStorage.setItem('hro_tema', 'oscuro')
    renderPagina()

    await waitFor(() => expect(document.documentElement).toHaveClass('dark'))
    expect(screen.getByRole('heading', { name: 'Cuaderno Rojo' })).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: /guardar registro/i })).toBeInTheDocument()
  })

  it('filtra por año y mes sin alterar la fecha del formulario', async () => {
    renderPagina()
    await esperarFormularioListo()

    const botonAnio = () => screen.getByRole('button', { name: 'Año' })
    const botonMes = () => screen.getByRole('button', { name: 'Mes' })

    expect(botonAnio()).toHaveTextContent(ANIO)
    expect(botonMes()).toHaveTextContent('Todos')

    fireEvent.click(botonAnio())
    fireEvent.click(await screen.findByRole('option', { name: '2000' }))
    await waitFor(() => expect(botonAnio()).toHaveTextContent('2000'))

    fireEvent.click(botonMes())
    fireEvent.click(await screen.findByRole('option', { name: 'Enero' }))
    await waitFor(() => expect(botonMes()).toHaveTextContent('Enero'))

    expect(screen.getByLabelText(/^Fecha del registro/)).toHaveValue(HOY)

    fireEvent.click(screen.getByRole('button', { name: 'Restablecer' }))
    await waitFor(() => expect(botonAnio()).toHaveTextContent(ANIO))
    expect(botonMes()).toHaveTextContent('Todos')
  })

  it('advierte cuando el registro guardado queda fuera del período filtrado', async () => {
    const anioAnterior = String(Number(ANIO) - 1)
    const fechaAnterior = `${anioAnterior}-05-10`

    renderPagina()
    await esperarFormularioListo()

    fireEvent.change(screen.getByLabelText(/^Fecha del registro/), {
      target: { value: fechaAnterior },
    })
    await waitFor(() =>
      expect(screen.getByLabelText(/^Fecha del registro/)).toHaveValue(fechaAnterior),
    )
    await esperarFormularioListo()

    llenarFormulario({ egresos: '1', emergencia: '2', sellados: '3', tia: '4' })
    fireEvent.click(screen.getByRole('button', { name: /guardar registro/i }))

    expect(await screen.findByText('Registro creado')).toBeInTheDocument()
    expect(await screen.findByText(/No aparece en el período filtrado/)).toBeInTheDocument()
    expect(
      await screen.findByText(
        'El registro que está editando no pertenece al período seleccionado.',
      ),
    ).toBeInTheDocument()
  })

  it('ofrece un enlace de descarga que apunta a la plantilla PDF real', () => {
    renderPagina()
    const enlace = screen.getByRole('link', { name: /plantilla pdf/i })

    expect(enlace).toHaveAttribute('href', '/plantillas/cuaderno-rojo.pdf')
    expect(enlace).toHaveAttribute('download', 'cuaderno-rojo.pdf')
  })

  it('incluye la plantilla PDF en los recursos públicos que se publican', () => {
    const ruta = resolve(process.cwd(), 'public/plantillas/cuaderno-rojo.pdf')

    expect(existsSync(ruta)).toBe(true)
    expect(readFileSync(ruta, 'latin1').slice(0, 5)).toBe('%PDF-')
  })
})
