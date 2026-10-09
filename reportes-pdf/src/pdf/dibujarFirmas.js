'use strict';

const {
  CONTENT_WIDTH,
  MARGENES,
  COLORES,
  FUENTES,
  TAMANOS,
} = require('./constantes');
const { asegurarEspacio } = require('./helpers');

const ALTO_FIRMAS = 70;
const SEPARACION_COLUMNAS = 70;

function dibujarFirmas(doc, datos, startY, opciones = {}) {
  const dibujarEncabezadoPagina = opciones.dibujarEncabezadoPagina;
  const y = asegurarEspacio(
    doc,
    startY,
    ALTO_FIRMAS,
    dibujarEncabezadoPagina
  );

  const left = MARGENES.left;
  const anchoColumna =
    (CONTENT_WIDTH - SEPARACION_COLUMNAS) / 2;
  const izquierdaX = left;
  const derechaX = left + anchoColumna + SEPARACION_COLUMNAS;
  const lineaY = y + 34;

  const columnas = [
    { x: izquierdaX, rol: datos.textos.entregaResponsable, nombre: datos.responsableEntrega },
    { x: derechaX, rol: datos.textos.recibeResponsable, nombre: datos.responsableRecibe },
  ];

  for (const columna of columnas) {
    if (columna.nombre) {
      doc
        .font(FUENTES.normal)
        .fontSize(TAMANOS.celda)
        .fillColor(COLORES.texto)
        .text(columna.nombre, columna.x, lineaY - 13, {
          width: anchoColumna,
          align: 'center',
          lineBreak: false,
          ellipsis: true,
        });
    }

    doc
      .save()
      .moveTo(columna.x, lineaY)
      .lineTo(columna.x + anchoColumna, lineaY)
      .lineWidth(0.8)
      .strokeColor(COLORES.texto)
      .stroke()
      .restore();

    doc
      .font(FUENTES.negrita)
      .fontSize(TAMANOS.celda)
      .fillColor(COLORES.texto)
      .text(columna.rol, columna.x, lineaY + 6, {
        width: anchoColumna,
        align: 'center',
        lineBreak: false,
        ellipsis: true,
      });

    doc
      .font(FUENTES.normal)
      .fontSize(TAMANOS.nota)
      .fillColor(COLORES.textoSuave)
      .text('Nombre y firma', columna.x, lineaY + 18, {
        width: anchoColumna,
        align: 'center',
        lineBreak: false,
      });
  }

  return y + ALTO_FIRMAS;
}

module.exports = { dibujarFirmas, ALTO_FIRMAS };
