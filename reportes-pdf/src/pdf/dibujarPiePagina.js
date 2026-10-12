'use strict';

const {
  CONTENT_WIDTH,
  MARGENES,
  COLORES,
  FUENTES,
  TAMANOS,
} = require('./constantes');

function dibujarPiesPagina(doc, datos) {
  const rango = doc.bufferedPageRange();
  const total = rango.count;
  const left = MARGENES.left;
  const right = doc.page.width - MARGENES.right;

  for (let i = 0; i < total; i += 1) {
    doc.switchToPage(rango.start + i);

    const margenInferiorOriginal = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    const y = doc.page.height - 30;

    doc
      .save()
      .moveTo(left, y - 6)
      .lineTo(right, y - 6)
      .lineWidth(0.5)
      .strokeColor(COLORES.borde)
      .stroke()
      .restore();

    doc
      .font(FUENTES.normal)
      .fontSize(TAMANOS.nota)
      .fillColor(COLORES.textoSuave)
      .text('Hospital Regional de Occidente — Sistema HRO', left, y, {
        width: 300,
        lineBreak: false,
      });

    doc
      .font(FUENTES.normal)
      .fontSize(TAMANOS.nota)
      .fillColor(COLORES.textoSuave)
      .text(`${datos.textos.titulo}  ·  ${datos.idDocumento}`, left, y, {
        width: CONTENT_WIDTH,
        align: 'center',
        lineBreak: false,
        ellipsis: true,
      });

    doc
      .font(FUENTES.normal)
      .fontSize(TAMANOS.nota)
      .fillColor(COLORES.textoSuave)
      .text(`Página ${i + 1} de ${total}`, right - 160, y, {
        width: 160,
        align: 'right',
        lineBreak: false,
      });

    doc.page.margins.bottom = margenInferiorOriginal;
  }
}

module.exports = { dibujarPiesPagina };
