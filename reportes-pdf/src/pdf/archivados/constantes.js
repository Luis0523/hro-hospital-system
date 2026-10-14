'use strict';

const path = require('node:path');

const LOGO_HRO_POR_DEFECTO = path.resolve(
  __dirname,
  '..',
  '..',
  '..',
  'assets',
  'logo-hro.jpg'
);

const PAGINA = { width: 612, height: 792 };

const MARGENES = { top: 22, left: 24, right: 24, bottom: 24 };

const CONTENT_WIDTH = PAGINA.width - MARGENES.left - MARGENES.right;

const SEPARACION_TABLAS = 6;
const ANCHO_TABLA = (CONTENT_WIDTH - SEPARACION_TABLAS * 2) / 3;

const COLORES = {
  primario: '#1F3A5F',
  primarioClaro: '#2E4F7A',
  texto: '#1A1A1A',
  textoSuave: '#5B6572',
  borde: '#9AA5B1',
  filaAlterna: '#F2F4F7',
  blanco: '#FFFFFF',
};

const FUENTES = {
  normal: 'Helvetica',
  negrita: 'Helvetica-Bold',
  oblicua: 'Helvetica-Oblique',
};

const TAMANOS = {
  institucion: 11,
  titulo: 13,
  meta: 8,
  encabezadoTabla: 9,
  celda: 9,
  pie: 8,
};

const COLUMNAS = [
  { key: 'numero', label: 'NO.', width: 28, align: 'center' },
  { key: 'numeroExpediente', label: 'EXPEDIENTE', width: 96, align: 'center' },
  { key: 'fecha', label: 'FECHA', width: 60, align: 'center' },
];

const ALTO_LOGO = 32;
const GAP_ENCABEZADO = 6;
const ALTO_ENCABEZADO = MARGENES.top + ALTO_LOGO + GAP_ENCABEZADO;

const ESPACIO_ANTES_TABLAS = 4;
const ALTO_ENCABEZADO_TABLA = 15;
const INICIO_TABLAS = ALTO_ENCABEZADO + ESPACIO_ANTES_TABLAS;
const INICIO_FILAS = INICIO_TABLAS + ALTO_ENCABEZADO_TABLA;

const ALTO_FILA = 15.5;
const ALTO_FIRMAS = 74;
const GAP_SEGURIDAD = 12;

// Zona de firmas anclada al pie (únicamente reservada en la última página).
const Y_PIE = PAGINA.height - MARGENES.bottom;
const Y_INICIO_FIRMAS = Y_PIE - ALTO_FIRMAS;

// Límite vertical de las tablas:
//  - páginas intermedias: hasta el pie de página (sin reservar firmas)
//  - última página: hasta la zona de firmas menos el gap de seguridad
const LIMITE_TABLA_NORMAL = Y_PIE - GAP_SEGURIDAD;
const LIMITE_TABLA_ULTIMA = Y_INICIO_FIRMAS - GAP_SEGURIDAD;

const FILAS_POR_TABLA_NORMAL = Math.floor(
  (LIMITE_TABLA_NORMAL - INICIO_FILAS) / ALTO_FILA
);
const FILAS_POR_TABLA_ULTIMA = Math.floor(
  (LIMITE_TABLA_ULTIMA - INICIO_FILAS) / ALTO_FILA
);

const CAPACIDAD_PAGINA_NORMAL = FILAS_POR_TABLA_NORMAL * 3;
const CAPACIDAD_PAGINA_ULTIMA = FILAS_POR_TABLA_ULTIMA * 3;

const TITULO_POR_DEFECTO = 'EXPEDIENTES ARCHIVADOS';

module.exports = {
  LOGO_HRO_POR_DEFECTO,
  PAGINA,
  MARGENES,
  CONTENT_WIDTH,
  SEPARACION_TABLAS,
  ANCHO_TABLA,
  COLORES,
  FUENTES,
  TAMANOS,
  COLUMNAS,
  ALTO_LOGO,
  ALTO_ENCABEZADO,
  ESPACIO_ANTES_TABLAS,
  ALTO_ENCABEZADO_TABLA,
  INICIO_TABLAS,
  INICIO_FILAS,
  ALTO_FILA,
  ALTO_FIRMAS,
  GAP_SEGURIDAD,
  Y_PIE,
  Y_INICIO_FIRMAS,
  LIMITE_TABLA_NORMAL,
  LIMITE_TABLA_ULTIMA,
  FILAS_POR_TABLA_NORMAL,
  FILAS_POR_TABLA_ULTIMA,
  CAPACIDAD_PAGINA_NORMAL,
  CAPACIDAD_PAGINA_ULTIMA,
  TITULO_POR_DEFECTO,
};
