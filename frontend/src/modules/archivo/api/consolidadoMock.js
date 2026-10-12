import { hoyIso } from '@/shared/utils/fecha'
import { expedientesMock } from './mockData'
import { listarDepuracionesMock } from './depuracionMock'

// Datos simulados del Consolidado de Archivo. Se derivan de los mismos fixtures
// operativos (`expedientesMock`) para que las cifras cuadren con la estación, y
// son deterministas (sin aleatoriedad) para pruebas estables.

function contarPorEspecialidad() {
  const mapa = new Map()

  for (const expediente of expedientesMock) {
    const clave = expediente.subespecialidadId ?? 'sin'
    const actual = mapa.get(clave) ?? {
      especialidadId: expediente.subespecialidadId ?? null,
      especialidadNombre: expediente.subespecialidadNombre ?? 'Sin especialidad',
      total: 0,
    }
    actual.total += 1
    mapa.set(clave, actual)
  }

  return [...mapa.values()]
}

export function consolidadoDiarioMock({ fecha } = {}) {
  const objetivo = fecha || hoyIso()
  const porEspecialidad = contarPorEspecialidad().sort((a, b) => b.total - a.total)
  const total = porEspecialidad.reduce((acumulado, item) => acumulado + item.total, 0)
  const totalDepurados = listarDepuracionesMock({ fecha: objetivo }).length

  return {
    fecha: objetivo,
    total,
    totalDepurados,
    porEspecialidad,
  }
}

// Reparte un total del día entre las especialidades base de forma proporcional
// y determinista (sin aleatoriedad), garantizando que la suma sea `total`.
function distribuirPorEspecialidad(total) {
  const base = contarPorEspecialidad()
  const suma = base.reduce((acumulado, item) => acumulado + item.total, 0) || 1
  let asignado = 0

  return base.map((item, indice) => {
    const cantidad =
      indice === base.length - 1 ? total - asignado : Math.floor((item.total / suma) * total)
    asignado += cantidad
    return {
      especialidadId: item.especialidadId,
      especialidadNombre: item.especialidadNombre,
      total: cantidad,
    }
  })
}

function dosDigitos(valor) {
  return String(valor).padStart(2, '0')
}

export function consolidadoMensualMock({ anio, mes } = {}) {
  const hoy = new Date()
  const anioNum = Number(anio) || hoy.getFullYear()
  const mesNum = Number(mes) || hoy.getMonth() + 1
  const ultimoDia = new Date(Date.UTC(anioNum, mesNum, 0)).getUTCDate()
  const desde = `${anioNum}-${dosDigitos(mesNum)}-01`
  const hasta = `${anioNum}-${dosDigitos(mesNum)}-${dosDigitos(ultimoDia)}`

  const informe = []
  const detalle = []
  const acumulado = new Map()

  for (let dia = 1; dia <= ultimoDia; dia += 1) {
    const fecha = `${anioNum}-${dosDigitos(mesNum)}-${dosDigitos(dia)}`
    const diaSemana = new Date(Date.UTC(anioNum, mesNum - 1, dia)).getUTCDay()
    if (diaSemana === 0) continue // domingo sin actividad

    const hdc = 6 + ((dia * 3) % 25)
    const hd = dia % 7 === 0 ? 1 : 0
    const porEspecialidad = distribuirPorEspecialidad(hdc)

    informe.push({ dia: fecha, hdc, hd })
    detalle.push({ dia: fecha, total: hdc, porEspecialidad })

    for (const item of porEspecialidad) {
      const clave = item.especialidadId ?? item.especialidadNombre
      const actual = acumulado.get(clave) ?? {
        especialidadId: item.especialidadId,
        especialidadNombre: item.especialidadNombre,
        total: 0,
      }
      actual.total += item.total
      acumulado.set(clave, actual)
    }
  }

  return {
    rango: { desde, hasta },
    informe,
    detalle,
    totales: {
      totalCarnets: informe.reduce((total, fila) => total + fila.hdc, 0),
      totalDepurados: informe.reduce((total, fila) => total + fila.hd, 0),
      porEspecialidad: [...acumulado.values()].sort((a, b) => b.total - a.total),
    },
  }
}
