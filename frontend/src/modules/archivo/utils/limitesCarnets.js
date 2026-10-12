// Límites de registro de carnets por especialidad y cálculo del reporte del día.
// Los límites son configuración operativa de Archivo; se comparan por nombre de
// especialidad normalizado (sin acentos, minúsculas).

export const LIMITES_CARNETS = {
  'medicina interna': 100,
  oncologia: 14,
  neurologia: 14,
  nefrologia: 14,
  endocrinologia: 14,
  infectologia: 14,
  reumatologia: 14,
  dermatologia: 14,
  neumologia: 14,
  gastroenterologia: 12,
  nutricion: 12,
  'clinica de la mujer': 12,
}

export function normalizarNombre(nombre) {
  return String(nombre ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

// Límite configurado para una especialidad, o null si no tiene.
export function limiteDe(nombre) {
  const clave = normalizarNombre(nombre)
  if (clave in LIMITES_CARNETS) return LIMITES_CARNETS[clave]

  const encontrado = Object.keys(LIMITES_CARNETS).find((configurada) => clave.includes(configurada))
  return encontrado ? LIMITES_CARNETS[encontrado] : null
}

// Construye el reporte: una fila por especialidad con su conteo y su límite.
// Une el catálogo de especialidades con las que aparecen en los registros, para
// que todas se muestren aunque tengan 0 carnets hoy.
export function calcularReporteCarnets(registros = [], especialidades = []) {
  const filas = new Map()

  function asegurar(id, nombre) {
    const clave = id != null ? `id:${id}` : `nombre:${normalizarNombre(nombre)}`
    if (!filas.has(clave)) {
      filas.set(clave, {
        especialidadId: id ?? null,
        nombre: nombre ?? 'Sin especialidad',
        registrados: 0,
      })
    }
    return filas.get(clave)
  }

  for (const especialidad of especialidades) {
    asegurar(especialidad.id, especialidad.nombre)
  }
  for (const registro of registros) {
    const fila = asegurar(registro.especialidadId ?? null, registro.especialidadNombre)
    fila.registrados += 1
  }

  return [...filas.values()]
    .map((fila) => {
      const limite = limiteDe(fila.nombre)
      return { ...fila, limite, excedido: limite != null && fila.registrados > limite }
    })
    .sort(
      (a, b) =>
        Number(b.excedido) - Number(a.excedido) ||
        b.registrados - a.registrados ||
        a.nombre.localeCompare(b.nombre),
    )
}

// Porcentaje de avance respecto al límite (0–100), con caso borde de límite 0.
export function porcentajeAvance(registrados, limite) {
  if (!limite || limite <= 0) return 0
  return Math.min(100, Math.round((registrados / limite) * 100))
}
