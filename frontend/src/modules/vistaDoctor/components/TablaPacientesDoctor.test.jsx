import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TablaPacientesDoctor from './TablaPacientesDoctor.jsx'
import { ACCION_ATENDER, ACCION_LLAMAR, ACCION_NO_RESPONDE } from '../api/doctorAcciones'
import { normalizarTurno } from '../api/doctorMappers'
import { CLINICAS_MOCK, turnosDeClinica } from '../api/mockData'

const clinica = CLINICAS_MOCK[0]
const asignacion = clinica.asignacion
const AHORA = 1_800_000_000_000

function turnosBase() {
  return turnosDeClinica(asignacion.id).map(normalizarTurno)
}

function turnosIdentificados() {
  return turnosBase().map((turno) => ({ ...turno, identificado: true }))
}

function crearTurnos(cantidad, { soloUltimoElegible = false } = {}) {
  return Array.from({ length: cantidad }, (_, indice) => {
    const esUltimo = indice === cantidad - 1
    return {
      id: 5000 + indice,
      correlativo: `MI-${indice + 1}`,
      orden: indice + 1,
      estado: soloUltimoElegible && !esUltimo ? 'atendido' : 'en_espera',
      expediente: `${String(indice + 1).padStart(10, '0')}`,
      pacienteNombre: `Paciente Demo ${indice + 1}`,
      identificado: true,
      intentosLlamado: 0,
      horaGenerado: new Date().toISOString(),
      horaLlamado: null,
      horaAtendido: null,
    }
  })
}

function renderTabla(props = {}) {
  const onAccion = vi.fn()
  const onRegistrarExpediente = vi.fn()
  render(
    <TablaPacientesDoctor
      clinica={clinica}
      asignacion={asignacion}
      turnos={turnosIdentificados()}
      ahora={Date.now()}
      onReintentar={vi.fn()}
      onAccion={onAccion}
      onRegistrarExpediente={onRegistrarExpediente}
      {...props}
    />,
  )
  return { onAccion, onRegistrarExpediente }
}

