function compararNumero(a, b) {
  return String(a?.numero ?? a?.nombre ?? '').localeCompare(
    String(b?.numero ?? b?.nombre ?? ''),
    'es',
    { numeric: true, sensitivity: 'base' },
  )
}

// Orden configurado por el jefe de enfermería para la estación. El backend
// envía `orden` (1 = primero); si no existe, se usa un orden natural.
export function ordenarClinicas(clinicas = []) {
  return [...clinicas].sort((a, b) => {
    const ordenA = Number(a.orden ?? Number.MAX_SAFE_INTEGER)
    const ordenB = Number(b.orden ?? Number.MAX_SAFE_INTEGER)
    if (ordenA !== ordenB) return ordenA - ordenB
    return compararNumero(a, b)
  })
}

// Compatibilidad: orden por uso (se conserva para otros consumidores).
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
    return compararNumero(a, b)
  })
}
