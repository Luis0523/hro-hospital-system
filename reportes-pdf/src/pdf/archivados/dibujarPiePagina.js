'use strict';

const {
  PAGINA,
  MARGENES,
  CONTENT_WIDTH,
  COLORES,
  FUENTES,
  TAMANOS,
} = require('./constantes');
const { escribirLinea } = require('./texto');

function dibujarPiePagina(doc, datos) {
  const rango = doc.bufferedPageRange();
  const total = rango.count;
  const left = MARGENES.left;
  const right = MARGENES.left + CONTENT_WIDTH;
  const y = PAGINA.height - MARGENES.bottom + 4;

  for (let i = 0; i < total; i += 1) {
    doc.switchToPage(rango.start + i);

    const margenInferiorOriginal = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;

    doc
      .save()
      .moveTo(left, y - 6)
      .lineTo(right, y - 6)
      .lineWidth(0.5)
      .strokeColor(COLORES.borde)
      .stroke()
      .restore();

    escribirLinea(doc, 'Hospital Regional de Occidente — Sistema HRO', left, y, {
      fuente: FUENTES.normal,
      tamano: TAMANOS.pie,
      color: COLORES.textoSuave,
    });

    escribirLinea(doc, datos.titulo, left, y, {
      fuente: FUENTES.normal,
      tamano: TAMANOS.pie,
      color: COLORES.textoSuave,
      align: 'center',
      ancho: CONTENT_WIDTH,
    });

    escribirLinea(doc, `Página ${i + 1} de ${total}`, right - 140, y, {
      fuente: FUENTES.normal,
      tamano: TAMANOS.pie,
      color: COLORES.textoSuave,
      align: 'right',
      ancho: 140,
    });

    doc.page.margins.bottom = margenInferiorOriginal;
  }
}

module.exports = { dibujarPiePagina };
