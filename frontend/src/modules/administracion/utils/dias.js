// Convención confirmada del backend: diaSemana 1 = Lunes ... 7 = Domingo.
export const DIAS_SEMANA = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
  { value: 7, label: 'Domingo' },
]

export function nombreDia(diaSemana) {
  return DIAS_SEMANA.find((dia) => dia.value === Number(diaSemana))?.label ?? ''
}

// El contrato LocalTime del backend usa HH:mm:ss; el input type="time" produce HH:mm.
export function normalizarHora(hora) {
  if (!hora) return ''
  const [horas = '00', minutos = '00'] = String(hora).split(':')
  return `${horas.padStart(2, '0')}:${minutos.padStart(2, '0')}:00`
}

// Formato corto para mostrar horarios en listados y detalles.
export function horaCorta(hora) {
  if (!hora) return ''
  const [horas = '00', minutos = '00'] = String(hora).split(':')
  return `${horas.padStart(2, '0')}:${minutos.padStart(2, '0')}`
}

export function aMinutos(hora) {
  if (!hora) return Number.NaN
  const [horas = '0', minutos = '0'] = String(hora).split(':')
  return Number(horas) * 60 + Number(minutos)
}
