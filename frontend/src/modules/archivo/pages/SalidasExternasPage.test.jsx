import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '@/shared/context/AuthContext.jsx'
import { ThemeProvider } from '@/shared/context/ThemeContext.jsx'
import { listarHistorial, registrarDevolucion, registrarPrestamo } from '../api/salidasExternasApi'
import { reiniciarSalidasExternasMock } from '../api/salidasExternasMock'
import SalidasExternasPage from './SalidasExternasPage.jsx'

const HOY = '2026-11-02T18:00:00.000Z'
const HOY_TEMPRANO = '2026-11-02T15:00:00.000Z'

function renderPagina() {
  return render(
    <MemoryRouter initialEntries={['/archivo/salidas-externas']}>
      <ThemeProvider>
        <AuthProvider>
          <SalidasExternasPage />
        </AuthProvider>
      </ThemeProvider>
    </MemoryRouter>,
  )
}

async function montar() {
  renderPagina()
  await screen.findByRole('heading', { name: 'Salidas externas' })
}

async function llenarFormulario(usuario, { persona = 'Ana Ramírez', motivo = 'Tesis' } = {}) {
  if (persona) await usuario.type(screen.getByLabelText('Persona que retira'), persona)
  if (motivo) await usuario.type(screen.getByLabelText('Motivo del préstamo'), motivo)
}

function crearVentanaFalsa() {
  return {
    document: { open: vi.fn(), write: vi.fn(), close: vi.fn() },
    focus: vi.fn(),
    close: vi.fn(),
  }
}

