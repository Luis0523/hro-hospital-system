import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '@/shared/context/AuthContext.jsx'
import { ThemeProvider } from '@/shared/context/ThemeContext.jsx'
import { ToastProvider } from '@/shared/context/ToastContext.jsx'
import { hoyIsoGuatemala } from '@/shared/utils/fecha'
import { formatearFechaTexto } from '../utils/rangoFechas'
import { descargarReporteCuaderno } from '../utils/cuadernoRojoPdf'
import {
  guardarCuadernoRojoMock,
  obtenerCuadernoRojoMock,
  reiniciarCuadernoRojoMock,
} from '../api/cuadernoRojoMock'
import CuadernoRojoPage from './CuadernoRojoPage.jsx'

vi.mock('../utils/cuadernoRojoPdf', () => ({
  descargarReporteCuaderno: vi.fn(() => true),
}))

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
const ANIO = Number(HOY.slice(0, 4))
const MES = HOY.slice(0, 7)
const FECHA_ACTUAL = `${MES}-01`
const FECHA_ANTERIOR = `${ANIO - 1}-10-15`
const CORTA_ACTUAL = formatearFechaTexto(FECHA_ACTUAL)
const CORTA_ANTERIOR = formatearFechaTexto(FECHA_ANTERIOR)

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

async function esperarInicio() {
  await screen.findByLabelText(/^Desde/)
  await waitFor(() => expect(screen.queryByText(/Consultando/)).not.toBeInTheDocument())
}

async function esperarTabla() {
  await esperarInicio()
  return screen.findByRole('table')
}

function tabla() {
  return screen.getByRole('table')
}

function abrirCrear() {
  fireEvent.click(screen.getByRole('button', { name: /registrar nuevo día/i }))
}

function llenarFormulario({ egresos, emergencia, sellados, tia }) {
  fireEvent.change(screen.getByLabelText('Egresos hospitalarios'), {
    target: { value: egresos },
  })
  fireEvent.change(screen.getByLabelText('Sobres emergencia'), {
    target: { value: emergencia },
  })
  fireEvent.change(screen.getByLabelText('Sobres sellados'), { target: { value: sellados } })
  fireEvent.change(screen.getByLabelText('TIA'), { target: { value: tia } })
}

async function guardarCreacion() {
  fireEvent.click(screen.getByRole('button', { name: /guardar registro/i }))
  expect(await screen.findByText('Registro creado')).toBeInTheDocument()
}

async function escribirRango(desde, hasta) {
  fireEvent.change(screen.getByLabelText(/^Desde/), { target: { value: desde } })
  fireEvent.change(screen.getByLabelText(/^Hasta/), { target: { value: hasta } })
  fireEvent.click(screen.getByRole('button', { name: /aplicar filtro/i }))
}

beforeEach(() => {
  localStorage.clear()
  reiniciarCuadernoRojoMock()
  descargarReporteCuaderno.mockClear()
})

afterEach(() => {
  document.documentElement.classList.remove('dark')
})

