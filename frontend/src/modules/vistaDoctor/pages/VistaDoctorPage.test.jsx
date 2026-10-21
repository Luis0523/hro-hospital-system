import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import VistaDoctorPage from './VistaDoctorPage.jsx'
import { obtenerJornadaCerrada } from '../api/doctorApi'
import { CLINICAS_MOCK, COLEGIADOS_DEMO } from '../api/mockData'

const CLINICA_1 = CLINICAS_MOCK[0]
const CLINICA_2 = CLINICAS_MOCK[1]
const CLINICA_SIN_ASIGNACION = CLINICAS_MOCK[2]

function renderPagina(ruta) {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <Routes>
        <Route path="/vista-doctor" element={<VistaDoctorPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

async function identificar(usuario, colegiado = COLEGIADOS_DEMO.validos[0]) {
  const input = await screen.findByRole('textbox', { name: /Número de colegiado/i })
  await usuario.type(input, colegiado)
  await usuario.click(screen.getByRole('button', { name: 'Continuar' }))
}

function tabla() {
  return screen.getByTestId('tabla-pacientes')
}

function fila(correlativo) {
  return within(tabla()).getByText(correlativo).closest('tr')
}

function valorMetrica(clave) {
  return screen.getByTestId(`valor-${clave}`).textContent
}

async function abrirFinJornada(usuario) {
  await usuario.click(screen.getByRole('button', { name: 'Fin de jornada' }))
  return screen.findByRole('dialog')
}

async function registrarExpediente(usuario, correlativo, expediente) {
  await usuario.click(
    within(fila(correlativo)).getByRole('button', { name: 'Registrar expediente' }),
  )
  const dialogo = await screen.findByRole('dialog')
  const campo = within(dialogo).getByRole('textbox', { name: /Número de expediente/i })
  await usuario.type(campo, expediente)
  await usuario.click(within(dialogo).getByRole('button', { name: 'Consultar expediente' }))
  await within(dialogo).findByText(new RegExp(`· ${expediente}`))
  await usuario.click(within(dialogo).getByRole('button', { name: 'Asociar expediente' }))
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
}

describe('VistaDoctorPage', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('informa cuando falta el QR de la clínica', async () => {
    renderPagina('/vista-doctor')

    expect(await screen.findByText('Abre el enlace de tu clínica')).toBeInTheDocument()
  })

  it('rechaza un QR mal formado', async () => {
    renderPagina('/vista-doctor?clinica=clinica-3')

    expect(await screen.findByText('El enlace de la clínica no es válido')).toBeInTheDocument()
  })

  it('rechaza un código corto de clínica desconocido', async () => {
    renderPagina('/vista-doctor?clinica=999-99')

    expect(await screen.findByText('Clínica no disponible')).toBeInTheDocument()
  })

  it('rechaza una clínica sin asignación para hoy', async () => {
    renderPagina(`/vista-doctor?clinica=${CLINICA_SIN_ASIGNACION.codigo}`)

    expect(await screen.findByText('Sin atención asignada para hoy')).toBeInTheDocument()
  })

  it('identifica al médico y oculta nombre y expediente inicialmente', async () => {
    const usuario = userEvent.setup()
    renderPagina(`/vista-doctor?clinica=${CLINICA_1.codigo}`)

    expect(await screen.findByRole('heading', { name: '¿Quién está ahí?' })).toBeInTheDocument()
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()

    await identificar(usuario)

    expect(await screen.findByText('Dra. Ana Lucía Demo')).toBeInTheDocument()
    const tablaDoctor = tabla()
    expect(within(tablaDoctor).getByText('MI-1')).toBeInTheDocument()
    expect(within(tablaDoctor).getAllByText('Pendiente de identificar').length).toBeGreaterThan(0)
    expect(within(tablaDoctor).getAllByText('Sin registrar').length).toBeGreaterThan(0)
    expect(within(tablaDoctor).queryByText('Rosa María Demo')).not.toBeInTheDocument()
    expect(within(tablaDoctor).queryByText('0000000001')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Cambiar médico/i })).not.toBeInTheDocument()
    expect(valorMetrica('pendientes')).toBe('1')
    expect(valorMetrica('enEspera')).toBe('4')
    expect(valorMetrica('atendidos')).toBe('1')
  })

  it('restaura la identidad al recargar la pestaña', async () => {
    const usuario = userEvent.setup()
    const { unmount } = renderPagina(`/vista-doctor?clinica=${CLINICA_1.codigo}`)

    await identificar(usuario)
    expect(await screen.findByText('Dra. Ana Lucía Demo')).toBeInTheDocument()

    unmount()
    renderPagina(`/vista-doctor?clinica=${CLINICA_1.codigo}`)

    expect(await screen.findByText('Dra. Ana Lucía Demo')).toBeInTheDocument()
    expect(screen.queryByText('¿Quién está ahí?')).not.toBeInTheDocument()
  })

  it('no reutiliza la sesión al cambiar de clínica', async () => {
    const usuario = userEvent.setup()
    const { unmount } = renderPagina(`/vista-doctor?clinica=${CLINICA_1.codigo}`)

    await identificar(usuario)
    expect(await screen.findByTestId('tabla-pacientes')).toBeInTheDocument()

    unmount()
    renderPagina(`/vista-doctor?clinica=${CLINICA_2.codigo}`)

    expect(await screen.findByRole('heading', { name: '¿Quién está ahí?' })).toBeInTheDocument()
    expect(screen.getByText(/Clínica 5 · Consulta Externa/)).toBeInTheDocument()

    await identificar(usuario, COLEGIADOS_DEMO.validos[1])
    const tablaClinica2 = await screen.findByTestId('tabla-pacientes')

    expect(within(tablaClinica2).getByText('REUMA-1')).toBeInTheDocument()
    expect(within(tablaClinica2).queryByText('MI-1')).not.toBeInTheDocument()
  })

  it('no filtra la lista de pacientes por médico', async () => {
    const usuario = userEvent.setup()
    const { unmount } = renderPagina(`/vista-doctor?clinica=${CLINICA_1.codigo}`)

    await identificar(usuario, COLEGIADOS_DEMO.validos[0])
    const filasPrimerMedico = within(tabla()).getAllByRole('row').length
    expect(within(tabla()).getByText('MI-1')).toBeInTheDocument()

    unmount()
    sessionStorage.clear()
    renderPagina(`/vista-doctor?clinica=${CLINICA_1.codigo}`)

    await identificar(usuario, COLEGIADOS_DEMO.validos[1])
    expect(within(tabla()).getAllByRole('row').length).toBe(filasPrimerMedico)
    expect(within(tabla()).getByText('MI-1')).toBeInTheDocument()
  })

  it('muestra el estado vacío de la clínica', async () => {
    const usuario = userEvent.setup()
    renderPagina(`/vista-doctor?clinica=${CLINICA_1.codigo}&escenario=vacio`)

    await identificar(usuario)

    expect(await screen.findByText('No hay pacientes en cola')).toBeInTheDocument()
  })

  it('muestra error de lectura y permite reintentar', async () => {
    const usuario = userEvent.setup()
    renderPagina(`/vista-doctor?clinica=${CLINICA_1.codigo}&escenario=error`)

    await identificar(usuario)

    expect(await screen.findByText('No se pudo cargar la cola de pacientes')).toBeInTheDocument()
    await usuario.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByText('No se pudo cargar la cola de pacientes')).toBeInTheDocument()
  })

  it('llama, aplica cooldown y libera mediante no respondió', async () => {
    const usuario = userEvent.setup()
    renderPagina(`/vista-doctor?clinica=${CLINICA_1.codigo}`)
    await identificar(usuario)
    await screen.findByTestId('tabla-pacientes')

    await usuario.click(within(fila('MI-1')).getByRole('button', { name: 'Llamar' }))
    await waitFor(() => {
      expect(
        within(fila('MI-1')).getByRole('button', { name: /^Rellamar en \d+ s$/ }),
      ).toBeDisabled()
    })
    expect(valorMetrica('pendientes')).toBe('2')
    expect(valorMetrica('enEspera')).toBe('3')
    expect(within(fila('MI-2')).getByText(/Espere a finalizar el turno MI-1/)).toBeInTheDocument()

    await usuario.click(within(fila('MI-1')).getByRole('button', { name: 'No respondió' }))
    await waitFor(() => {
      expect(within(fila('MI-1')).getByText('No respondió')).toBeInTheDocument()
    })
    expect(valorMetrica('pendientes')).toBe('2')
  })

  it('exige expediente validado para atender y usa el expediente en la atención', async () => {
    const usuario = userEvent.setup()
    renderPagina(`/vista-doctor?clinica=${CLINICA_1.codigo}`)
    await identificar(usuario)
    await screen.findByTestId('tabla-pacientes')

    await usuario.click(within(fila('MI-1')).getByRole('button', { name: 'Llamar' }))
    await waitFor(() => {
      expect(
        within(fila('MI-1')).getByRole('button', { name: /^Rellamar en \d+ s$/ }),
      ).toBeInTheDocument()
    })

    const atendioBloqueado = within(fila('MI-1')).getByRole('button', { name: 'Atendió' })
    expect(atendioBloqueado).toBeDisabled()
    expect(
      within(fila('MI-1')).getByText(/Registre el expediente para poder atender/),
    ).toBeInTheDocument()

    await usuario.click(within(fila('MI-1')).getByRole('button', { name: 'Registrar expediente' }))
    const dialogo = await screen.findByRole('dialog')
    const campo = within(dialogo).getByRole('textbox', { name: /Número de expediente/i })
    await usuario.type(campo, '0000000001')
    await usuario.click(within(dialogo).getByRole('button', { name: 'Consultar expediente' }))
    await within(dialogo).findByText(/Rosa María Demo · 0000000001/)
    await usuario.click(within(dialogo).getByRole('button', { name: 'Asociar expediente' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

    await usuario.click(within(fila('MI-1')).getByRole('button', { name: 'Atendió' }))
    await waitFor(() => {
      expect(within(fila('MI-1')).getByText('Atendido')).toBeInTheDocument()
    })
    expect(valorMetrica('atendidos')).toBe('2')
    expect(valorMetrica('pendientes')).toBe('1')
  })

  it('registra el expediente del turno correcto y lo conserva al recargar', async () => {
    const usuario = userEvent.setup()
    const { unmount } = renderPagina(`/vista-doctor?clinica=${CLINICA_1.codigo}`)
    await identificar(usuario)
    await screen.findByTestId('tabla-pacientes')

    await registrarExpediente(usuario, 'MI-6', '0000000006')

    expect(within(fila('MI-6')).getByText('Carlos Eduardo Demo')).toBeInTheDocument()
    expect(within(fila('MI-6')).getByText('0000000006')).toBeInTheDocument()
    expect(screen.getByText('Expediente registrado en esta demostración.')).toBeInTheDocument()

    unmount()
    renderPagina(`/vista-doctor?clinica=${CLINICA_1.codigo}`)
    await screen.findByTestId('tabla-pacientes')

    expect(await within(fila('MI-6')).findByText('0000000006')).toBeInTheDocument()
    expect(within(fila('MI-6')).getByText('Carlos Eduardo Demo')).toBeInTheDocument()
  })

  it('bloquea el expediente de otro paciente sin modificar el turno', async () => {
    const usuario = userEvent.setup()
    renderPagina(`/vista-doctor?clinica=${CLINICA_1.codigo}`)
    await identificar(usuario)
    await screen.findByTestId('tabla-pacientes')

    await usuario.click(within(fila('MI-1')).getByRole('button', { name: 'Registrar expediente' }))

    const dialogoExpediente = await screen.findByRole('dialog')
    const campo = within(dialogoExpediente).getByRole('textbox', {
      name: /Número de expediente/i,
    })
    await usuario.type(campo, '0000000999')
    await usuario.click(
      within(dialogoExpediente).getByRole('button', { name: 'Consultar expediente' }),
    )

    expect(
      await within(dialogoExpediente).findByText(/El expediente pertenece a otro paciente/),
    ).toBeInTheDocument()
    expect(
      within(dialogoExpediente).getByRole('button', { name: 'Asociar expediente' }),
    ).toBeDisabled()

    await usuario.click(within(dialogoExpediente).getByRole('button', { name: 'Cancelar' }))
    expect(within(fila('MI-1')).getByText('Pendiente de identificar')).toBeInTheDocument()
  })

  it('cancela el primer paso de fin de jornada', async () => {
    const usuario = userEvent.setup()
    renderPagina(`/vista-doctor?clinica=${CLINICA_1.codigo}`)
    await identificar(usuario)
    await screen.findByTestId('tabla-pacientes')

    const dialogo = await abrirFinJornada(usuario)
    expect(within(dialogo).getByText('Finalizar jornada')).toBeInTheDocument()
    await usuario.click(within(dialogo).getByRole('button', { name: 'Cancelar' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(screen.getByText('Dra. Ana Lucía Demo')).toBeInTheDocument()
  })

  it('permite volver desde el segundo paso y cancelar', async () => {
    const usuario = userEvent.setup()
    renderPagina(`/vista-doctor?clinica=${CLINICA_1.codigo}`)
    await identificar(usuario)
    await screen.findByTestId('tabla-pacientes')

    const dialogo = await abrirFinJornada(usuario)
    await usuario.click(within(dialogo).getByRole('button', { name: 'Continuar' }))
    expect(
      within(dialogo).getByText('¿Confirma que desea finalizar su jornada y cerrar sesión?'),
    ).toBeInTheDocument()

    await usuario.click(within(dialogo).getByRole('button', { name: 'Volver' }))
    expect(within(dialogo).getByText('Finalizar jornada')).toBeInTheDocument()
    await usuario.click(within(dialogo).getByRole('button', { name: 'Cancelar' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('cierra la jornada con doble confirmación y permite reabrirla', async () => {
    const usuario = userEvent.setup()
    renderPagina(`/vista-doctor?clinica=${CLINICA_1.codigo}`)
    await identificar(usuario)
    await screen.findByTestId('tabla-pacientes')

    const dialogo = await abrirFinJornada(usuario)
    await usuario.click(within(dialogo).getByRole('button', { name: 'Continuar' }))
    await usuario.click(
      within(dialogo).getByRole('button', { name: 'Finalizar jornada y cerrar sesión' }),
    )

    expect(await screen.findByRole('heading', { name: '¿Quién está ahí?' })).toBeInTheDocument()
    expect(sessionStorage.getItem('hro_doctor')).toBeNull()
    expect(obtenerJornadaCerrada()).not.toBeNull()

    await identificar(usuario, '1001')

    const reapertura = await screen.findByRole('dialog')
    expect(within(reapertura).getByText('Jornada cerrada')).toBeInTheDocument()
    await usuario.click(within(reapertura).getByRole('button', { name: 'Reabrir jornada' }))

    expect(await screen.findByText('Dra. Ana Lucía Demo')).toBeInTheDocument()
    expect(await screen.findByTestId('tabla-pacientes')).toBeInTheDocument()
    expect(obtenerJornadaCerrada()).toBeNull()
  })

  it('no permite que otro médico reabra automáticamente la jornada anterior', async () => {
    const usuario = userEvent.setup()
    const { unmount } = renderPagina(`/vista-doctor?clinica=${CLINICA_1.codigo}`)
    await identificar(usuario, '1001')
    await screen.findByTestId('tabla-pacientes')

    const dialogo = await abrirFinJornada(usuario)
    await usuario.click(within(dialogo).getByRole('button', { name: 'Continuar' }))
    await usuario.click(
      within(dialogo).getByRole('button', { name: 'Finalizar jornada y cerrar sesión' }),
    )
    await screen.findByRole('heading', { name: '¿Quién está ahí?' })
    unmount()

    renderPagina(`/vista-doctor?clinica=${CLINICA_1.codigo}`)
    await identificar(usuario, '1002')

    expect(await screen.findByText('Dr. Bruno Estuardo Demo')).toBeInTheDocument()
    expect(screen.queryByText('Jornada cerrada')).not.toBeInTheDocument()
    expect(await screen.findByTestId('tabla-pacientes')).toBeInTheDocument()
  })
})
