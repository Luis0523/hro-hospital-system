'use strict';

const path = require('node:path');

const LOGO_HRO_POR_DEFECTO = path.resolve(
  __dirname,
  '..',
  '..',
  'assets',
  'logo-hro.jpg'
);

const A4_LANDSCAPE = { width: 841.89, height: 595.28 };

const MARGENES = { top: 42, left: 40, right: 40, bottom: 52 };

const CONTENT_WIDTH =
  A4_LANDSCAPE.width - MARGENES.left - MARGENES.right;

const COLORES = {
  primario: '#1F3A5F',
  primarioClaro: '#2E4F7A',
  texto: '#1A1A1A',
  textoSuave: '#5B6572',
  borde: '#9AA5B1',
  filaAlterna: '#F2F4F7',
  panel: '#EDF1F6',
  blanco: '#FFFFFF',
};

const FUENTES = {
  normal: 'Helvetica',
  negrita: 'Helvetica-Bold',
  oblicua: 'Helvetica-Oblique',
};

const TAMANOS = {
  institucion: 15,
  titulo: 16,
  subtitulo: 10,
  seccion: 11,
  etiqueta: 8,
  celda: 8.5,
  nota: 7.5,
};

const CASILLA = '[ ]';

const COLUMNAS = [
  { key: 'indice', label: '#', width: 34, align: 'center' },
  { key: 'numeroExpediente', label: 'Expediente', width: 92, align: 'left' },
  { key: 'pacienteNombre', label: 'Paciente', width: 220, align: 'left' },
  {
    key: 'subespecialidadNombre',
    label: 'Área / Subespecialidad',
    width: 197.89,
    align: 'left',
  },
  { key: 'horaEstimada', label: 'Hora', width: 58, align: 'center' },
  {
    key: 'marca1',
    label: { salida: 'ENVIADO', devolucion: 'DEVUELTO' },
    width: 80,
    align: 'center',
  },
  { key: 'marca2', label: 'RECIBIDO', width: 80, align: 'center' },
];

const TEXTOS = {
  salida: {
    titulo: 'CONTROL DE SALIDA DE EXPEDIENTES',
    subtitulo: 'Archivo / Registro Médico \u2192 Consulta Externa (COEX)',
    prefijoId: 'SAL',
    entregaResponsable: 'Entrega - Archivo',
    recibeResponsable: 'Recibe - COEX / Enfermería',
  },
  devolucion: {
    titulo: 'CONTROL DE DEVOLUCIÓN DE EXPEDIENTES',
    subtitulo: 'Consulta Externa (COEX) \u2192 Archivo / Registro Médico',
    prefijoId: 'DEV',
    entregaResponsable: 'Entrega - COEX / Enfermería',
    recibeResponsable: 'Recibe - Archivo',
  },
};

const ALTO_ENCABEZADO_TABLA = 22;
const PADDING_CELDA_X = 4;
const PADDING_CELDA_Y = 3;
const ALTO_FILA_MIN = 16;

module.exports = {
  A4_LANDSCAPE,
  LOGO_HRO_POR_DEFECTO,
  MARGENES,
  CONTENT_WIDTH,
  COLORES,
  FUENTES,
  TAMANOS,
  CASILLA,
  COLUMNAS,
  TEXTOS,
  ALTO_ENCABEZADO_TABLA,
  PADDING_CELDA_X,
  PADDING_CELDA_Y,
  ALTO_FILA_MIN,
};
