'use strict';

const {
  CONTENT_WIDTH,
  MARGENES,
  COLORES,
  FUENTES,
  TAMANOS,
} = require('./constantes');
const { asegurarEspacio, envolverTexto } = require('./helpers');

const LINEAS_EN_BLANCO = 4;
const ALTO_LINEA_ESCRITURA = 18;

function calcularAltoObservaciones(doc, datos) {
  const tieneTexto = datos.observaciones.length > 0;
  if (tieneTexto) {
    doc.font(FUENTES.normal).fontSize(TAMANOS.celda);
    const lineas = envolverTexto(
      doc,
      datos.observaciones,
      CONTENT_WIDTH,
      FUENTES.normal,
      TAMANOS.celda
    );
    return 22 + lineas.length * (TAMANOS.celda * 1.3) + 4;
  }
  return 22 + LINEAS_EN_BLANCO * ALTO_LINEA_ESCRITURA;
}

function dibujarObservaciones(doc, datos, startY, opciones = {}) {
  const dibujarEncabezadoPagina = opciones.dibujarEncabezadoPagina;
  const tieneTexto = datos.observaciones.length > 0;

  let lineas = [];
  if (tieneTexto) {
    doc.font(FUENTES.normal).fontSize(TAMANOS.celda);
    lineas = envolverTexto(
      doc,
      datos.observaciones,
      CONTENT_WIDTH,
      FUENTES.normal,
      TAMANOS.celda
    );
  }

  const altoContenido = tieneTexto
    ? lineas.length * (TAMANOS.celda * 1.3) + 4
    : LINEAS_EN_BLANCO * ALTO_LINEA_ESCRITURA;
  const altoRequerido = 22 + altoContenido;

  const left = MARGENES.left;
  let y = asegurarEspacio(doc, startY, altoRequerido, dibujarEncabezadoPagina);

  doc
    .font(FUENTES.negrita)
    .fontSize(TAMANOS.seccion)
    .fillColor(COLORES.primario)
    .text('OBSERVACIONES', left, y, { lineBreak: false });

  const anchoTitulo = doc.widthOfString('OBSERVACIONES');
  doc
    .save()
    .moveTo(left, y + 15)
    .lineTo(left + anchoTitulo + 4, y + 15)
    .lineWidth(1)
    .strokeColor(COLORES.primario)
    .stroke()
    .restore();

  y += 22;

  if (tieneTexto) {
    doc
      .font(FUENTES.normal)
      .fontSize(TAMANOS.celda)
      .fillColor(COLORES.texto)
      .text(lineas.join('\n'), left, y, {
        width: CONTENT_WIDTH,
        align: 'left',
        lineBreak: false,
      });
    return y + altoContenido;
  }

  for (let i = 0; i < LINEAS_EN_BLANCO; i += 1) {
    const lineaY = y + i * ALTO_LINEA_ESCRITURA + ALTO_LINEA_ESCRITURA - 4;
    doc
      .save()
      .moveTo(left, lineaY)
      .lineTo(left + CONTENT_WIDTH, lineaY)
      .lineWidth(0.4)
      .strokeColor(COLORES.borde)
      .dash(2, { space: 3 })
      .stroke()
      .undash()
      .restore();
  }

  return y + altoContenido;
}

module.exports = { dibujarObservaciones, calcularAltoObservaciones };