describe('CuadernoRojoPage', () => {
  it('muestra el encabezado y el botón de registro sin formulario permanente', () => {
    renderPagina()

    expect(screen.getByRole('heading', { name: 'Cuaderno Rojo' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /registrar nuevo día/i })).toBeInTheDocument()
    expect(screen.queryByLabelText('TIA')).not.toBeInTheDocument()
  })

  it('abre el modal de registro y crea un día nuevo', async () => {
    renderPagina()
    await esperarInicio()

    abrirCrear()
    expect(await screen.findByRole('heading', { name: 'Registrar nuevo día' })).toBeInTheDocument()
    expect(screen.getByLabelText(/^Fecha del registro/)).toHaveValue(formatearFechaTexto(HOY))

    llenarFormulario({ egresos: '3', emergencia: '4', sellados: '5', tia: '6' })
    await guardarCreacion()

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(
      within(tabla()).getByRole('rowheader', { name: new RegExp(formatearFechaTexto(HOY)) }),
    ).toBeInTheDocument()
    expect(screen.getByText('Días registrados')).toBeInTheDocument()
  })

  it('no sobrescribe una fecha existente al intentar crearla', async () => {
    guardarCuadernoRojoMock(HOY, {
      egresosHospitalarios: 1,
      sobresEmergencia: 2,
      sobresSellados: 3,
      tia: 4,
    })
    renderPagina()
    await esperarTabla()
    abrirCrear()
    await screen.findByRole('heading', { name: 'Registrar nuevo día' })

    llenarFormulario({ egresos: '9', emergencia: '9', sellados: '9', tia: '9' })
    fireEvent.click(screen.getByRole('button', { name: /guardar registro/i }))

    expect(await screen.findByText('Esta fecha ya tiene un registro')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /editar registro existente/i })).toBeInTheDocument()
    expect(obtenerCuadernoRojoMock(HOY)).toMatchObject({
      egresosHospitalarios: 1,
      sobresEmergencia: 2,
      sobresSellados: 3,
      tia: 4,
    })
  })

  it('edita un registro con confirmación y actualiza la tabla', async () => {
    guardarCuadernoRojoMock(FECHA_ACTUAL, {
      egresosHospitalarios: 1,
      sobresEmergencia: 2,
      sobresSellados: 3,
      tia: 4,
    })
    renderPagina()
    await esperarTabla()

    const editar = within(tabla()).getByRole('button', {
      name: `Editar registro del ${CORTA_ACTUAL}`,
    })
    fireEvent.click(editar)

    expect(await screen.findByRole('heading', { name: 'Editar registro' })).toBeInTheDocument()
    expect(screen.getByLabelText(/^Fecha del registro/)).toBeDisabled()
    expect(screen.getByLabelText('Egresos hospitalarios')).toHaveValue('1')

    fireEvent.change(screen.getByLabelText('Egresos hospitalarios'), {
      target: { value: '10' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Actualizar' }))

    expect(await screen.findByRole('heading', { name: 'Actualizar registro' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))

    expect(await screen.findByText('Registro actualizado')).toBeInTheDocument()
    await waitFor(() => expect(obtenerCuadernoRojoMock(FECHA_ACTUAL).egresosHospitalarios).toBe(10))
  })

  it('cancela la confirmación de actualización sin guardar', async () => {
    guardarCuadernoRojoMock(FECHA_ACTUAL, {
      egresosHospitalarios: 1,
      sobresEmergencia: 2,
      sobresSellados: 3,
      tia: 4,
    })
    renderPagina()
    await esperarTabla()

    fireEvent.click(
      within(tabla()).getByRole('button', {
        name: `Editar registro del ${CORTA_ACTUAL}`,
      }),
    )
    await screen.findByRole('heading', { name: 'Editar registro' })
    fireEvent.change(screen.getByLabelText('Egresos hospitalarios'), {
      target: { value: '10' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Actualizar' }))
    await screen.findByRole('heading', { name: 'Actualizar registro' })
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(await screen.findByRole('heading', { name: 'Editar registro' })).toBeInTheDocument()
    expect(screen.getByLabelText('Egresos hospitalarios')).toHaveValue('10')
    expect(obtenerCuadernoRojoMock(FECHA_ACTUAL).egresosHospitalarios).toBe(1)
  })

  it('protege los cambios sin guardar al cerrar el modal', async () => {
    renderPagina()
    await esperarInicio()
    abrirCrear()
    await screen.findByRole('heading', { name: 'Registrar nuevo día' })
    llenarFormulario({ egresos: '7', emergencia: '2', sellados: '3', tia: '4' })

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(await screen.findByText('Cambios sin guardar')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Seguir editando' }))
    expect(await screen.findByRole('heading', { name: 'Registrar nuevo día' })).toBeInTheDocument()
    expect(screen.getByLabelText('Egresos hospitalarios')).toHaveValue('7')

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    await screen.findByText('Cambios sin guardar')
    fireEvent.click(screen.getByRole('button', { name: 'Descartar cambios' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(obtenerCuadernoRojoMock(HOY)).toBeNull()
  })

  it('protege los cambios al cambiar manualmente la fecha', async () => {
    renderPagina()
    await esperarInicio()
    abrirCrear()
    await screen.findByRole('heading', { name: 'Registrar nuevo día' })
    llenarFormulario({ egresos: '7', emergencia: '2', sellados: '3', tia: '4' })

    fireEvent.change(screen.getByLabelText(/^Fecha del registro/), {
      target: { value: FECHA_ANTERIOR },
    })
    expect(await screen.findByText('Cambios sin guardar')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Seguir editando' }))
    expect(await screen.findByRole('heading', { name: 'Registrar nuevo día' })).toBeInTheDocument()
    expect(screen.getByLabelText(/^Fecha del registro/)).toHaveValue(formatearFechaTexto(HOY))
    expect(screen.getByLabelText('Egresos hospitalarios')).toHaveValue('7')

    fireEvent.change(screen.getByLabelText(/^Fecha del registro/), {
      target: { value: FECHA_ANTERIOR },
    })
    await screen.findByText('Cambios sin guardar')
    fireEvent.click(screen.getByRole('button', { name: 'Descartar cambios' }))

    await waitFor(() =>
      expect(screen.getByLabelText(/^Fecha del registro/)).toHaveValue(CORTA_ANTERIOR),
    )
    expect(screen.getByLabelText('Egresos hospitalarios')).toHaveValue('')
  })

  it('filtra por rango, calcula el resumen y restablece', async () => {
    guardarCuadernoRojoMock(FECHA_ANTERIOR, {
      egresosHospitalarios: 5,
      sobresEmergencia: 6,
      sobresSellados: 7,
      tia: 8,
    })
    renderPagina()
    await esperarInicio()

    const desde = `0110${ANIO - 1}`
    const hasta = `3110${ANIO - 1}`
    await escribirRango(desde, hasta)

    expect(
      await screen.findByRole('rowheader', { name: new RegExp(CORTA_ANTERIOR) }),
    ).toBeInTheDocument()
    expect(screen.getByText('Días registrados')).toBeInTheDocument()
    expect(screen.getAllByText('Egresos hospitalarios').length).toBeGreaterThan(0)

    fireEvent.click(screen.getByRole('button', { name: /restablecer/i }))
    await waitFor(() =>
      expect(screen.getByLabelText(/^Desde/)).toHaveValue(`01/${MES.slice(5, 7)}/${ANIO}`),
    )
  })

  it('no consulta rangos inválidos', async () => {
    renderPagina()
    await esperarInicio()

    await escribirRango(`3011${ANIO}`, `0111${ANIO}`)

    expect(await screen.findByText(/fecha final no puede ser anterior/i)).toBeInTheDocument()
  })

  it('genera el reporte PDF con los registros filtrados', async () => {
    guardarCuadernoRojoMock(FECHA_ACTUAL, {
      egresosHospitalarios: 1,
      sobresEmergencia: 2,
      sobresSellados: 3,
      tia: 4,
    })
    renderPagina()
    await esperarTabla()

    fireEvent.click(screen.getByRole('button', { name: /generar reporte pdf/i }))
    expect(descargarReporteCuaderno).toHaveBeenCalledTimes(1)
    expect(descargarReporteCuaderno).toHaveBeenCalledWith(
      expect.objectContaining({
        registros: expect.arrayContaining([expect.objectContaining({ fecha: FECHA_ACTUAL })]),
      }),
    )
    expect(await screen.findByText('Reporte generado')).toBeInTheDocument()
  })

  it('genera el reporte con todos los registros del rango, no solo los visibles', async () => {
    const dias = Array.from(
      { length: 28 },
      (_, indice) => `${MES}-${String(indice + 1).padStart(2, '0')}`,
    )
    dias.forEach((fecha, indice) => {
      guardarCuadernoRojoMock(fecha, {
        egresosHospitalarios: indice + 1,
        sobresEmergencia: indice + 1,
        sobresSellados: indice + 1,
        tia: indice + 1,
      })
    })

    renderPagina()
    await esperarTabla()
    fireEvent.click(screen.getByRole('button', { name: /generar reporte pdf/i }))

    const llamada = descargarReporteCuaderno.mock.calls.at(-1)[0]
    expect(llamada.registros).toHaveLength(dias.length)
    expect(llamada.registros.map((registro) => registro.fecha)).toEqual(
      expect.arrayContaining(dias),
    )
  })

  it('deshabilita el reporte cuando no hay registros', async () => {
    renderPagina()
    await esperarInicio()
    expect(screen.getByRole('button', { name: /generar reporte pdf/i })).toBeDisabled()
  })

  it('elimina un registro con doble confirmación y conserva el rango', async () => {
    guardarCuadernoRojoMock(FECHA_ACTUAL, {
      egresosHospitalarios: 1,
      sobresEmergencia: 2,
      sobresSellados: 3,
      tia: 4,
    })
    renderPagina()
    await esperarTabla()

    fireEvent.click(
      within(tabla()).getByRole('button', {
        name: `Eliminar registro del ${CORTA_ACTUAL}`,
      }),
    )
    expect(await screen.findByRole('heading', { name: 'Eliminar registro' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /continuar/i }))

    expect(
      await screen.findByRole('heading', { name: 'Eliminar registro definitivamente' }),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(obtenerCuadernoRojoMock(FECHA_ACTUAL)).not.toBeNull()

    fireEvent.click(
      within(tabla()).getByRole('button', {
        name: `Eliminar registro del ${CORTA_ACTUAL}`,
      }),
    )
    await screen.findByRole('heading', { name: 'Eliminar registro' })
    fireEvent.click(screen.getByRole('button', { name: /continuar/i }))
    fireEvent.click(await screen.findByRole('button', { name: /eliminar definitivamente/i }))

    expect(await screen.findByText('Registro eliminado')).toBeInTheDocument()
    expect(obtenerCuadernoRojoMock(FECHA_ACTUAL)).toBeNull()
    expect(screen.queryByText(CORTA_ACTUAL)).not.toBeInTheDocument()
    expect(screen.getByLabelText(/^Desde/)).toHaveValue(`01/${MES.slice(5, 7)}/${ANIO}`)
  })
})
