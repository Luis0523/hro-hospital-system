// Convierte lo que devuelve el reconocimiento de voz a un número de expediente.
// Acepta dictado por pares ("noventa doce cero uno" -> 901201) y dígito a dígito
// ("nueve cero uno dos cero uno" -> 901201). El valor final SIEMPRE lo verifica
// una persona; esta utilidad no decide si el expediente existe.
//
// El parser es deliberadamente permisivo pero deja rastro: devuelve los grupos
// interpretados, las palabras que no entendió y advertencias (por ejemplo, un
// grupo de más de 2 dígitos, señal típica de que el reconocedor "corrigió" una
// frase como "noventa y doce" y la convirtió en 102).

const UNIDADES = {
  cero: '0',
  uno: '1',
  dos: '2',
  tres: '3',
  cuatro: '4',
  cinco: '5',
  seis: '6',
  siete: '7',
  ocho: '8',
  nueve: '9',
}

const ADOLESCENTES = {
  diez: 10,
  once: 11,
  doce: 12,
  trece: 13,
  catorce: 14,
  quince: 15,
  dieciseis: 16,
  diecisiete: 17,
  dieciocho: 18,
  diecinueve: 19,
}

const DECENAS = {
  veinte: 20,
  treinta: 30,
  cuarenta: 40,
  cincuenta: 50,
  sesenta: 60,
  setenta: 70,
  ochenta: 80,
  noventa: 90,
}

const VEINTI = {
  veintiuno: 21,
  veintidos: 22,
  veintitres: 23,
  veinticuatro: 24,
  veinticinco: 25,
  veintiseis: 26,
  veintisiete: 27,
  veintiocho: 28,
  veintinueve: 29,
}

const CENTENAS = {
  cien: 100,
  ciento: 100,
  doscientos: 200,
  trescientos: 300,
  cuatrocientos: 400,
  quinientos: 500,
  seiscientos: 600,
  setecientos: 700,
  ochocientos: 800,
  novecientos: 900,
}

const RELLENO = new Set([
  'expediente',
  'numero',
  'guion',
  'guiones',
  'punto',
  'coma',
  'espacio',
  'digito',
  'digitos',
])

function normalizarTexto(texto) {
  return String(texto ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function parseResto99(tokens, indice) {
  const token = tokens[indice]
  if (!token) return null

  if (token in VEINTI) {
    return { valor: VEINTI[token], siguiente: indice + 1 }
  }

  if (token in DECENAS) {
    const base = DECENAS[token]
    let siguiente = indice + 1
    if (tokens[siguiente] === 'y') {
      const unidad = tokens[siguiente + 1]
      if (unidad in UNIDADES) {
        return { valor: base + Number(UNIDADES[unidad]), siguiente: siguiente + 2 }
      }
      return { valor: base, siguiente: siguiente + 1 }
    }
    const unidad = tokens[siguiente]
    // "treinta cinco" sin la "y": el reconocedor suele omitirla.
    if (unidad in UNIDADES && unidad !== 'cero') {
      return { valor: base + Number(UNIDADES[unidad]), siguiente: siguiente + 1 }
    }
    return { valor: base, siguiente }
  }

  if (token in ADOLESCENTES) {
    return { valor: ADOLESCENTES[token], siguiente: indice + 1 }
  }

  if (token in UNIDADES) {
    return { valor: Number(UNIDADES[token]), siguiente: indice + 1 }
  }

  return null
}

function parseAtomo(tokens, indice) {
  const token = tokens[indice]

  if (/^\d+$/.test(token)) {
    return { digitos: token, valor: Number(token), siguiente: indice + 1 }
  }

  if (token in VEINTI) {
    return { digitos: String(VEINTI[token]), valor: VEINTI[token], siguiente: indice + 1 }
  }

  if (token in CENTENAS) {
    const resto = parseResto99(tokens, indice + 1)
    const valor = CENTENAS[token] + (resto?.valor ?? 0)
    return { digitos: String(valor), valor, siguiente: resto?.siguiente ?? indice + 1 }
  }

  if (token in DECENAS) {
    const base = DECENAS[token]
    if (tokens[indice + 1] === 'y') {
      const resto = parseResto99(tokens, indice + 2)
      if (resto) {
        const valor = base + resto.valor
        return { digitos: String(valor), valor, siguiente: resto.siguiente }
      }
      return { digitos: String(base), valor: base, siguiente: indice + 2 }
    }
    const unidad = tokens[indice + 1]
    if (unidad in UNIDADES && unidad !== 'cero') {
      const valor = base + Number(UNIDADES[unidad])
      return { digitos: String(valor), valor, siguiente: indice + 2 }
    }
    return { digitos: String(base), valor: base, siguiente: indice + 1 }
  }

  if (token in ADOLESCENTES) {
    return {
      digitos: String(ADOLESCENTES[token]),
      valor: ADOLESCENTES[token],
      siguiente: indice + 1,
    }
  }

  if (token in UNIDADES) {
    return { digitos: UNIDADES[token], valor: Number(UNIDADES[token]), siguiente: indice + 1 }
  }

  return null
}

export function normalizarExpedienteHablado(texto) {
  const tokens = normalizarTexto(texto)
    .split(' ')
    .filter((token) => token && !RELLENO.has(token))

  const grupos = []
  const desconocidos = []
  let indice = 0

  while (indice < tokens.length) {
    const atomo = parseAtomo(tokens, indice)
    if (atomo) {
      grupos.push(atomo.digitos)
      indice = atomo.siguiente
    } else {
      desconocidos.push(tokens[indice])
      indice += 1
    }
  }

  const valor = grupos.join('')
  const advertencias = []

  if (grupos.some((grupo) => grupo.length > 2)) {
    advertencias.push('Hay un grupo de más de 2 dígitos; puede ser una corrección del reconocedor.')
  }
  if (valor.startsWith('0')) {
    advertencias.push('El número empieza con 0.')
  }
  if (desconocidos.length > 0) {
    advertencias.push(`No se reconocieron: ${desconocidos.join(', ')}.`)
  }

  const valido = valor.length === 5 || valor.length === 6
  let motivo = null
  if (!valido) {
    motivo =
      valor.length === 0
        ? 'No se detectaron números.'
        : `Se esperaban 5 o 6 dígitos y se obtuvieron ${valor.length}.`
  }

  return { valor, grupos, desconocidos, advertencias, valido, motivo }
}
