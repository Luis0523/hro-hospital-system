import { construirPdfSimple } from '@/modules/archivo/utils/pdfMock'

const ETAPAS = [
  { id: 'registrado', nombre: 'Registrado' },
  { id: 'en_clinica', nombre: 'Recibir/Repartir' },
  { id: 'devuelto', nombre: 'Devuelto' },
  { id: 'archivo', nombre: 'Archivo' },
]

const TIPOS_SALIDA = [
  { id: 'normal', nombre: 'Normal' },
  { id: 'personal', nombre: 'Personal' },
  { id: 'presentacion', nombre: 'Presentación' },
  { id: 'privado_libertad', nombre: 'Privado de libertad' },
]

function normalizarTexto(valor) {
  return String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function esClinicaDeLaMujer(nombre) {
  return normalizarTexto(nombre).includes('mujer')
}

/**
 * Agrega los datos del día de una estación: libro de turnos, resumen de
 * clínicas y salidas de Enfermería a Archivo.
 */
export function calcularEstadisticasEnfermeria({ libro = null, clinicas = [], salidas = [] } = {}) {
  const especialidades = Array.isArray(libro?.especialidades) ? libro.especialidades : []
  const turnos = especialidades.flatMap((especialidad) =>
    (especialidad.turnos ?? []).map((turno) => ({
      ...turno,
      especialidadId: especialidad.id,
      especialidadNombre: especialidad.nombre,
    })),
  )

  const etapas = Object.fromEntries(ETAPAS.map((etapa) => [etapa.id, 0]))
  const salidasPorTipo = Object.fromEntries(TIPOS_SALIDA.map((tipo) => [tipo.id, 0]))
  const clinicasPorId = new Map()

  for (const clinica of Array.isArray(clinicas) ? clinicas : []) {
    clinicasPorId.set(String(clinica.id), {
      id: clinica.id,
      nombre: clinica.nombre ?? `Clínica ${clinica.id}`,
      numero: clinica.numero ?? null,
      pacientes: 0,
      presentaciones: 0,
      pendientes: Number(clinica.expedientesEnClinica ?? 0),
    })
  }

  let presentaciones = 0
  let privadosLibertad = 0
  let sinMarca = 0

  const porEspecialidad = especialidades.map((especialidad) => {
    const lista = especialidad.turnos ?? []
    const presentacionesEsp = lista.filter((t) => t.tipoRegistro === 'presentacion').length
    const privadosEsp = lista.filter((t) => t.tipoRegistro === 'privado_libertad').length
    return {
      id: especialidad.id,
      codigo: especialidad.codigo,
      nombre: especialidad.nombre,
      total: lista.length,
      presentaciones: presentacionesEsp,
      privadosLibertad: privadosEsp,
      clinicaMujer: esClinicaDeLaMujer(especialidad.nombre),
    }
  })

  for (const turno of turnos) {
    etapas[turno.etapa] = (etapas[turno.etapa] ?? 0) + 1

    if (turno.tipoRegistro === 'presentacion') presentaciones += 1
    else if (turno.tipoRegistro === 'privado_libertad') privadosLibertad += 1
    else sinMarca += 1

    if (turno.clinicaId != null) {
      const clave = String(turno.clinicaId)
      if (!clinicasPorId.has(clave)) {
        clinicasPorId.set(clave, {
          id: turno.clinicaId,
          nombre: turno.clinicaNombre ?? `Clínica ${turno.clinicaId}`,
          numero: turno.clinicaNumero ?? null,
          pacientes: 0,
          presentaciones: 0,
          pendientes: 0,
        })
      }
      const clinica = clinicasPorId.get(clave)
      clinica.pacientes += 1
      if (turno.tipoRegistro === 'presentacion') clinica.presentaciones += 1
    }
  }

  const listaSalidas = Array.isArray(salidas) ? salidas : []
  for (const salida of listaSalidas) {
    const tipo = salida?.tipo ?? 'normal'
    salidasPorTipo[tipo] = (salidasPorTipo[tipo] ?? 0) + 1
  }

  const clinicaMujer = porEspecialidad
    .filter((especialidad) => especialidad.clinicaMujer)
    .reduce((total, especialidad) => total + especialidad.total, 0)

  return {
    totalPacientes: turnos.length,
    totalSalidas: listaSalidas.length,
    primeraVez: listaSalidas.filter((salida) => salida?.primeraVez).length,
    presentaciones,
    privadosLibertad,
    sinMarca,
    personal: salidasPorTipo.personal ?? 0,
    clinicaMujer,
    etapas: ETAPAS.map((etapa) => ({ ...etapa, valor: etapas[etapa.id] ?? 0 })),
    etapaConteo: etapas,
    salidasPorTipo: TIPOS_SALIDA.map((tipo) => ({
      ...tipo,
      valor: salidasPorTipo[tipo.id] ?? 0,
    })),
    porEspecialidad: porEspecialidad.sort((a, b) => b.total - a.total),
    porClinica: [...clinicasPorId.values()]
      .map((clinica) => ({
        ...clinica,
        presentaciones: clinica.presentaciones ?? 0,
      }))
      .sort((a, b) => b.pacientes - a.pacientes),
  }
}

/** Líneas del consolidado diario que se descarga como PDF. */
export function lineasConsolidadoEnfermeria({ estacion, fecha, estadisticas }) {
  const nombreEstacion = estacion
    ? `${estacion.codigo ? `${estacion.codigo} · ` : ''}${estacion.nombre ?? ''}`.trim()
    : 'Sin estación'
  const lineas = [
    'HOSPITAL REGIONAL DE OCCIDENTE',
    'ESTADÍSTICAS DE LA ESTACIÓN DE ENFERMERÍA',
    `Estación: ${nombreEstacion}`,
    `Fecha: ${fecha ?? ''}`,
    '',
    'TOTALES DEL DÍA',
    `Pacientes registrados: ${estadisticas.totalPacientes}`,
    `Salidas a Archivo: ${estadisticas.totalSalidas}`,
    `Primera vez: ${estadisticas.primeraVez}`,
    `Presentaciones: ${estadisticas.presentaciones}`,
    `Privados de libertad: ${estadisticas.privadosLibertad}`,
    `Personal: ${estadisticas.personal}`,
    `Clínica de la Mujer: ${estadisticas.clinicaMujer}`,
    '',
    'POR ETAPA',
    ...estadisticas.etapas.map((etapa) => `${etapa.nombre}: ${etapa.valor}`),
    '',
    'POR ESPECIALIDAD',
    ...estadisticas.porEspecialidad.map(
      (especialidad) =>
        `${especialidad.nombre}: ${especialidad.total} (presentaciones ${especialidad.presentaciones}, privados ${especialidad.privadosLibertad})`,
    ),
    '',
    'REPARTO POR CLÍNICA',
    ...estadisticas.porClinica.map(
      (clinica) =>
        `${clinica.nombre}: ${clinica.pacientes} pacientes, ${clinica.presentaciones} presentaciones, ${clinica.pendientes} pendientes`,
    ),
    '',
    'SALIDAS A ARCHIVO POR ETIQUETA',
    ...estadisticas.salidasPorTipo.map((tipo) => `${tipo.nombre}: ${tipo.valor}`),
    '',
    'Documento consolidado generado por el sistema SIGHO.',
  ]
  return lineas
}

export function construirPdfConsolidadoEnfermeria({ estacion, fecha, estadisticas }) {
  return construirPdfSimple(lineasConsolidadoEnfermeria({ estacion, fecha, estadisticas }))
}

function escaparHtml(valor) {
  return String(valor ?? '—').replace(/[&<>"']/g, (caracter) => {
    const mapa = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
    return mapa[caracter]
  })
}

/** HTML listo para imprimir el consolidado del día. */
export function htmlConsolidadoEnfermeria({ estacion, fecha, estadisticas }) {
  const nombreEstacion = estacion
    ? `${estacion.codigo ? `${estacion.codigo} · ` : ''}${estacion.nombre ?? ''}`.trim()
    : 'Sin estación'

  const fila = (etiqueta, valor) =>
    `<tr><td>${escaparHtml(etiqueta)}</td><td class="num">${escaparHtml(valor)}</td></tr>`

  const filasEspecialidad = estadisticas.porEspecialidad
    .map(
      (especialidad) => `<tr>
        <td>${escaparHtml(especialidad.nombre)}</td>
        <td class="num">${especialidad.total}</td>
        <td class="num">${especialidad.presentaciones}</td>
        <td class="num">${especialidad.privadosLibertad}</td>
      </tr>`,
    )
    .join('')

  const filasClinica = estadisticas.porClinica
    .map(
      (clinica) => `<tr>
        <td>${escaparHtml(clinica.nombre)}</td>
        <td class="num">${clinica.pacientes}</td>
        <td class="num">${clinica.presentaciones}</td>
        <td class="num">${clinica.pendientes}</td>
      </tr>`,
    )
    .join('')

  return `<!doctype html><html lang="es"><head><meta charset="utf-8" />
    <title>Consolidado de Enfermería ${escaparHtml(fecha)}</title>
    <style>
      body { font-family: Arial, sans-serif; color: #1a1a1a; margin: 28px; font-size: 12px; }
      h1 { font-size: 17px; margin: 0; }
      h2 { font-size: 13px; margin: 3px 0 14px; color: #5b6572; font-weight: normal; }
      h3 { font-size: 12px; margin: 18px 0 6px; text-transform: uppercase; color: #1f3a5f; }
      table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 8px; }
      th { background: #1f3a5f; color: #fff; padding: 5px; text-align: left; }
      td { border: 1px solid #9aa5b1; padding: 4px 5px; }
      .num { text-align: right; font-variant-numeric: tabular-nums; }
      .firmas { margin-top: 42px; display: flex; justify-content: space-between; font-size: 11px; }
      .firma { width: 40%; border-top: 1px solid #1a1a1a; padding-top: 4px; text-align: center; }
    </style></head><body>
    <h1>HOSPITAL REGIONAL DE OCCIDENTE</h1>
    <h1>CONSOLIDADO DE LA ESTACIÓN DE ENFERMERÍA</h1>
    <h2>Estación: ${escaparHtml(nombreEstacion)} · Fecha: ${escaparHtml(fecha)}</h2>

    <h3>Totales del día</h3>
    <table><tbody>
      ${fila('Pacientes registrados', estadisticas.totalPacientes)}
      ${fila('Salidas a Archivo', estadisticas.totalSalidas)}
      ${fila('Primera vez', estadisticas.primeraVez)}
      ${fila('Presentaciones', estadisticas.presentaciones)}
      ${fila('Privados de libertad', estadisticas.privadosLibertad)}
      ${fila('Personal', estadisticas.personal)}
      ${fila('Clínica de la Mujer', estadisticas.clinicaMujer)}
    </tbody></table>

    <h3>Por etapa</h3>
    <table><thead><tr><th>Etapa</th><th>Total</th></tr></thead><tbody>
      ${estadisticas.etapas
        .map(
          (etapa) =>
            `<tr><td>${escaparHtml(etapa.nombre)}</td><td class="num">${etapa.valor}</td></tr>`,
        )
        .join('')}
    </tbody></table>

    <h3>Por especialidad</h3>
    <table><thead><tr><th>Especialidad</th><th>Pacientes</th><th>Presentaciones</th><th>Privados</th></tr></thead><tbody>
      ${filasEspecialidad || '<tr><td colspan="4">Sin datos.</td></tr>'}
    </tbody></table>

    <h3>Reparto por clínica</h3>
    <table><thead><tr><th>Clínica</th><th>Pacientes</th><th>Presentaciones</th><th>Pendientes</th></tr></thead><tbody>
      ${filasClinica || '<tr><td colspan="4">Sin datos.</td></tr>'}
    </tbody></table>

    <h3>Salidas a Archivo por etiqueta</h3>
    <table><thead><tr><th>Etiqueta</th><th>Total</th></tr></thead><tbody>
      ${estadisticas.salidasPorTipo
        .map(
          (tipo) =>
            `<tr><td>${escaparHtml(tipo.nombre)}</td><td class="num">${tipo.valor}</td></tr>`,
        )
        .join('')}
    </tbody></table>

    <div class="firmas"><div class="firma">Enfermería</div><div class="firma">Jefatura de Enfermería</div></div>
    <script>window.onload = () => window.print()</script>
    </body></html>`
}
