// Genera un PDF mínimo pero ESTRUCTURALMENTE VÁLIDO (una página, texto
// Helvetica) sin agregar dependencias. Se usa solo en modo mock para que el
// navegador pueda abrir los documentos simulados. En modo real el PDF lo
// produce el backend y se descarga tal cual.

function escaparTextoPdf(texto) {
  return String(texto).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

// Convierte a una cadena de un byte por carácter (Latin-1 / WinAnsiEncoding),
// que es lo que el PDF espera para las tildes y la eñe.
function aBytesLatin1(texto) {
  let salida = ''
  for (let i = 0; i < texto.length; i += 1) {
    const codigo = texto.charCodeAt(i)
    salida += codigo <= 0xff ? texto[i] : '?'
  }
  return salida
}

// Construye un PDF válido de una página con una línea de texto por elemento de
// `lineas`. Calcula los offsets reales del xref, por lo que el archivo se abre
// correctamente en Chrome/Brave/Edge.
export function construirPdfSimple(lineas = []) {
  const cuerpoTexto = lineas
    .map((linea) => `(${escaparTextoPdf(aBytesLatin1(linea))}) Tj T*`)
    .join('\n')
  const contenido = `BT\n/F1 12 Tf\n16 TL\n60 780 Td\n${cuerpoTexto}\nET`

  const objetos = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    `<< /Length ${contenido.length} >>\nstream\n${contenido}\nendstream`,
  ]

  let pdf = '%PDF-1.4\n%\u00e2\u00e3\u00cf\u00d3\n'
  const desplazamientos = []
  objetos.forEach((objeto, indice) => {
    desplazamientos.push(pdf.length)
    pdf += `${indice + 1} 0 obj\n${objeto}\nendobj\n`
  })

  const inicioXref = pdf.length
  pdf += `xref\n0 ${objetos.length + 1}\n0000000000 65535 f \n`
  desplazamientos.forEach((desplazamiento) => {
    pdf += `${String(desplazamiento).padStart(10, '0')} 00000 n \n`
  })
  pdf += `trailer\n<< /Size ${objetos.length + 1} /Root 1 0 R >>\nstartxref\n${inicioXref}\n%%EOF`

  const bytes = new Uint8Array(pdf.length)
  for (let i = 0; i < pdf.length; i += 1) {
    bytes[i] = pdf.charCodeAt(i) & 0xff
  }
  return new Blob([bytes], { type: 'application/pdf' })
}

// Resumen del día simulado. Refleja los conteos del resumen mock y deja claro
// que NO es el documento oficial del backend.
export function construirPdfResumen(resumen = {}) {
  const lineas = [
    'SISTEMA HOSPITALARIO HRO',
    'Estación de Archivo / Registro Médico',
    '',
    'Resumen del día',
    `Fecha: ${resumen.fecha ?? 'hoy'}`,
    '',
    `Total de ciclos: ${resumen.totalCiclos ?? 0}`,
    `Pendientes: ${resumen.pendienteLocalizar ?? 0}`,
    `Localizados: ${resumen.localizado ?? 0}`,
    `Entregados: ${resumen.entregado ?? 0}`,
    `No localizados: ${resumen.noLocalizado ?? 0}`,
    `Expedientes nuevos: ${resumen.expedientesNuevos ?? 0}`,
    '',
    'Documento generado con datos simulados.',
  ]
  return construirPdfSimple(lineas)
}