describe('SalidasExternasPage', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(HOY))
    reiniciarSalidasExternasMock()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('se renderiza dentro del layout de Archivo con su encabezado', async () => {
    await montar()

    expect(screen.getByRole('heading', { name: 'Salidas externas' })).toBeInTheDocument()
    expect(
      screen.getByText('Registro y control de préstamos de expedientes físicos.'),
    ).toBeInTheDocument()
    expect(screen.getByText(/noviembre de 2026/)).toBeInTheDocument()
    expect(screen.getByLabelText('Hora actual')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Estación de Archivo' })).toBeInTheDocument()
  })

  it('mantiene visible el aviso de simulación', async () => {
    await montar()

    expect(screen.getByText('Modo simulación')).toBeInTheDocument()
    expect(screen.getByText(/se perderán al recargar la página/i)).toBeInTheDocument()
  })

  it('inicia en modo préstamo', async () => {
    await montar()

    expect(screen.getByRole('button', { name: 'Modo: registrar préstamo' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: 'Modo: registrar devolución' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    expect(screen.getByLabelText('Número de expediente')).toBeInTheDocument()
  })

  it('cambia al modo devolución con el panel funcional', async () => {
    const usuario = userEvent.setup()
    await montar()

    await usuario.click(screen.getByRole('button', { name: 'Modo: registrar devolución' }))

    expect(screen.getByRole('button', { name: 'Modo: registrar devolución' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('heading', { name: 'Registrar devolución' })).toBeInTheDocument()
    expect(screen.getByLabelText('Número de expediente')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Registrar devolución' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ingreso manual' })).toBeInTheDocument()
    expect(screen.getByText('Modo simulación')).toBeInTheDocument()
  })

  it('conserva persona y motivo al cambiar de modo', async () => {
    const usuario = userEvent.setup()
    await montar()

    await llenarFormulario(usuario, { motivo: 'Investigación universitaria' })
    await usuario.click(screen.getByRole('button', { name: 'Modo: registrar devolución' }))
    await usuario.click(screen.getByRole('button', { name: 'Modo: registrar préstamo' }))

    expect(screen.getByLabelText('Persona que retira')).toHaveValue('Ana Ramírez')
    expect(screen.getByLabelText('Motivo del préstamo')).toHaveValue('Investigación universitaria')
  })

  it('registra con Enter, limpia el número y reenfoca el campo', async () => {
    const usuario = userEvent.setup()
    await montar()

    await llenarFormulario(usuario)
    const numero = screen.getByLabelText('Número de expediente')
    await usuario.type(numero, '927581{Enter}')

    expect(await screen.findByText('Préstamo guardado')).toBeInTheDocument()
    expect(screen.getAllByText(/9275-81/).length).toBeGreaterThan(0)
    expect(numero).toHaveValue('')
    expect(numero).toHaveFocus()
    expect(screen.getByLabelText('Persona que retira')).toHaveValue('Ana Ramírez')
    expect(screen.getByLabelText('Motivo del préstamo')).toHaveValue('Tesis')

    const historial = await listarHistorial()
    expect(historial).toHaveLength(1)
    expect(historial[0].numeroExpediente).toBe('927581')
  })

  it('permite registrar dos expedientes consecutivos para la misma persona', async () => {
    const usuario = userEvent.setup()
    await montar()

    await llenarFormulario(usuario)
    await usuario.type(screen.getByLabelText('Número de expediente'), '927581{Enter}')
    await screen.findByText('Préstamo guardado')

    await usuario.type(screen.getByLabelText('Número de expediente'), '30954{Enter}')
    await waitFor(() => expect(screen.getAllByText(/3095-4/).length).toBeGreaterThan(0))

    const historial = await listarHistorial()
    expect(historial).toHaveLength(2)
    expect(historial.map((registro) => registro.numeroExpediente).sort()).toEqual([
      '30954',
      '927581',
    ])
    expect(screen.getByLabelText('Persona que retira')).toHaveValue('Ana Ramírez')
  })

  it('rechaza un préstamo activo duplicado y conserva el número', async () => {
    await registrarPrestamo({
      numeroExpediente: '927581',
      personaRetira: 'Luis Pérez',
      motivo: 'Tesis',
      instante: '2026-11-02T15:00:00.000Z',
    })

    const usuario = userEvent.setup()
    await montar()
    await llenarFormulario(usuario, { motivo: 'Revisión administrativa' })

    const numero = screen.getByLabelText('Número de expediente')
    await usuario.type(numero, '927581{Enter}')

    expect(await screen.findByText('Préstamo activo')).toBeInTheDocument()
    expect(screen.getByText(/Prestado a Luis Pérez/)).toBeInTheDocument()
    expect(numero).toHaveValue('927581')
    expect(await listarHistorial()).toHaveLength(1)
  })

  it('exige la persona que retira y conserva la captura', async () => {
    const usuario = userEvent.setup()
    await montar()

    await llenarFormulario(usuario, { persona: null, motivo: 'Revisión administrativa' })
    const numero = screen.getByLabelText('Número de expediente')
    await usuario.type(numero, '927581{Enter}')

    expect(await screen.findByText('Revise los datos')).toBeInTheDocument()
    expect(screen.getByText(/La persona que retira es obligatoria/i)).toBeInTheDocument()
    expect(numero).toHaveValue('927581')
    expect(await listarHistorial()).toHaveLength(0)
  })

  it('completa el ciclo préstamo → devolución y rechaza la segunda devolución', async () => {
    const usuario = userEvent.setup()
    await montar()

    // 1-2. Registrar un préstamo.
    await llenarFormulario(usuario, { motivo: 'Investigación universitaria' })
    await usuario.type(screen.getByLabelText('Número de expediente'), '927581{Enter}')
    await screen.findByText('Préstamo guardado')

    // 3-4. Devolución directa: una sola acción, sin tarjeta de confirmación.
    await usuario.click(screen.getByRole('button', { name: 'Modo: registrar devolución' }))
    const numeroDevolucion = screen.getByLabelText('Número de expediente')
    await usuario.type(numeroDevolucion, '927581{Enter}')

    expect(await screen.findByText('Devolución guardada')).toBeInTheDocument()

    const historial = await listarHistorial()
    expect(historial).toHaveLength(1)
    expect(historial[0].fechaDevolucion).toBe(HOY)
    expect(numeroDevolucion).toHaveValue('')
    expect(numeroDevolucion).toHaveFocus()

    // 5. Intentar devolver nuevamente.
    await usuario.type(numeroDevolucion, '927581{Enter}')
    expect(await screen.findByText('Devolución ya registrada')).toBeInTheDocument()

    // 6. Volver a préstamo conservando persona y motivo.
    await usuario.click(screen.getByRole('button', { name: 'Modo: registrar préstamo' }))
    expect(screen.getByLabelText('Persona que retira')).toHaveValue('Ana Ramírez')
    expect(screen.getByLabelText('Motivo del préstamo')).toHaveValue('Investigación universitaria')
  })

  it('una devolución sin préstamo pendiente no modifica registros', async () => {
    const usuario = userEvent.setup()
    await montar()

    await usuario.click(screen.getByRole('button', { name: 'Modo: registrar devolución' }))
    const numero = screen.getByLabelText('Número de expediente')
    await usuario.type(numero, '555555{Enter}')

    expect(await screen.findByText('Sin préstamo pendiente')).toBeInTheDocument()
    expect(await listarHistorial()).toEqual([])
    expect(numero).toHaveValue('555555')
  })

  it('no precarga registros ni incluye lotes o checkboxes', async () => {
    await montar()

    expect(screen.queryByText('Préstamo guardado')).not.toBeInTheDocument()
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0)
    expect(screen.queryByText(/lote/i)).not.toBeInTheDocument()
    expect(await listarHistorial()).toEqual([])
    expect(await screen.findByText('No hay movimientos')).toBeInTheDocument()
  })

  it('lista los préstamos del día en orden descendente', async () => {
    const usuario = userEvent.setup()
    await montar()
    await llenarFormulario(usuario)

    const numero = screen.getByLabelText('Número de expediente')
    await usuario.type(numero, '927581{Enter}')
    await screen.findByText('Préstamo guardado')
    await usuario.type(numero, '30954{Enter}')

    await waitFor(() => {
      const filas = within(screen.getByRole('table')).getAllByRole('row')
      expect(filas).toHaveLength(3)
    })

    const filas = within(screen.getByRole('table')).getAllByRole('row')
    // Mismo instante de salida: el desempate determinista de B1 ordena por expediente.
    expect(within(filas[1]).getByText('3095-4')).toBeInTheDocument()
    expect(within(filas[2]).getByText('9275-81')).toBeInTheDocument()
    expect(within(filas[1]).getByText('Pendiente')).toBeInTheDocument()
  })

  it('actualiza la tabla y las vistas después de una devolución', async () => {
    const usuario = userEvent.setup()
    await montar()
    await llenarFormulario(usuario)
    await usuario.type(screen.getByLabelText('Número de expediente'), '927581{Enter}')
    await screen.findByText('Préstamo guardado')

    await usuario.click(screen.getByRole('button', { name: 'Modo: registrar devolución' }))
    const numeroDevolucion = screen.getByLabelText('Número de expediente')
    await usuario.type(numeroDevolucion, '927581{Enter}')
    await screen.findByText('Devolución guardada')

    // Todos: el movimiento pasa a Devuelto con su fecha.
    await waitFor(() => {
      const tabla = screen.getByRole('table')
      expect(within(tabla).getByText('Devuelto')).toBeInTheDocument()
      // Salida y devolución comparten el mismo instante en esta prueba.
      expect(within(tabla).getAllByText('02/11/2026 12:00')).toHaveLength(2)
    })

    // Pendientes: ya no aparece.
    await usuario.click(screen.getByRole('button', { name: 'Pendientes' }))
    expect(
      await screen.findByText('No hay préstamos pendientes de devolución.'),
    ).toBeInTheDocument()

    // Devueltos: se conserva.
    await usuario.click(screen.getByRole('button', { name: 'Devueltos' }))
    await waitFor(() => {
      const tabla = screen.getByRole('table')
      expect(within(tabla).getByText('9275-81')).toBeInTheDocument()
      expect(within(tabla).getByText('Devuelto')).toBeInTheDocument()
    })
  })

  it('filtra por expediente, persona y motivo', async () => {
    await registrarPrestamo({
      numeroExpediente: '927581',
      personaRetira: 'Ana Ramírez',
      motivo: 'Tesis',
      instante: '2026-11-02T15:00:00.000Z',
    })
    await registrarPrestamo({
      numeroExpediente: '30954',
      personaRetira: 'Luis Pérez',
      motivo: 'Investigación universitaria',
      instante: '2026-11-02T16:00:00.000Z',
    })

    const usuario = userEvent.setup()
    await montar()
    await screen.findByRole('table')

    const buscar = screen.getByRole('searchbox', { name: 'Buscar movimientos' })

    await usuario.type(buscar, 'luis')
    await waitFor(() =>
      expect(within(screen.getByRole('table')).queryByText('Ana Ramírez')).not.toBeInTheDocument(),
    )
    expect(within(screen.getByRole('table')).getByText('Luis Pérez')).toBeInTheDocument()

    await usuario.clear(buscar)
    await usuario.type(buscar, '9275-81')
    await waitFor(() =>
      expect(within(screen.getByRole('table')).queryByText('3095-4')).not.toBeInTheDocument(),
    )
    expect(within(screen.getByRole('table')).getByText('9275-81')).toBeInTheDocument()

    await usuario.clear(buscar)
    await usuario.type(buscar, 'investigacion')
    await waitFor(() =>
      expect(within(screen.getByRole('table')).queryByText('9275-81')).not.toBeInTheDocument(),
    )
    expect(within(screen.getByRole('table')).getByText('3095-4')).toBeInTheDocument()
  })

  it('reinicia la vista Todos al cambiar el día y conserva lo pendiente', async () => {
    // Ayer: uno pendiente, uno devuelto ayer y uno devuelto hoy.
    await registrarPrestamo({
      numeroExpediente: '111111',
      personaRetira: 'Ana Ramírez',
      motivo: 'Tesis',
      instante: '2026-11-01T15:00:00.000Z',
    })
    await registrarPrestamo({
      numeroExpediente: '222222',
      personaRetira: 'Luis Pérez',
      motivo: 'Tesis',
      instante: '2026-11-01T16:00:00.000Z',
    })
    await registrarDevolucion({
      numeroExpediente: '222222',
      instante: '2026-11-01T20:00:00.000Z',
    })
    await registrarPrestamo({
      numeroExpediente: '333333',
      personaRetira: 'Marta Ruiz',
      motivo: 'Tesis',
      instante: '2026-11-01T17:00:00.000Z',
    })
    await registrarDevolucion({ numeroExpediente: '333333', instante: HOY })

    await montar()
    await screen.findByRole('table')

    // Todos: pendiente de ayer + devuelto hoy; el devuelto ayer queda fuera.
    expect(within(screen.getByRole('table')).getByText('1111-11')).toBeInTheDocument()
    expect(within(screen.getByRole('table')).getByText('3333-33')).toBeInTheDocument()
    expect(within(screen.getByRole('table')).queryByText('2222-22')).not.toBeInTheDocument()

    // Cambia el día operativo sin recargar la página.
    vi.setSystemTime(new Date('2026-11-03T15:00:00.000Z'))
    act(() => {
      window.dispatchEvent(new Event('focus'))
    })

    await waitFor(() => {
      const tabla = screen.getByRole('table')
      expect(within(tabla).queryByText('3333-33')).not.toBeInTheDocument()
      expect(within(tabla).getByText('1111-11')).toBeInTheDocument()
      expect(within(tabla).queryByText('2222-22')).not.toBeInTheDocument()
    })
  })

  it('conserva persona y motivo al cambiar de vista', async () => {
    const usuario = userEvent.setup()
    await montar()
    await llenarFormulario(usuario)

    await usuario.click(screen.getByRole('button', { name: 'Pendientes' }))
    expect(
      await screen.findByText('No hay préstamos pendientes de devolución.'),
    ).toBeInTheDocument()

    expect(screen.getByLabelText('Persona que retira')).toHaveValue('Ana Ramírez')
    expect(screen.getByLabelText('Motivo del préstamo')).toHaveValue('Tesis')
  })

  it('imprime el reporte con todo el historial aunque la tabla esté filtrada', async () => {
    await registrarPrestamo({
      numeroExpediente: '111111',
      personaRetira: 'Ana Ramírez',
      motivo: 'Tesis',
      instante: HOY_TEMPRANO,
    })
    await registrarPrestamo({
      numeroExpediente: '222222',
      personaRetira: 'Luis Pérez',
      motivo: 'Investigación universitaria',
      instante: '2026-11-02T16:00:00.000Z',
    })
    await registrarDevolucion({
      numeroExpediente: '222222',
      instante: '2026-11-02T17:00:00.000Z',
    })

    const ventana = crearVentanaFalsa()
    vi.spyOn(window, 'open').mockReturnValue(ventana)

    const usuario = userEvent.setup()
    await montar()

    // La búsqueda de la tabla no debe limitar el reporte.
    await usuario.type(screen.getByRole('searchbox', { name: 'Buscar movimientos' }), '2222-22')

    await usuario.click(screen.getByRole('button', { name: 'Imprimir reporte del día' }))
    await waitFor(() => expect(ventana.document.write).toHaveBeenCalled())

    const html = ventana.document.write.mock.calls[0][0]
    expect(html).toContain('CONTROL DE SALIDAS EXTERNAS DE EXPEDIENTES')
    expect(html).toContain('1111-11')
    expect(html).toContain('2222-22')
    expect(html).toContain('A. EXPEDIENTES DEVUELTOS')
    expect(html).toContain('B. EXPEDIENTES PENDIENTES')
    expect(html).not.toContain('EXPEDIENTES PRESTADOS')
    expect(html).toContain('Elaborado por — Archivo')
    expect(html).toContain('Revisado por — Jefatura de Archivo')

    expect(await screen.findByText('Reporte generado')).toBeInTheDocument()
    expect(screen.getByRole('searchbox', { name: 'Buscar movimientos' })).toHaveValue('2222-22')
  })

  it('avisa cuando el navegador bloquea la ventana del reporte', async () => {
    vi.spyOn(window, 'open').mockReturnValue(null)

    const usuario = userEvent.setup()
    await montar()

    await usuario.click(screen.getByRole('button', { name: 'Imprimir reporte del día' }))

    expect(await screen.findByText('No se pudo abrir el reporte')).toBeInTheDocument()
    expect(screen.getByText(/bloqueó la ventana/)).toBeInTheDocument()
  })

  it('recupera manualmente un pendiente y permite devolverlo después', async () => {
    await registrarPrestamo({
      numeroExpediente: '111111',
      personaRetira: 'Ana Ramírez',
      motivo: 'Tesis',
      instante: HOY_TEMPRANO,
    })
    await registrarPrestamo({
      numeroExpediente: '222222',
      personaRetira: 'Luis Pérez',
      motivo: 'Investigación universitaria',
      instante: '2026-11-02T16:00:00.000Z',
    })
    await registrarDevolucion({
      numeroExpediente: '222222',
      instante: '2026-11-02T17:00:00.000Z',
    })

    const ventana = crearVentanaFalsa()
    vi.spyOn(window, 'open').mockReturnValue(ventana)

    const usuario = userEvent.setup()
    await montar()

    // Reporte: un pendiente y un devuelto.
    await usuario.click(screen.getByRole('button', { name: 'Imprimir reporte del día' }))
    await waitFor(() => expect(ventana.document.write).toHaveBeenCalled())
    const html = ventana.document.write.mock.calls[0][0]
    expect(html).toContain('1111-11')
    expect(html).toContain('2222-22')
    expect(await listarHistorial()).toHaveLength(2)

    // Pérdida de la sesión: reinicio del mock, solo dentro de la prueba.
    reiniciarSalidasExternasMock()

    // Recuperación manual con los datos del reporte impreso.
    await usuario.click(screen.getByRole('button', { name: 'Recuperar préstamo pendiente' }))
    await usuario.type(screen.getByLabelText('Número de expediente a recuperar'), '111111')
    await usuario.type(screen.getByLabelText('Persona que retiró'), 'Ana Ramírez')
    await usuario.type(screen.getByLabelText('Motivo'), 'Tesis')
    await usuario.type(screen.getByLabelText('Fecha original de salida'), '02/11/2026')
    await usuario.type(screen.getByLabelText('Hora original de salida'), '09:00')
    await usuario.click(screen.getByRole('button', { name: 'Recuperar préstamo' }))

    expect(await screen.findByText('Recuperación registrada')).toBeInTheDocument()
    expect(await listarHistorial()).toHaveLength(1)

    await waitFor(() => {
      const tabla = screen.getByRole('table')
      expect(within(tabla).getByText('1111-11')).toBeInTheDocument()
      expect(within(tabla).getByText('Recuperado')).toBeInTheDocument()
      expect(within(tabla).getByText('Pendiente')).toBeInTheDocument()
    })

    // Se devuelve después por el procedimiento normal.
    await usuario.click(screen.getByRole('button', { name: 'Modo: registrar devolución' }))
    const numeroDevolucion = screen.getByLabelText('Número de expediente')
    await usuario.type(numeroDevolucion, '111111{Enter}')
    await screen.findByText('Devolución guardada')

    const [registro] = await listarHistorial()
    expect(registro.recuperadoManualmente).toBe(true)
    expect(registro.fechaDevolucion).toBe(HOY)
  })

  it('muestra la última acción y permite revertirla', async () => {
    const usuario = userEvent.setup()
    await montar()
    await llenarFormulario(usuario)
    await usuario.type(screen.getByLabelText('Número de expediente'), '927581{Enter}')
    await screen.findByText('Préstamo guardado')

    const panel = (await screen.findByText('Última acción realizada')).closest('section')
    expect(within(panel).getByText('Préstamo registrado')).toBeInTheDocument()
    expect(within(panel).getByText('9275-81')).toBeInTheDocument()

    await usuario.click(within(panel).getByRole('button', { name: 'Revertir última acción' }))

    expect(await screen.findByText('Acción revertida')).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.queryByText('Última acción realizada')).not.toBeInTheDocument(),
    )
    expect(await listarHistorial()).toEqual([])
  })

  it('mantiene la última acción al cambiar de modo', async () => {
    const usuario = userEvent.setup()
    await montar()
    await llenarFormulario(usuario)
    await usuario.type(screen.getByLabelText('Número de expediente'), '927581{Enter}')
    await screen.findByText('Préstamo guardado')
    await screen.findByText('Última acción realizada')

    await usuario.click(screen.getByRole('button', { name: 'Modo: registrar devolución' }))

    expect(screen.getByText('Última acción realizada')).toBeInTheDocument()
  })

  it('registra un expediente con ingreso manual y conserva el guion', async () => {
    const usuario = userEvent.setup()
    await montar()
    await llenarFormulario(usuario)

    await usuario.click(screen.getByRole('button', { name: 'Ingreso manual' }))
    await usuario.type(screen.getByLabelText('Número de expediente'), '91-1330')
    await usuario.click(screen.getByRole('button', { name: 'Registrar préstamo' }))

    expect(await screen.findByText('Préstamo guardado')).toBeInTheDocument()

    const [registro] = await listarHistorial()
    expect(registro.numeroExpediente).toBe('911330')
    expect(registro.numeroExpedientePresentacion).toBe('91-1330')
    expect(within(screen.getByRole('table')).getByText('91-1330')).toBeInTheDocument()
  })
})
