import client from '@/shared/api/client'

const desenvolver = (respuesta) => respuesta?.data ?? respuesta
const USE_MOCK = import.meta.env.MODE !== 'test' && import.meta.env.VITE_USE_MOCK === 'true'

export const PACIENTE_FICTICIO_RECETARIO = Object.freeze({
  id: '00000000-0000-0000-0000-000000000001',
  dpi: '0000000000001',
  nombres: 'Paciente',
  apellidos: 'Ficticio',
  fechaNacimiento: '1990-01-01',
  sexo: 'F',
  telefono: null,
  direccion: null,
  numeroExpediente: '30954',
  creadoEn: '2026-01-01T00:00:00Z',
})

export async function buscarPacienteRecetario(numeroExpediente) {
  const expediente = String(numeroExpediente ?? '').trim()

  if (!expediente) {
    throw new Error('El número de expediente es obligatorio.')
  }

  if (USE_MOCK) {
    return expediente === PACIENTE_FICTICIO_RECETARIO.numeroExpediente
      ? { ...PACIENTE_FICTICIO_RECETARIO }
      : null
  }

  try {
    const respuesta = await client.get(`/pacientes/expediente/${encodeURIComponent(expediente)}`)
    return desenvolver(respuesta)
  } catch (error) {
    const status = error?.status ?? error?.response?.status
    if (status === 404) return null
    throw error
  }
}
