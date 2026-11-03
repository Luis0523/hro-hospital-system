import { hoyIsoGuatemala } from '../utils/fechaDepuracionGuatemala'
import { partesFecha, sumarDias } from '../utils/periodoDepuracion'

export const expedientesDepuracionMock = [
  {
    id: 101,
    pacienteNombre: 'Paciente Ficticio Uno',
    numeroExpediente: '927581',
  },
  {
    id: 102,
    pacienteNombre: 'Paciente Ficticio Dos',
    numeroExpediente: '30954',
  },
  {
    id: 103,
    pacienteNombre: 'Paciente Ficticio Tres',
    numeroExpediente: '881203',
  },
  {
    id: 104,
    pacienteNombre: 'Paciente Ficticio Cuatro',
    numeroExpediente: '001234',
  },
  {
    id: 105,
    pacienteNombre: 'Paciente Ficticio Cinco',
    numeroExpediente: '1234567',
  },
]

const NOMBRE_LARGO =
  'María Fernanda López García de la Cruz con un nombre ficticio extremadamente largo'
const MOTIVO_LARGO =
  'Expediente ficticio extraviado tras revisión completa de estantería, bodega y archivo alterno'

function primerDiaMesAnterior(hoy) {
  const { anio, mes } = partesFecha(hoy)
  if (mes === 1) return `${anio - 1}-12-01`
  return `${anio}-${String(mes - 1).padStart(2, '0')}-01`
}

function definicionesHistoricas(hoy) {
  const { anio } = partesFecha(hoy)
  const primerDiaMesPrevio = primerDiaMesAnterior(hoy)
  const ultimoDiaMesPrevio = sumarDias(`${anio}-${partesFecha(hoy).mes}-01`, -1)

  return [
    {
      fecha: sumarDias(hoy, -1),
      numeroExpediente: '450101',
      pacienteNombre: 'Ayer Ficticio',
      usuarioNombre: 'Archivo Central',
      motivo: 'Baja simulada de ayer',
    },
    {
      fecha: sumarDias(hoy, -2),
      numeroExpediente: '001235',
      pacienteNombre: 'Cero Inicial Ficticio',
      usuarioNombre: 'Ana López',
      motivo: null,
    },
    {
      fecha: sumarDias(hoy, -3),
      numeroExpediente: '77009',
      pacienteNombre: 'Semana Ficticia',
      usuarioNombre: 'Luis Barrios',
      motivo: 'Fusión ficticia de expedientes',
    },
    {
      fecha: sumarDias(hoy, -8),
      numeroExpediente: '620014',
      pacienteNombre: 'Semana Anterior Ficticia',
      usuarioNombre: 'Archivo Central',
      motivo: MOTIVO_LARGO,
    },
    {
      fecha: sumarDias(hoy, -9),
      numeroExpediente: '730015',
      pacienteNombre: NOMBRE_LARGO,
      usuarioNombre: 'María de la Cruz',
      motivo: null,
    },
    {
      fecha: primerDiaMesPrevio,
      numeroExpediente: '840016',
      pacienteNombre: 'Inicio Mes Anterior Ficticio',
      usuarioNombre: 'Archivo Central',
      motivo: 'Registro ficticio de límite de mes',
    },
    {
      fecha: ultimoDiaMesPrevio,
      numeroExpediente: '950017',
      pacienteNombre: 'Fin Mes Anterior Ficticio',
      usuarioNombre: 'Carlos Méndez',
      motivo: 'Registro ficticio de fin de mes',
    },
    {
      fecha: `${anio - 1}-12-31`,
      numeroExpediente: '110018',
      pacienteNombre: 'Fin Año Anterior Ficticio',
      usuarioNombre: 'Archivo Central',
      motivo: 'Registro ficticio de límite de año',
    },
    {
      fecha: `${anio}-01-01`,
      numeroExpediente: '220019',
      pacienteNombre: 'Inicio Año Ficticio',
      usuarioNombre: 'Archivo Central',
      motivo: 'Registro ficticio de inicio de año',
    },
    {
      fecha: sumarDias(hoy, -31),
      numeroExpediente: '330020',
      pacienteNombre: 'Treinta Y Un Días Ficticio',
      usuarioNombre: 'Ana López',
      motivo: 'Registro ficticio de límite de rango',
    },
    {
      fecha: sumarDias(hoy, -40),
      numeroExpediente: '440021',
      pacienteNombre: 'Cuarenta Días Ficticio',
      usuarioNombre: 'Luis Barrios',
      motivo: null,
    },
    {
      fecha: sumarDias(hoy, -365),
      numeroExpediente: '550022',
      pacienteNombre: 'Año Anterior Ficticio',
      usuarioNombre: 'Archivo Central',
      motivo: 'Registro ficticio de año anterior',
    },
  ].filter((definicion) => definicion.fecha && definicion.fecha < hoy)
}

export function crearHistoricoDepuracionMock(hoy = hoyIsoGuatemala()) {
  const definiciones = definicionesHistoricas(hoy)
  const expedientes = []
  const depuraciones = []

  definiciones.forEach((definicion, indice) => {
    const id = 201 + indice
    const hora = String(8 + ((indice * 3) % 9)).padStart(2, '0')
    const minuto = String((indice * 7) % 60).padStart(2, '0')
    const expedienteId = `10000000-0000-4000-8000-${String(id).padStart(12, '0')}`

    expedientes.push({
      id,
      pacienteNombre: definicion.pacienteNombre,
      numeroExpediente: definicion.numeroExpediente,
    })

    depuraciones.push({
      id: `hist-${indice + 1}`,
      expedienteId,
      numeroExpediente: definicion.numeroExpediente,
      pacienteNombre: definicion.pacienteNombre,
      motivo: definicion.motivo,
      usuarioNombre: definicion.usuarioNombre,
      depuradoEn: `${definicion.fecha}T${hora}:${minuto}:00-06:00`,
      fecha: definicion.fecha,
    })
  })

  return { expedientes, depuraciones }
}
