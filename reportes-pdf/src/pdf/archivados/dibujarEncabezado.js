'use strict';

const {
  MARGENES,
  CONTENT_WIDTH,
  COLORES,
  FUENTES,
  TAMANOS,
  ALTO_LOGO,
  ALTO_ENCABEZADO,
} = require('./constantes');
const { dibujarLogo } = require('../dibujarEncabezado');
const { formatearFechaHora } = require('../helpers');
const { escribirLinea } = require('./texto');

const SEPARACION_LOGO = 10;
const ANCHO_META = 150;

function dibujarEncabezado(doc, datos) {
  const left = MARGENES.left;
  const right = MARGENES.left + CONTENT_WIDTH;
  const y = MARGENES.top;

  const logoDibujado = dibujarLogo(
    doc,
    datos.logo,
    datos.logoFallback,
    left,
    y,
    ALTO_LOGO
  );

  const textX = logoDibujado ? left + ALTO_LOGO + SEPARACION_LOGO : left;

  escribirLinea(doc, 'HOSPITAL REGIONAL DE OCCIDENTE', textX, y + 3, {
    fuente: FUENTES.negrita,
    tamano: TAMANOS.institucion,
    color: COLORES.primario,
  });

  escribirLinea(doc, datos.titulo, textX, y + 15, {
    fuente: FUENTES.negrita,
    tamano: TAMANOS.titulo,
    color: COLORES.texto,
  });

  escribirLinea(
    doc,
    `Generado: ${formatearFechaHora(datos.fechaGeneracion)}`,
    right - ANCHO_META,
    y + 4,
    {
      fuente: FUENTES.normal,
      tamano: TAMANOS.meta,
      color: COLORES.textoSuave,
      align: 'right',
      ancho: ANCHO_META,
    }
  );

  escribirLinea(doc, `Total: ${datos.totalExpedientes}`, right - ANCHO_META, y + 15, {
    fuente: FUENTES.normal,
    tamano: TAMANOS.meta,
    color: COLORES.textoSuave,
    align: 'right',
    ancho: ANCHO_META,
  });

  const yLinea = ALTO_ENCABEZADO - 4;
  doc
    .save()
    .moveTo(left, yLinea)
    .lineTo(right, yLinea)
    .lineWidth(0.8)
    .strokeColor(COLORES.primario)
    .stroke()
    .restore();

  return ALTO_ENCABEZADO;
}

module.exports = { dibujarEncabezado };
