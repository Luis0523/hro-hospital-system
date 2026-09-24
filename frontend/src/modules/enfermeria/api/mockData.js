import { hoyIso } from '@/shared/utils/fecha'

export const clinicasMock = [
  { id: 1, nombre: 'Clínica 01 - Medicina General', cupos: 42 },
  { id: 2, nombre: 'Clínica 02 - Pediatría', cupos: 18 },
  { id: 4, nombre: 'Clínica 04 - Cardiología', cupos: 11 },
  { id: 7, nombre: 'Clínica 07 - Traumatología', cupos: 0 },
  { id: 9, nombre: 'Clínica 09 - Ginecología', cupos: 0 },
]

export const estacionesMock = [
  {
    id: 'box-04',
    terminal: 'BOX-04 Triage',
    clinicaId: 1,
    clinicaNombre: 'Clínica 101 - Medicina General',
    ubicacion: 'Edificio Consulta Externa, Nivel 1',
    estado: 'disponible',
  },
  {
    id: 'box-05',
    terminal: 'BOX-05 Pediatría',
    clinicaId: 2,
    clinicaNombre: 'Clínica 102 - Pediatría',
    ubicacion: 'Edificio Consulta Externa, Nivel 1',
    estado: 'disponible',
  },
  {
    id: 'box-06',
    terminal: 'BOX-06 Cardiología',
    clinicaId: 4,
    clinicaNombre: 'Clínica 104 - Cardiología',
    ubicacion: 'Edificio Consulta Externa, Nivel 2',
    estado: 'ocupada',
  },
  {
    id: 'box-07',
    terminal: 'BOX-07 Traumatología',
    clinicaId: 7,
    clinicaNombre: 'Clínica 107 - Traumatología',
    ubicacion: 'Edificio Consulta Externa, Nivel 2',
    estado: 'disponible',
  },
]

export const pacientesMock = [
  {
    id: 1,
    dpi: '2456789010101',
    nombres: 'María Fernanda',
    apellidos: 'López García',
    fechaNacimiento: '1989-04-12',
    sexo: 'F',
    telefono: '5555-1234',
    direccion: 'Zona 3, Quetzaltenango',
    numeroExpediente: 'EXP-004521',
    creadoEn: '2026-08-01T09:15:00-06:00',
  },
  {
    id: 2,
    dpi: '1899234560101',
    nombres: 'Carlos Eduardo',
    apellidos: 'Ramírez Soto',
    fechaNacimiento: '1975-11-30',
    sexo: 'M',
    telefono: '5555-9087',
    direccion: 'Zona 1, Quetzaltenango',
    numeroExpediente: 'EXP-003118',
    creadoEn: '2026-07-22T11:40:00-06:00',
  },
  {
    id: 3,
    dpi: '3012456780101',
    nombres: 'Ana Lucía',
    apellidos: 'Pérez Morales',
    fechaNacimiento: '2001-06-18',
    sexo: 'F',
    telefono: '5555-4412',
    direccion: 'Olintepeque',
    numeroExpediente: 'EXP-005902',
    creadoEn: '2026-09-02T08:05:00-06:00',
  },
]

function fechaRelativa(offsetDias) {
  const fecha = new Date()
  fecha.setDate(fecha.getDate() + offsetDias)
  const anio = fecha.getFullYear()
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')
  return `${anio}-${mes}-${dia}`
}

export const citasMock = [
  {
    id: 101,
    pacienteId: 1,
    pacienteNombreCompleto: 'María Fernanda López García',
    pacienteDpi: '2456789010101',
    pacienteExpediente: 'EXP-004521',
    cupoDiarioId: 55,
    fechaCita: fechaRelativa(0),
    clinicaId: 1,
    clinicaNombre: 'Clínica 01 - Medicina General',
    medicoNombre: 'Dr. Jorge Castillo',
    horaEstimada: '10:20:00',
    horaVentanaInicio: '10:00:00',
    horaVentanaFin: '10:20:00',
    estado: 'pendiente',
    citaOrigenId: null,
    version: 1,
  },
  {
    id: 102,
    pacienteId: 2,
    pacienteNombreCompleto: 'Carlos Eduardo Ramírez Soto',
    pacienteDpi: '1899234560101',
    pacienteExpediente: 'EXP-003118',
    cupoDiarioId: 56,
    fechaCita: fechaRelativa(0),
    clinicaId: 4,
    clinicaNombre: 'Clínica 04 - Cardiología',
    medicoNombre: 'Dra. Sofía Reyes',
    horaEstimada: null,
    horaVentanaInicio: null,
    horaVentanaFin: null,
    estado: 'pendiente',
    citaOrigenId: null,
    version: 1,
  },
  {
    id: 103,
    pacienteId: 3,
    pacienteNombreCompleto: 'Ana Lucía Pérez Morales',
    pacienteDpi: '3012456780101',
    pacienteExpediente: 'EXP-005902',
    cupoDiarioId: 57,
    fechaCita: fechaRelativa(1),
    clinicaId: 2,
    clinicaNombre: 'Clínica 02 - Pediatría',
    medicoNombre: 'Dr. Manuel Ortiz',
    horaEstimada: '08:40:00',
    horaVentanaInicio: '08:20:00',
    horaVentanaFin: '08:40:00',
    estado: 'pendiente',
    citaOrigenId: null,
    version: 1,
  },
]

