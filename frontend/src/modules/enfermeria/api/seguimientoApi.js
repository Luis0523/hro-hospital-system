// Datos simulados del registro y seguimiento de turnos por especialidad.
// El estado vive en memoria del módulo: recargar la página reinicia la jornada
// (el ticket excluye `localStorage` y backend para esta pantalla).

export const ETAPAS_SEGUIMIENTO = [
  { id: 'registrado', nombre: 'Registrado' },
  { id: 'recibido', nombre: 'Recibido' },
  { id: 'en_clinica', nombre: 'En clínica' },
  { id: 'devuelto', nombre: 'Devuelto' },
  { id: 'archivo', nombre: 'Archivo' },
]

// Etapa que debe tener el turno para poder aplicar la etapa seleccionada.
export const ETAPA_PREVIA = {
  recibido: 'registrado',
  en_clinica: 'recibido',
  devuelto: 'en_clinica',
  archivo: 'devuelto',
}

// Tipos de registro excluyentes. Se muestran con un brillo especial en el libro.
export const TIPOS_REGISTRO = [
  { id: 'presentacion', nombre: 'Presentación', icono: 'gavel' },
  { id: 'privado_libertad', nombre: 'Privado de libertad', icono: 'lock' },
]

const TIPOS_VALIDOS = new Set(TIPOS_REGISTRO.map((tipo) => tipo.id))

// Correlativos disponibles por especialidad. `maximo` es el último número que
// puede registrarse en la jornada; la semilla deja libres los correlativos
// posteriores al límite simulado.
export const ESPECIALIDADES_SEGUIMIENTO = [
  { codigo: 'MI', nombre: 'Medicina Interna', maximo: 100 },
  { codigo: 'ONC', nombre: 'Oncología', maximo: 14 },
  { codigo: 'NEU', nombre: 'Neurología', maximo: 14 },
  { codigo: 'NEF', nombre: 'Nefrología', maximo: 14 },
  { codigo: 'END', nombre: 'Endocrinología', maximo: 14 },
  { codigo: 'INF', nombre: 'Infectología', maximo: 14 },
  { codigo: 'REU', nombre: 'Reumatología', maximo: 14 },
  { codigo: 'DER', nombre: 'Dermatología', maximo: 14 },
  { codigo: 'NEM', nombre: 'Neumología', maximo: 14 },
  { codigo: 'DOL', nombre: 'Clínica del Dolor', maximo: 13 },
  { codigo: 'GAS', nombre: 'Gastroenterología', maximo: 12 },
  { codigo: 'NUT', nombre: 'Nutrición', maximo: 12 },
  { codigo: 'MUJ', nombre: 'Clínica de la Mujer', maximo: 12 },
]

export const CLINICAS_SEGUIMIENTO = [1, 2, 3, 4, 5].map((id) => ({
  id,
  nombre: `Clínica ${id}`,
}))

const LIMITES_SEMILLA = [38, 4, 2, 3, 7, 4, 2, 3, 0, 5, 7, 2, 8]

let turnos = new Map()

const esperar = (ms = 60) => new Promise((resolver) => setTimeout(resolver, ms))

const crearError = (mensaje, status) => {
  const error = new Error(mensaje)
  error.status = status
  return error
}

const copiarTurno = (turno) => ({ ...turno })

const clave = (codigo, numero) => `${codigo}-${numero}`

function etapaPorOrden(orden) {
  if (orden <= 3) return 'archivo'
  if (orden <= 6) return 'devuelto'
  if (orden <= 12) return 'en_clinica'
  if (orden <= 17) return 'recibido'
  return 'registrado'
}

function sembrarTurnos() {
  turnos = new Map()
  ESPECIALIDADES_SEGUIMIENTO.forEach((especialidad, indice) => {
    const limite = indice === 0 ? 38 : LIMITES_SEMILLA[indice] || 0
    for (let numero = 1; numero <= limite; numero += 1) {
      const orden = indice === 0 ? numero : ((numero + indice * 3) % 22) + 1
      const etapa = etapaPorOrden(orden)
      const conClinica = ['en_clinica', 'devuelto', 'archivo'].includes(etapa)
      const tipoRegistro =
        (numero + indice * 2) % 9 === 0
          ? 'presentacion'
          : (numero + indice * 3) % 14 === 0
            ? 'privado_libertad'
            : null
      turnos.set(clave(especialidad.codigo, numero), {
        id: clave(especialidad.codigo, numero),
        codigo: especialidad.codigo,
        numero,
        etapa,
        clinicaId: conClinica ? 1 + ((numero + indice) % 5) : null,
        tipoRegistro,
        registradoEn: new Date().toISOString(),
      })
    }
  })
}

