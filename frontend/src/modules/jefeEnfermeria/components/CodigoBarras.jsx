// Patrones Code 39 (9 elementos por carácter: 1 = ancho, 0 = angosto).
const PATRONES = {
  0: '000110100',
  1: '100100001',
  2: '001100001',
  3: '101100000',
  4: '000110001',
  5: '100110000',
  6: '001110000',
  7: '000100101',
  8: '100100100',
  9: '001100100',
  A: '100001001',
  B: '001001001',
  C: '101001000',
  D: '000011001',
  E: '100011000',
  F: '001011000',
  G: '000001101',
  H: '100001100',
  I: '001001100',
  J: '000011100',
  K: '100000011',
  L: '001000011',
  M: '101000010',
  N: '000010011',
  O: '100010010',
  P: '001010010',
  Q: '000000111',
  R: '100000110',
  S: '001000110',
  T: '000010110',
  U: '110000001',
  V: '011000001',
  W: '111000000',
  X: '010010001',
  Y: '110010000',
  Z: '011010000',
  '-': '010000101',
  '.': '110000100',
  ' ': '011000100',
  $: '010101000',
  '/': '010100010',
  '+': '010001010',
  '%': '000101010',
  '*': '010010100',
}

const ANCHO_ANGOSTO = 1
const ANCHO_ANCHO = 3
const SEPARACION = 1

/** Devuelve el texto codificable o null si no hay caracteres válidos. */
function normalizar(valor) {
  return String(valor ?? '')
    .toUpperCase()
    .replace(/[^0-9A-Z\-. $/+%]/g, '')
    .trim()
}

export default function CodigoBarras({ valor, className = '' }) {
  const texto = normalizar(valor)
  if (!texto) return null

  const contenido = `*${texto}*`
  const barras = []
  let x = 0

  for (let indice = 0; indice < contenido.length; indice += 1) {
    const patron = PATRONES[contenido[indice]]
    if (!patron) continue

    for (let elemento = 0; elemento < 9; elemento += 1) {
      const ancho = patron[elemento] === '1' ? ANCHO_ANCHO : ANCHO_ANGOSTO
      const esBarra = elemento % 2 === 0
      if (esBarra) barras.push({ x, ancho })
      x += ancho
    }

    if (indice < contenido.length - 1) x += SEPARACION
  }

  if (barras.length === 0) return null

  return (
    <svg
      viewBox={`0 0 ${x} 100`}
      preserveAspectRatio="none"
      shapeRendering="crispEdges"
      role="img"
      aria-label={`Código de barras ${texto}`}
      className={className}
    >
      <rect x="0" y="0" width={x} height="100" fill="#fff" />
      {barras.map((barra, indice) => (
        <rect
          key={`${barra.x}-${indice}`}
          x={barra.x}
          y="0"
          width={barra.ancho}
          height="100"
          fill="#1a1a1a"
        />
      ))}
    </svg>
  )
}