function horaRelativa(minutosAtras) {
  const fecha = new Date()
  fecha.setMinutes(fecha.getMinutes() - minutosAtras)
  return fecha.toISOString()
}

export const turnosMock = [
  {
    id: 9001,
    citaId: null,
    numeroTurno: 40,
    estado: 'atendido',
    clinicaId: 1,
    clinicaNombre: 'Clínica 01 - Medicina General',
    medicoNombre: 'Dr. Jorge Castillo',
    pacienteNombre: 'José Miguel Ajpacajá',
    horaGenerado: horaRelativa(70),
    horaLlamado: horaRelativa(55),
  },
  {
    id: 9002,
    citaId: null,
    numeroTurno: 41,
    estado: 'no_responde',
    clinicaId: 1,
    clinicaNombre: 'Clínica 01 - Medicina General',
    medicoNombre: 'Dr. Jorge Castillo',
    pacienteNombre: 'Rosa Elena Chávez',
    horaGenerado: horaRelativa(50),
    horaLlamado: horaRelativa(35),
  },
  {
    id: 9003,
    citaId: null,
    numeroTurno: 42,
    estado: 'llamado',
    clinicaId: 1,
    clinicaNombre: 'Clínica 01 - Medicina General',
    medicoNombre: 'Dr. Jorge Castillo',
    pacienteNombre: 'Carlos M. Mendoza',
    horaGenerado: horaRelativa(30),
    horaLlamado: horaRelativa(2),
  },
  {
    id: 9004,
    citaId: null,
    numeroTurno: 43,
    estado: 'en_espera',
    clinicaId: 1,
    clinicaNombre: 'Clínica 01 - Medicina General',
    medicoNombre: 'Dr. Jorge Castillo',
    pacienteNombre: 'Ana Lucía Pérez Morales',
    horaGenerado: horaRelativa(12),
  },
  {
    id: 9005,
    citaId: null,
    numeroTurno: 44,
    estado: 'en_espera',
    clinicaId: 1,
    clinicaNombre: 'Clínica 01 - Medicina General',
    medicoNombre: 'Dr. Jorge Castillo',
    pacienteNombre: 'Byron Estuardo Ixcoy',
    horaGenerado: horaRelativa(5),
  },
]

export const tableroMock = { activo: true, turnoActual: 42 }

