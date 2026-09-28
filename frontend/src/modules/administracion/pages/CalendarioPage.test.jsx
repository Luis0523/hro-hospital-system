import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToastProvider } from '@/shared/context/ToastContext.jsx'
import { reiniciarCatalogosMock } from '../api/mockData.js'

// Fija mes y "hoy" para que las pruebas no dependan de la fecha del sistema.
vi.mock('../utils/fechas.js', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    mesActual: () => ({ anio: 2026, mes: 9 }),
    hoyISO: () => '2026-09-27',
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

async function abrirFormularioConflicto(user) {
  await abrirModalDesdeBoton(user)
  fireEvent.change(screen.getByLabelText(/^Fecha/), { target: { value: '2026-09-20' } })
  fireEvent.change(screen.getByLabelText(/^Motivo/), { target: { value: 'Mantenimiento' } })
  await user.click(screen.getByRole('button', { name: 'Registrar' }))
  return screen.findByText('Citas afectadas por el bloqueo')
}

describe('CalendarioPage', () => {
  beforeEach(() => {
    reiniciarCatalogosMock()
  })

  it('muestra el heading, las pestañas y la cuadrícula mensual con selectores', async () => {
    renderPagina()

    expect(screen.getByRole('heading', { name: 'Calendario institucional' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Mensual' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Vista anual' })).toBeInTheDocument()

    await esperarListado()
    expect(screen.getByText('Lun')).toBeInTheDocument()
    expect(screen.getByLabelText('Mes')).toHaveValue('9')
    expect(screen.getByLabelText('Año')).toHaveValue('2026')
  })

  it('carga los días no laborables del mes visible', async () => {
    renderPagina()
    const listado = await esperarListado()

    expect(within(listado).getByText('Día de la Independencia Patria')).toBeInTheDocument()
    expect(within(listado).getByText('15 de septiembre de 2026')).toBeInTheDocument()
  })

  it('incluye Ver, Editar motivo y Habilitar día en cada tarjeta', async () => {
    renderPagina()
    const listado = await esperarListado()

    const tarjetas = within(listado).getAllByRole('listitem')
    expect(tarjetas.length).toBeGreaterThan(0)

    tarjetas.forEach((tarjeta) => {
      expect(within(tarjeta).getByRole('button', { name: 'Ver' })).toBeInTheDocument()
      expect(within(tarjeta).getByRole('button', { name: 'Editar motivo' })).toBeInTheDocument()
      expect(within(tarjeta).getByRole('button', { name: 'Habilitar día' })).toBeInTheDocument()
    })
  })

  it('indica el día actual con el rótulo HOY', async () => {
    renderPagina()
    await esperarListado()

    expect(screen.getByText('HOY')).toBeInTheDocument()
  })

  it('navega al mes siguiente con la flecha', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarListado()

    await user.click(screen.getByLabelText('Mes siguiente'))

    expect(await screen.findByText('Día de la Revolución de Octubre')).toBeInTheDocument()
    expect(screen.getByLabelText('Mes')).toHaveValue('10')
  })

  it('permite seleccionar el mes directamente', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarListado()

    await user.selectOptions(screen.getByLabelText('Mes'), '10')

    expect(await screen.findByText('Día de la Revolución de Octubre')).toBeInTheDocument()
  })

  it('permite seleccionar el año directamente', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarListado()

    await user.selectOptions(screen.getByLabelText('Año'), '2027')

    expect(await screen.findByText('Mes sin días no laborables')).toBeInTheDocument()
    expect(screen.getByLabelText('Año')).toHaveValue('2027')
  })

  it('crea un día no laborable con forzar=false y lo refleja en el listado', async () => {
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

  it('avisa de un duplicado y mantiene el formulario', async () => {
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

  it('abre el modal de conflicto con las citas afectadas al recibir 409', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarListado()

    await abrirFormularioConflicto(user)

    expect(screen.getByText(/cita\(s\) activa\(s\)/)).toBeInTheDocument()
    expect(screen.getByText('08:30 — Juan López')).toBeInTheDocument()
    expect(screen.getByText('Dr. Carlos Méndez · Medicina General')).toBeInTheDocument()
    expect(screen.getByText('confirmada')).toBeInTheDocument()
    expect(screen.getByText(/no se reprogramarán automáticamente/i)).toBeInTheDocument()
  })

  it('Cancelar en el conflicto no reintenta y no registra el día', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarListado()

    await abrirFormularioConflicto(user)
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(screen.queryByText('Citas afectadas por el bloqueo')).not.toBeInTheDocument()
    expect(screen.queryByText('Día no laborable registrado')).not.toBeInTheDocument()
    // Vuelve al formulario de alta con los datos previos.
    expect(screen.getByText('Nuevo día no laborable')).toBeInTheDocument()
    expect(screen.getByLabelText(/^Fecha/)).toHaveValue('2026-09-20')
  })

  it('Confirmar en el conflicto reintenta con forzar=true', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarListado()

    await abrirFormularioConflicto(user)
    await user.click(screen.getByRole('button', { name: 'Confirmar día no laborable' }))

    expect(await screen.findByText('Día no laborable registrado')).toBeInTheDocument()
    const listado = await esperarListado()
    expect(within(listado).getByText('Mantenimiento')).toBeInTheDocument()
  })

  it('edita el motivo con la fecha bloqueada y refresca', async () => {
    const user = userEvent.setup()
    renderPagina()
    const listado = await esperarListado()

    await user.click(within(listado).getByRole('button', { name: 'Editar motivo' }))

    expect(await screen.findByText('Editar día no laborable')).toBeInTheDocument()
    const campoFecha = screen.getByLabelText(/^Fecha/)
    expect(campoFecha).toBeDisabled()
    expect(campoFecha).toHaveValue('15 de septiembre de 2026')

    const campoMotivo = screen.getByLabelText(/^Motivo/)
    expect(campoMotivo).toHaveValue('Día de la Independencia Patria')
    await user.clear(campoMotivo)
    await user.type(campoMotivo, 'Independencia (editado)')
    await user.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(await screen.findByText('Motivo actualizado')).toBeInTheDocument()
    await waitFor(() =>
      expect(
        within(screen.getByTestId('lista-dias-no-laborables')).getByText('Independencia (editado)'),
      ).toBeInTheDocument(),
    )
  })

  it('habilita un día con confirmación y lo retira del listado', async () => {
    const user = userEvent.setup()
    renderPagina()
    const listado = await esperarListado()

    await user.click(within(listado).getByRole('button', { name: 'Habilitar día' }))
    expect(screen.getByText(/¿Deseas habilitar nuevamente esta fecha/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Sí, habilitar día' }))

    expect(await screen.findByText('Fecha habilitada nuevamente')).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.queryByText('Día de la Independencia Patria')).not.toBeInTheDocument(),
    )
  })

  it('vista anual: una consulta por año, agrupada por mes', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarListado()

    await user.click(screen.getByRole('tab', { name: 'Vista anual' }))

    const anual = await screen.findByTestId('anual-dias-no-laborables')
    expect(within(anual).getByText('Septiembre')).toBeInTheDocument()
    expect(within(anual).getByText('Octubre')).toBeInTheDocument()
    expect(within(anual).getByText('Noviembre')).toBeInTheDocument()
    expect(within(anual).getByText('Diciembre')).toBeInTheDocument()
    expect(within(anual).getByText('Fiesta de Navidad')).toBeInTheDocument()
  })

  it('vista anual: empty state para un año sin registros', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarListado()

    await user.click(screen.getByRole('tab', { name: 'Vista anual' }))
    await screen.findByTestId('anual-dias-no-laborables')

    await user.selectOptions(screen.getByLabelText('Año'), '2027')

    expect(await screen.findByText('Año sin días no laborables')).toBeInTheDocument()
  })

  it('aplica roving tabindex y navega entre vistas con el teclado', async () => {
    const user = userEvent.setup()
    renderPagina()
    await esperarListado()

    const mensual = screen.getByRole('tab', { name: 'Mensual' })
    const anual = screen.getByRole('tab', { name: 'Vista anual' })

    expect(mensual).toHaveAttribute('tabindex', '0')
    expect(anual).toHaveAttribute('tabindex', '-1')

    mensual.focus()
    await user.keyboard('{ArrowRight}')

    expect(anual).toHaveFocus()
    expect(anual).toHaveAttribute('tabindex', '0')

    await user.keyboard('{ArrowLeft}')
    expect(mensual).toHaveFocus()
  })
})
