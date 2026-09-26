import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToastProvider } from '@/shared/context/ToastContext.jsx'
import { reiniciarCatalogosMock } from '../api/mockData.js'

// Fija el mes visible para que las pruebas no dependan de la fecha del sistema.
vi.mock('../utils/fechas.js', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    mesActual: () => ({ anio: 2026, mes: 9 }),
  }
})

import CalendarioPage from './CalendarioPage.jsx'

function renderPagina() {
  return render(
    <ToastProvider>
      <CalendarioPage />
    </ToastProvider>,
  )
}

async function esperarListado() {
  return screen.findByTestId('lista-dias-no-laborables')
}

async function abrirModalDesdeBoton(user) {
  await user.click(screen.getByRole('button', { name: /Agregar día no laborable/i }))
  return screen.findByText('Nuevo día no laborable')
}

describe('CalendarioPage', () => {
  beforeEach(() => {
    reiniciarCatalogosMock()
  })

  it('muestra el heading Calendario institucional y la cuadrícula mensual', async () => {
    renderPagina()

    expect(screen.getByRole('heading', { name: 'Calendario institucional' })).toBeInTheDocument()

    await esperarListado()
    expect(screen.getByLabelText('Mes anterior')).toBeInTheDocument()
    expect(screen.getByLabelText('Mes siguiente')).toBeInTheDocument()
    expect(screen.getByText('Lun')).toBeInTheDocument()
    expect(screen.getByText('Septiembre 2026')).toBeInTheDocument()
  })

  it('carga los días no laborables del mes visible', async () => {
    renderPagina()
    const listado = await esperarListado()

    expect(within(listado).getByText('Día de la Independencia Patria')).toBeInTheDocument()
    expect(within(listado).getByText('15 de septiembre de 2026')).toBeInTheDocument()
    expect(within(listado).getByText('Martes')).toBeInTheDocument()
    expect(within(listado).getByText('Registrado por: Administrador HRO')).toBeInTheDocument()
    expect(
      screen.getByRole('button', {
        name: /Consultar 15 de septiembre de 2026: Día de la Independencia Patria/i,
      }),
    ).toBeInTheDocument()
  })

  it('incluye Ver y Habilitar fecha dentro de cada tarjeta del listado', async () => {
    renderPagina()
    const listado = await esperarListado()

    const tarjetas = within(listado).getAllByRole('listitem')
    expect(tarjetas.length).toBeGreaterThan(0)

    tarjetas.forEach((tarjeta) => {
      expect(within(tarjeta).getByRole('button', { name: 'Ver' })).toBeInTheDocument()
      expect(within(tarjeta).getByRole('button', { name: 'Habilitar fecha' })).toBeInTheDocument()
    })
  })

  it('navega al mes siguiente y recarga el rango', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarListado()

    await user.click(screen.getByLabelText('Mes siguiente'))

    expect(await screen.findByText('Octubre 2026')).toBeInTheDocument()
    const listado = await esperarListado()
    expect(within(listado).getByText('Día de la Revolución de Octubre')).toBeInTheDocument()
  })

  it('abre el modal de alta desde el botón con la fecha vacía', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarListado()

    await abrirModalDesdeBoton(user)
    expect(screen.getByLabelText(/^Fecha/)).toHaveValue('')
  })

  it('abre el modal de alta desde un día libre con la fecha precargada', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarListado()

    await user.click(
      screen.getByRole('button', {
        name: /Registrar día no laborable el 2 de septiembre de 2026/i,
      }),
    )

    expect(await screen.findByText('Nuevo día no laborable')).toBeInTheDocument()
    expect(screen.getByLabelText(/^Fecha/)).toHaveValue('2026-09-02')
  })

  it('valida fecha y motivo obligatorios', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarListado()

    await abrirModalDesdeBoton(user)
    await user.click(screen.getByRole('button', { name: 'Registrar' }))

    expect(screen.getByText('La fecha es obligatoria')).toBeInTheDocument()
    expect(screen.getByText('El motivo es obligatorio')).toBeInTheDocument()
    expect(screen.getByText('Nuevo día no laborable')).toBeInTheDocument()
  })

  it('crea un día no laborable y lo refleja en el listado', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarListado()

    await abrirModalDesdeBoton(user)
    fireEvent.change(screen.getByLabelText(/^Fecha/), { target: { value: '2026-09-10' } })
    fireEvent.change(screen.getByLabelText(/^Motivo/), { target: { value: 'Asueto local' } })
    await user.click(screen.getByRole('button', { name: 'Registrar' }))

    expect(await screen.findByText('Día no laborable registrado')).toBeInTheDocument()
    const listado = await esperarListado()
    expect(within(listado).getByText('Asueto local')).toBeInTheDocument()
  })

  it('mantiene el formulario abierto y avisa ante una fecha duplicada', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarListado()

    await abrirModalDesdeBoton(user)
    fireEvent.change(screen.getByLabelText(/^Fecha/), { target: { value: '2026-09-15' } })
    fireEvent.change(screen.getByLabelText(/^Motivo/), { target: { value: 'Repetido' } })
    await user.click(screen.getByRole('button', { name: 'Registrar' }))

    expect(
      await screen.findByText('Esta fecha ya está registrada como día no laborable.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Nuevo día no laborable')).toBeInTheDocument()
  })

  it('muestra un conflicto con citas y no ofrece forzar el bloqueo', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarListado()

    await abrirModalDesdeBoton(user)
    fireEvent.change(screen.getByLabelText(/^Fecha/), { target: { value: '2026-09-20' } })
    fireEvent.change(screen.getByLabelText(/^Motivo/), { target: { value: 'Mantenimiento' } })
    await user.click(screen.getByRole('button', { name: 'Registrar' }))

    expect(
      await screen.findByText('No se puede marcar esta fecha como no laborable'),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/citas registradas que deben resolverse previamente/i),
    ).toBeInTheDocument()
    expect(screen.queryByText(/Bloquear de todos modos/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/forzar/i)).not.toBeInTheDocument()
    expect(screen.getByText('Nuevo día no laborable')).toBeInTheDocument()
  })

  it('habilita una fecha con confirmación y la retira del listado', async () => {
    const user = userEvent.setup()
    renderPagina()
    const listado = await esperarListado()

    await user.click(within(listado).getByRole('button', { name: 'Habilitar fecha' }))

    expect(
      screen.getByText(/¿Deseas habilitar nuevamente esta fecha como día laborable\?/),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Sí, habilitar fecha' }))

    expect(await screen.findByText('Fecha habilitada nuevamente')).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.queryByText('Día de la Independencia Patria')).not.toBeInTheDocument(),
    )
  })

  it('muestra el detalle en modo solo lectura con los datos cargados', async () => {
    const user = userEvent.setup()
    renderPagina()
    const listado = await esperarListado()

    await user.click(within(listado).getByRole('button', { name: 'Ver' }))

    expect(await screen.findByText('Detalle del día no laborable')).toBeInTheDocument()
    const detalle = screen.getByRole('dialog')
    expect(within(detalle).getByText('Día de la Independencia Patria')).toBeInTheDocument()
    expect(within(detalle).getByText('Registrado por')).toBeInTheDocument()
    expect(within(detalle).getByText('Administrador HRO')).toBeInTheDocument()
  })
})
