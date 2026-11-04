import { buscarPacientePorExpediente } from '@/modules/libroCitas/api/libroCitasApi'

/**
 * Consulta el API del hospital por número de expediente, igual que el resto
 * del sistema. Devuelve `null` cuando el expediente no existe.
 */
export async function buscarPacienteRecetario(numeroExpediente) {
  const expediente = String(numeroExpediente ?? '').trim()

  if (!expediente) {
    throw new Error('El número de expediente es obligatorio.')
  }

  const encontrado = await buscarPacientePorExpediente(expediente)
  if (!encontrado) return null

  return {
    numeroExpediente: encontrado.numeroExpediente,
    nombreCompleto: encontrado.nombre,
    nombres: encontrado.nombre,
    apellidos: '',
  }
}