sembrarTurnos()

const buscarEspecialidad = (codigo) =>
  ESPECIALIDADES_SEGUIMIENTO.find((especialidad) => especialidad.codigo === codigo)

export function nombreEtapa(id) {
  return ETAPAS_SEGUIMIENTO.find((etapa) => etapa.id === id)?.nombre ?? 'Sin registrar'
}

export function nombreTipoRegistro(id) {
  return TIPOS_REGISTRO.find((tipo) => tipo.id === id)?.nombre ?? 'Sin tipo'
}

function normalizarTipoRegistro(tipoRegistro) {
  if (tipoRegistro == null || tipoRegistro === '') return null
  if (!TIPOS_VALIDOS.has(tipoRegistro)) {
    throw crearError('Tipo de registro inválido', 422)
  }
  return tipoRegistro
}

// Libro completo: especialidades con sus correlativos ya registrados. El
// componente calcula las casillas disponibles a partir de `maximo`.
export async function obtenerLibro() {
  await esperar()
  return {
    especialidades: ESPECIALIDADES_SEGUIMIENTO.map((especialidad) => ({
      codigo: especialidad.codigo,
      nombre: especialidad.nombre,
      maximo: especialidad.maximo,
      turnos: [...turnos.values()]
        .filter((turno) => turno.codigo === especialidad.codigo)
        .sort((a, b) => a.numero - b.numero)
        .map(copiarTurno),
    })),
    totalRegistrados: turnos.size,
  }
}

export async function listarClinicas() {
  await esperar()
  return CLINICAS_SEGUIMIENTO.map((clinica) => ({
    ...clinica,
    expedientesEnClinica: [...turnos.values()].filter(
      (turno) => turno.etapa === 'en_clinica' && turno.clinicaId === clinica.id,
    ).length,
  }))
}

// Registra un correlativo nuevo (etapa inicial `registrado`).
export async function registrarTurno({ codigo, numero, tipoRegistro } = {}) {
  await esperar()
  const especialidad = buscarEspecialidad(codigo)
  const correlativo = Number(numero)

  if (!especialidad) throw crearError('Especialidad no encontrada', 404)
  if (!Number.isInteger(correlativo) || correlativo < 1 || correlativo > especialidad.maximo) {
    throw crearError('Correlativo fuera de rango', 422)
  }
  if (turnos.has(clave(codigo, correlativo))) {
    throw crearError('El correlativo ya está registrado', 409)
  }

  const turno = {
    id: clave(codigo, correlativo),
    codigo,
    numero: correlativo,
    etapa: 'registrado',
    clinicaId: null,
    tipoRegistro: normalizarTipoRegistro(tipoRegistro),
    registradoEn: new Date().toISOString(),
  }
  turnos.set(turno.id, turno)
  return copiarTurno(turno)
}

// Avanza una etapa. Para pasar de `recibido` a `en_clinica` exige clínica.
export async function avanzarTurno(id, { clinicaId } = {}) {
  await esperar()
  const turno = turnos.get(id)
  if (!turno) throw crearError('Turno no encontrado', 404)

  const indice = ETAPAS_SEGUIMIENTO.findIndex((etapa) => etapa.id === turno.etapa)
  const siguiente = ETAPAS_SEGUIMIENTO[indice + 1]
  if (!siguiente) throw crearError('El turno ya completó el flujo', 409)

  if (turno.etapa === 'recibido') {
    const clinica = Number(clinicaId)
    if (!CLINICAS_SEGUIMIENTO.some((item) => item.id === clinica)) {
      throw crearError('Seleccione una clínica para repartir el expediente', 422)
    }
    turno.clinicaId = clinica
  }

  turno.etapa = siguiente.id
  turno.actualizadoEn = new Date().toISOString()
  return copiarTurno(turno)
}

// Solo para pruebas: deja el estado mutable como al cargar la página.
export function reiniciarSeguimientoMock() {
  sembrarTurnos()
}
