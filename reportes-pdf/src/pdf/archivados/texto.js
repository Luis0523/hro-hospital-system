'use strict';

/**
 * Dibuja una cadena en UNA sola línea, sin wrapping.
 * Calcula la posición según la alineación respecto de `ancho`.
 */
function escribirLinea(doc, texto, x, y, opciones = {}) {
  const { fuente, tamano, color, align = 'left', ancho } = opciones;

  if (fuente) {
    doc.font(fuente);
  }
  if (tamano) {
    doc.fontSize(tamano);
  }
  if (color) {
    doc.fillColor(color);
  }

  const valor = texto === null || texto === undefined ? '' : String(texto);
  const anchoTexto = doc.widthOfString(valor);

  let drawX = x;
  if (ancho && align === 'center') {
    drawX = x + Math.max(0, (ancho - anchoTexto) / 2);
  } else if (ancho && align === 'right') {
    drawX = x + Math.max(0, ancho - anchoTexto);
  }

  doc.text(valor, drawX, y, { lineBreak: false });
}

module.exports = { escribirLinea };
