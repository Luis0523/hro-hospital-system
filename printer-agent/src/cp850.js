// Codificación CP850 (página de códigos por defecto de las impresoras ESC/POS
// en Latinoamérica). Evita que los acentos salgan como basura.
const MAPA = {
  'Ç': 0x80,
  'ü': 0x81,
  'é': 0x82,
  'â': 0x83,
  'ä': 0x84,
  'à': 0x85,
  'å': 0x86,
  'ç': 0x87,
  'ê': 0x88,
  'ë': 0x89,
  'è': 0x8a,
  'ï': 0x8b,
  'î': 0x8c,
  'ì': 0x8d,
  'Ä': 0x8e,
  'Å': 0x8f,
  'É': 0x90,
  'æ': 0x91,
  'Æ': 0x92,
  'ô': 0x93,
  'ö': 0x94,
  'ò': 0x95,
  'û': 0x96,
  'ù': 0x97,
  'ÿ': 0x98,
  'Ö': 0x99,
  'Ü': 0x9a,
  'ø': 0x9b,
  '£': 0x9c,
  'Ø': 0x9d,
  'á': 0xa0,
  'í': 0xa1,
  'ó': 0xa2,
  'ú': 0xa3,
  'ñ': 0xa4,
  'Ñ': 0xa5,
  'ª': 0xa6,
  'º': 0xa7,
  '¿': 0xa8,
  '¬': 0xaa,
  '¡': 0xad,
  '«': 0xae,
  '»': 0xaf,
  'Á': 0xb5,
  'Â': 0xb6,
  'À': 0xb7,
  'ã': 0xc6,
  'Ã': 0xc7,
  'Ê': 0xd2,
  'Ë': 0xd3,
  'È': 0xd4,
  'Í': 0xd6,
  'Î': 0xd7,
  'Ï': 0xd8,
  'Ó': 0xe0,
  'Ô': 0xe2,
  'Ò': 0xe3,
  'õ': 0xe4,
  'Õ': 0xe5,
  'Ú': 0xe9,
  'Û': 0xea,
  'Ù': 0xeb,
  'ý': 0xec,
  'Ý': 0xed,
  '´': 0xef,
  '±': 0xf1,
  '÷': 0xf6,
  '°': 0xf8,
}

const REEMPLAZOS = [
  [/[–—]/g, '-'],
  [/[“”]/g, '"'],
  [/[‘’]/g, "'"],
  [/…/g, '...'],
  [/€/g, 'EUR'],
]

export function normalizarTexto(valor) {
  let texto = String(valor ?? '')
  for (const [patron, reemplazo] of REEMPLAZOS) texto = texto.replace(patron, reemplazo)
  return texto
}

export function aCp850(valor) {
  const texto = normalizarTexto(valor)
  const bytes = []
  for (const caracter of texto) {
    const codigo = caracter.codePointAt(0)
    if (codigo < 0x80) {
      // Se permiten salto de línea y tabulador; el resto de controles se anula
      // para evitar inyección de comandos ESC/POS desde datos del usuario.
      bytes.push(codigo < 0x20 && codigo !== 0x0a && codigo !== 0x09 ? 0x20 : codigo)
    } else if (MAPA[caracter] != null) {
      bytes.push(MAPA[caracter])
    } else {
      bytes.push(0x3f) // '?'
    }
  }
  return Buffer.from(bytes)
}
