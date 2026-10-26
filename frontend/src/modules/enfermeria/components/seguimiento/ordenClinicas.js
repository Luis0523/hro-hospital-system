// Ordena las clínicas por uso del día:
// 1) clínicas con pacientes asignados/pendientes,
// 2) mayor número de pendientes,
// 3) mayor número de asignados,
// 4) nombre.
export function ordenarClinicasPorUso(clinicas = []) {
  return [...clinicas].sort((a, b) => {
    const asignadosA = Number(a.asignados ?? 0)
    const asignadosB = Number(b.asignados ?? 0)
    const pendientesA = Number(a.expedientesEnClinica ?? 0)
    const pendientesB = Number(b.expedientesEnClinica ?? 0)
    const usadaA = asignadosA > 0 || pendientesA > 0
    const usadaB = asignadosB > 0 || pendientesB > 0

    if (usadaA !== usadaB) return usadaA ? -1 : 1
    if (pendientesA !== pendientesB) return pendientesB - pendientesA
    if (asignadosA !== asignadosB) return asignadosB - asignadosA
    return String(a.nombre ?? '').localeCompare(String(b.nombre ?? ''), 'es')
  })
}