export function disponibilidadMock(fechaInicio, fechaFin, cantidadClinicas = 1) {
  const inicio = new Date(`${fechaInicio}T00:00:00`)
  const fin = new Date(`${fechaFin}T00:00:00`)
  const dias = []
  const factor = Math.max(1, cantidadClinicas)

  for (const fecha = new Date(inicio); fecha <= fin; fecha.setDate(fecha.getDate() + 1)) {
    const iso = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(
      fecha.getDate(),
    ).padStart(2, '0')}`
    const diaSemana = fecha.getDay()
    const noLaborable = diaSemana === 0
    const capacidadBase = 6 + ((fecha.getDate() * 5) % 16)
    const sinCupo = !noLaborable && fecha.getDate() % 7 === 0
    const cuposDisponibles = noLaborable ? 0 : sinCupo ? 0 : capacidadBase * factor

    dias.push({
      fecha: iso,
      capacidadMaxima: (capacidadBase + 6) * factor,
      cuposDisponibles,
      disponible: !noLaborable && !sinCupo && cuposDisponibles > 0,
      noLaborable,
    })
  }

  return dias
}

export const citaHoyMock = (pacienteId) =>
  citasMock.find((cita) => cita.pacienteId === pacienteId && cita.fechaCita === hoyIso()) ?? null

const OFERTA_CUPOS = [
  {
    clinicaId: 1,
    clinicaNombre: 'Clínica 01 - Medicina General',
    medicoId: 5,
    medicoNombre: 'Dr. Jorge Castillo',
    horaInicio: '07:00:00',
    horaFin: '12:00:00',
    capacidadMaxima: 20,
  },
  {
    clinicaId: 2,
    clinicaNombre: 'Clínica 02 - Pediatría',
    medicoId: 6,
    medicoNombre: 'Dra. Sofía Reyes',
    horaInicio: '08:00:00',
    horaFin: '13:00:00',
    capacidadMaxima: 18,
  },
  {
    clinicaId: 4,
    clinicaNombre: 'Clínica 04 - Cardiología',
    medicoId: 7,
    medicoNombre: 'Dr. Manuel Ortiz',
    horaInicio: '07:00:00',
    horaFin: '11:00:00',
    capacidadMaxima: 12,
  },
  {
    clinicaId: 7,
    clinicaNombre: 'Clínica 07 - Traumatología',
    medicoId: 8,
    medicoNombre: 'Dra. Ana Gómez',
    horaInicio: '09:00:00',
    horaFin: '14:00:00',
    capacidadMaxima: 10,
  },
  {
    clinicaId: 9,
    clinicaNombre: 'Clínica 09 - Ginecología',
    medicoId: 9,
    medicoNombre: 'Dra. Lucía Méndez',
    horaInicio: '08:00:00',
    horaFin: '12:00:00',
    capacidadMaxima: 12,
  },
]

const cuposReservados = new Map()

export function reservarCupoMock(cupoId) {
  const extra = (cuposReservados.get(cupoId) ?? 0) + 1
  cuposReservados.set(cupoId, extra)
  return extra
}

export function cuposDiaMock(fecha, clinicaIds = []) {
  const filtro = clinicaIds.length > 0 ? clinicaIds : OFERTA_CUPOS.map((oferta) => oferta.clinicaId)
  const dia = Number(fecha.slice(8, 10))

  return OFERTA_CUPOS.filter((oferta) => filtro.includes(oferta.clinicaId)).map((oferta) => {
    const id = oferta.clinicaId * 1000 + dia
    const base = (dia * (oferta.clinicaId + 3)) % (oferta.capacidadMaxima + 1)
    const ocupados = Math.min(oferta.capacidadMaxima, base + (cuposReservados.get(id) ?? 0))
    const disponibles = Math.max(0, oferta.capacidadMaxima - ocupados)

    return {
      id,
      medicoClinicaId: oferta.clinicaId * 10 + oferta.medicoId,
      medicoId: oferta.medicoId,
      medicoNombre: oferta.medicoNombre,
      clinicaId: oferta.clinicaId,
      clinicaNombre: oferta.clinicaNombre,
      fecha,
      horaInicio: oferta.horaInicio,
      horaFin: oferta.horaFin,
      capacidadMaxima: oferta.capacidadMaxima,
      cuposOcupados: ocupados,
      cuposDisponibles: disponibles,
      disponible: disponibles > 0,
    }
  })
}

function sumarMinutos(hora, minutos) {
  const [horas, mins] = hora.split(':').map(Number)
  const total = (horas * 60 + mins + minutos + 1440) % 1440
  const hh = String(Math.floor(total / 60)).padStart(2, '0')
  const mm = String(total % 60).padStart(2, '0')
  return `${hh}:${mm}:00`
}

export function construirCitaMock({ id, paciente, cupo }) {
  const horaEstimada = sumarMinutos(cupo.horaInicio, cupo.cuposOcupados * 20)

  return {
    id,
    pacienteId: paciente.id,
    pacienteNombreCompleto: `${paciente.nombres} ${paciente.apellidos}`,
    pacienteDpi: paciente.dpi,
    pacienteExpediente: paciente.numeroExpediente,
    cupoDiarioId: cupo.id,
    fechaCita: cupo.fecha,
    clinicaNombre: cupo.clinicaNombre,
    medicoNombre: cupo.medicoNombre,
    horaEstimada,
    horaVentanaInicio: sumarMinutos(horaEstimada, -15),
    horaVentanaFin: sumarMinutos(horaEstimada, 35),
    estado: 'pendiente',
    citaOrigenId: null,
    version: 1,
  }
}
