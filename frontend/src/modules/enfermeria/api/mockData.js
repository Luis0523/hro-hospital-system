import { hoyIso } from '@/shared/utils/fecha'

export const clinicasMock = [
  { id: 1, nombre: 'Clínica 01 - Medicina General', cupos: 42 },
  { id: 2, nombre: 'Clínica 02 - Pediatría', cupos: 18 },
  { id: 4, nombre: 'Clínica 04 - Cardiología', cupos: 11 },
  { id: 7, nombre: 'Clínica 07 - Traumatología', cupos: 0 },
  { id: 9, nombre: 'Clínica 09 - Ginecología', cupos: 0 },
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

export const turnosMock = []
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