describe('TablaPacientesDoctor', () => {
  it('no expone nombre ni expediente antes de una identificación válida', () => {
    renderTabla({ turnos: turnosBase() })
    const tabla = screen.getByTestId('tabla-pacientes')

    expect(within(tabla).getAllByText('Pendiente de identificar').length).toBeGreaterThan(0)
    expect(within(tabla).getAllByText('Sin registrar').length).toBeGreaterThan(0)
    expect(within(tabla).queryByText('Rosa María Demo')).not.toBeInTheDocument()
    expect(within(tabla).queryByText('0000000001')).not.toBeInTheDocument()
  })

  it('muestra datos, correlativos alfanuméricos y estados al identificar', () => {
    renderTabla()
    const tabla = screen.getByTestId('tabla-pacientes')

    expect(within(tabla).getByText('MI-1')).toBeInTheDocument()
    expect(within(tabla).getByText('MI-6')).toBeInTheDocument()
    expect(within(tabla).getByText('Rosa María Demo')).toBeInTheDocument()
    expect(within(tabla).getByText('0000000001')).toBeInTheDocument()
    expect(within(tabla).getAllByText('En espera').length).toBeGreaterThan(0)
    expect(within(tabla).getByText('No respondió')).toBeInTheDocument()
    expect(within(tabla).getByText('Atendido')).toBeInTheDocument()
    expect(within(tabla).getByText('Reintegrado')).toBeInTheDocument()
    expect(within(tabla).getByText('8 min')).toBeInTheDocument()
    expect(screen.getByText(/Los cambios se guardan solo en esta pestaña/)).toBeInTheDocument()
  })

  it('muestra tarjetas en la disposición móvil', () => {
    renderTabla()
    const movil = screen.getByTestId('lista-pacientes-movil')

    expect(within(movil).getByText('MI-1')).toBeInTheDocument()
    expect(within(movil).getByText('Rosa María Demo')).toBeInTheDocument()
    expect(within(movil).getByText('0000000001')).toBeInTheDocument()
  })

  it('aplica el orden de la cola y explica por qué no se puede llamar', () => {
    renderTabla()
    const tabla = screen.getByTestId('tabla-pacientes')
    const llamar = within(tabla).getAllByRole('button', { name: /^Llamar$/ })

    expect(llamar).toHaveLength(4)
    expect(llamar.filter((boton) => !boton.disabled)).toHaveLength(1)
    expect(
      within(tabla).getAllByText(/El siguiente turno disponible es MI-1/).length,
    ).toBeGreaterThan(0)
    expect(within(tabla).getAllByRole('button', { name: /^Rellamar$/ })).toHaveLength(1)
    expect(within(tabla).queryAllByRole('button', { name: 'Atendió' })).toHaveLength(0)
  })

  it('muestra el cooldown y deshabilita Atendió sin expediente validado', () => {
    const turnos = turnosIdentificados().map((turno) =>
      turno.id === 1001 ? { ...turno, estado: 'llamado' } : turno,
    )
    renderTabla({
      turnos,
      ahora: AHORA + 2000,
      ultimoLlamadoEn: AHORA,
    })
    const tabla = screen.getByTestId('tabla-pacientes')

    const rellamar = within(tabla).getByRole('button', { name: 'Rellamar en 8 s' })
    expect(rellamar).toBeDisabled()

    const turnosSinExpediente = turnos.map((turno) =>
      turno.id === 1001 ? { ...turno, identificado: false, expediente: '' } : turno,
    )
    renderTabla({ turnos: turnosSinExpediente, ahora: AHORA })
    const tablaSinExpediente = screen.getAllByTestId('tabla-pacientes').at(-1)
    expect(within(tablaSinExpediente).getByRole('button', { name: 'Atendió' })).toBeDisabled()
    expect(
      within(tablaSinExpediente).getByText(/Registre el expediente para poder atender/),
    ).toBeInTheDocument()
  })

  it('reporta las acciones válidas al controlador', async () => {
    const usuario = userEvent.setup()
    const { onAccion } = renderTabla()
    const tabla = screen.getByTestId('tabla-pacientes')

    const llamar = within(tabla).getAllByRole('button', { name: 'Llamar' })
    await usuario.click(llamar[0])
    expect(onAccion).toHaveBeenCalledWith(
      ACCION_LLAMAR,
      expect.objectContaining({ id: 1001, correlativo: 'MI-1' }),
    )

    const rellamar = within(tabla).getByRole('button', { name: 'Rellamar' })
    await usuario.click(rellamar)
    expect(onAccion).toHaveBeenCalledWith(
      ACCION_LLAMAR,
      expect.objectContaining({ id: 1003, correlativo: 'MI-3' }),
    )
  })

  it('reporta no respondió y atendió solo para un turno llamado', async () => {
    const usuario = userEvent.setup()
    const turnos = turnosIdentificados().map((turno) =>
      turno.id === 1001 ? { ...turno, estado: 'llamado' } : turno,
    )
    const { onAccion } = renderTabla({ turnos, ahora: AHORA })
    const tabla = screen.getByTestId('tabla-pacientes')

    await usuario.click(within(tabla).getByRole('button', { name: 'No respondió' }))
    expect(onAccion).toHaveBeenCalledWith(ACCION_NO_RESPONDE, expect.objectContaining({ id: 1001 }))

    await usuario.click(within(tabla).getByRole('button', { name: 'Atendió' }))
    expect(onAccion).toHaveBeenCalledWith(ACCION_ATENDER, expect.objectContaining({ id: 1001 }))
  })

  it('abre el expediente del turno correcto', async () => {
    const usuario = userEvent.setup()
    const { onRegistrarExpediente } = renderTabla()
    const tabla = screen.getByTestId('tabla-pacientes')

    await usuario.click(within(tabla).getByRole('button', { name: 'Registrar expediente' }))
    expect(onRegistrarExpediente).toHaveBeenCalledWith(
      expect.objectContaining({ id: 1006, correlativo: 'MI-6' }),
    )
  })

  it('deshabilita todas las acciones mientras procesa o con jornada cerrada', () => {
    const { rerender } = render(
      <TablaPacientesDoctor
        clinica={clinica}
        asignacion={asignacion}
        turnos={turnosIdentificados()}
        onAccion={vi.fn()}
        procesando
      />,
    )
    const tabla = screen.getByTestId('tabla-pacientes')
    expect(
      within(tabla)
        .getAllByRole('button')
        .every((boton) => boton.disabled),
    ).toBe(true)

    rerender(
      <TablaPacientesDoctor
        clinica={clinica}
        asignacion={asignacion}
        turnos={turnosIdentificados()}
        onAccion={vi.fn()}
        jornadaCerrada
      />,
    )
    const tablaCerrada = screen.getByTestId('tabla-pacientes')
    expect(
      within(tablaCerrada)
        .getAllByRole('button')
        .every((boton) => boton.disabled),
    ).toBe(true)
  })

  it.each([1, 6, 25, 50])(
    'mantiene una región desplazable y accesible con %i pacientes',
    (cantidad) => {
      render(
        <TablaPacientesDoctor
          clinica={clinica}
          asignacion={asignacion}
          turnos={crearTurnos(cantidad)}
          onAccion={vi.fn()}
          onReintentar={vi.fn()}
          ahora={AHORA}
        />,
      )

      const region = screen.getByTestId('tabla-pacientes')
      expect(region).toHaveAttribute('role', 'region')
      expect(region).toHaveAttribute('tabindex', '0')
      expect(region).toHaveClass('scroll-pacientes')
      expect(region).toHaveClass('max-h-[60vh]')
      expect(region).toHaveClass('overflow-y-auto')
      expect(within(region).getAllByRole('row')).toHaveLength(cantidad + 1)
      expect(screen.getByTestId('cabecera-tabla-pacientes')).toHaveClass('sticky')

      const movil = screen.getByTestId('lista-pacientes-movil')
      expect(movil).toHaveAttribute('role', 'region')
      expect(movil).toHaveAttribute('tabindex', '0')
      expect(movil).toHaveClass('scroll-pacientes')
      expect(movil).toHaveClass('max-h-[60vh]')
      expect(movil).toHaveClass('overflow-y-auto')
    },
  )

  it('permite operar una fila del final de una lista larga', async () => {
    const usuario = userEvent.setup()
    const onAccion = vi.fn()
    render(
      <TablaPacientesDoctor
        clinica={clinica}
        asignacion={asignacion}
        turnos={crearTurnos(50, { soloUltimoElegible: true })}
        onAccion={onAccion}
        onReintentar={vi.fn()}
        ahora={AHORA}
      />,
    )

    const botones = within(screen.getByTestId('tabla-pacientes')).getAllByRole('button', {
      name: 'Llamar',
    })
    expect(botones).toHaveLength(1)

    await usuario.click(botones[0])
    expect(onAccion).toHaveBeenCalledWith(
      ACCION_LLAMAR,
      expect.objectContaining({ id: 5049, correlativo: 'MI-50' }),
    )
  })

  it('muestra el estado vacío', () => {
    renderTabla({ turnos: [] })

    expect(screen.getByText('No hay pacientes en cola')).toBeInTheDocument()
  })

  it('muestra error y permite reintentar', async () => {
    const usuario = userEvent.setup()
    const onReintentar = vi.fn()
    renderTabla({ turnos: [], error: new Error('Fallo de lectura'), onReintentar })

    expect(screen.getByText('Fallo de lectura')).toBeInTheDocument()
    await usuario.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(onReintentar).toHaveBeenCalledTimes(1)
  })

  it('muestra el estado de carga', () => {
    renderTabla({ cargando: true, turnos: [] })
    expect(screen.getByText('Cargando pacientes…')).toBeInTheDocument()
  })
})
