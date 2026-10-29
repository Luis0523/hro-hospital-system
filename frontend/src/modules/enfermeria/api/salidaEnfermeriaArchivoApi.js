import client from '@/shared/api/client'
import { construirPdfSimple } from '@/modules/archivo/utils/pdfMock'
import { formatearExpediente } from '@/shared/utils/expediente'

const USE_MOCK = import.meta.env.MODE === 'test' || import.meta.env.VITE_USE_MOCK !== 'false'
const desenvolver = (respuesta) => respuesta?.data ?? respuesta

const ETIQUETAS = {
  normal: 'Normal',
  privado_libertad: 'Privado de libertad',
  personal: 'Personal',
  presentacion: 'Presentación',
}

let salidasMock = []

export async function listarSalidasEnfermeriaArchivo({ fecha, estacionId } = {}) {
  if (USE_MOCK) {
    return salidasMock
      .filter((s) => s.fecha === fecha && String(s.estacionId) === String(estacionId))
      .map((s) => ({ ...s }))
  }
  return desenvolver(
    await client.get('/salidas-enfermeria-archivo', { params: { fecha, estacionId } }),
  )
}

export async function registrarSalidaEnfermeriaArchivo({
  numeroExpediente,
  estacionId,
  fecha,
  tipo = 'normal',
  primeraVez = false,
  clinicaPersonalId = null,
  pacienteNombre,
} = {}) {
  if (USE_MOCK) {
    const numero = String(numeroExpediente ?? '').trim()
    if (!numero) throw new Error('El número de expediente es obligatorio')
    if (
      salidasMock.some(
        (s) =>
          s.fecha === fecha &&
          String(s.estacionId) === String(estacionId) &&
          s.numeroExpediente === numero,
      )
    ) {
      const error = new Error(
        'El expediente ya fue registrado como salida de enfermería a archivo.',
      )
      error.status = 409
      throw error
    }
    const nueva = {
      id: `sea-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
      fecha,
      estacionId,
      numeroExpediente: numero,
      pacienteNombre: String(pacienteNombre ?? '').trim() || 'Paciente de prueba',
      tipo,
      primeraVez,
      clinicaPersonalId,
      clinicaPersonalNombre: clinicaPersonalId ? `Clínica ${clinicaPersonalId}` : null,
      registradoPor: 'Enfermería',
      registradoEn: new Date().toISOString(),
    }
    salidasMock = [nueva, ...salidasMock]
    return nueva
  }
  return desenvolver(
    await client.post('/salidas-enfermeria-archivo', {
      numeroExpediente,
      estacionId,
      fecha,
      tipo,
      primeraVez,
      clinicaPersonalId,
    }),
  )
}

export async function actualizarSalidaEnfermeriaArchivo(id, datos = {}) {
  if (USE_MOCK) {
    const indice = salidasMock.findIndex((salida) => salida.id === id)
    if (indice < 0) {
      const error = new Error('Salida no encontrada')
      error.status = 404
      throw error
    }
    const actual = salidasMock[indice]
    const numero = String(datos.numeroExpediente ?? actual.numeroExpediente).trim()
    if (!numero) throw new Error('El número de expediente es obligatorio')
    if (
      salidasMock.some(
        (salida) =>
          salida.id !== id &&
          salida.fecha === actual.fecha &&
          String(salida.estacionId) === String(actual.estacionId) &&
          salida.numeroExpediente === numero,
      )
    ) {
      const error = new Error(
        'El expediente ya fue registrado como salida de enfermería a archivo.',
      )
      error.status = 409
      throw error
    }
    const tipo = datos.tipo ?? actual.tipo ?? 'normal'
    if (tipo === 'personal' && !datos.clinicaPersonalId) {
      throw new Error('Seleccione la clínica para el expediente de tipo Personal.')
    }
    const nombreManual = String(datos.pacienteNombre ?? '').trim()
    const nueva = {
      ...actual,
      numeroExpediente: numero,
      pacienteNombre: nombreManual || actual.pacienteNombre,
      tipo,
      primeraVez: Boolean(datos.primeraVez),
      clinicaPersonalId: tipo === 'personal' ? datos.clinicaPersonalId : null,
      clinicaPersonalNombre:
        tipo === 'personal' && datos.clinicaPersonalId
          ? `Clínica ${datos.clinicaPersonalId}`
          : null,
    }
    salidasMock[indice] = nueva
    return { ...nueva }
  }
  return desenvolver(await client.put(`/salidas-enfermeria-archivo/${id}`, datos))
}

export async function eliminarSalidaEnfermeriaArchivo(id) {
  if (USE_MOCK) {
    const indice = salidasMock.findIndex((salida) => salida.id === id)
    if (indice < 0) {
      const error = new Error('Salida no encontrada')
      error.status = 404
      throw error
    }
    salidasMock.splice(indice, 1)
    return { id }
  }
  return desenvolver(await client.delete(`/salidas-enfermeria-archivo/${id}`))
}

export async function descargarSalidasEnfermeriaArchivoPdf({ fecha, estacionId } = {}) {
  if (USE_MOCK) {
    const filas = salidasMock
      .filter((s) => s.fecha === fecha && String(s.estacionId) === String(estacionId))
      .sort((a, b) => new Date(a.registradoEn) - new Date(b.registradoEn))
    return construirPdfSimple([
      'HOSPITAL REGIONAL DE OCCIDENTE',
      'CONTROL DE SALIDA DE ENFERMERÍA A ARCHIVO',
      `Fecha: ${fecha ?? ''}`,
      ...filas.map(
        (s, indice) =>
          `${indice + 1}. ${formatearExpediente(s.numeroExpediente)} · ${s.pacienteNombre} · ${ETIQUETAS[s.tipo] ?? 'Normal'} · Primera vez: ${s.primeraVez ? 'Sí' : 'No'}`,
      ),
    ])
  }
  return client.get('/salidas-enfermeria-archivo/pdf', {
    params: { fecha, estacionId },
    responseType: 'blob',
  })
}

export function reiniciarSalidasEnfermeriaArchivoMock() {
  salidasMock = []
}
