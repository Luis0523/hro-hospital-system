'use strict';

const path = require('node:path');
const { generarReporteExpedientes } = require('../src');
const { construirExpedientes } = require('./data/expedientesEjemplo');

const OUTPUT = path.join(__dirname, '..', 'output');

const base = {
  fecha: '2026-10-05',
  generadoPor: 'Administrador del Sistema HRO',
};

const LOGO_INSTITUCIONAL = path.join(
  __dirname,
  '..',
  'assets',
  'logo-hro.jpg'
);

async function generar() {
  const resultados = [];

  resultados.push(
    await generarReporteExpedientes({
      ...base,
      tipo: 'salida',
      origen: 'Archivo / Registro Médico',
      destino: 'Consulta Externa (COEX)',
      responsableEntrega: 'Encargado de Archivo',
      responsableRecibe: 'Enfermería COEX',
      expedientes: construirExpedientes(30),
      observaciones: '',
      rutaSalida: path.join(OUTPUT, 'ejemplo-salida.pdf'),
    })
  );

  resultados.push(
    await generarReporteExpedientes({
      ...base,
      tipo: 'devolucion',
      origen: 'Consulta Externa (COEX)',
      destino: 'Archivo / Registro Médico',
      responsableEntrega: 'Enfermería COEX',
      responsableRecibe: 'Encargado de Archivo',
      expedientes: construirExpedientes(30),
      observaciones:
        'Se devuelven los expedientes sin novedad, verificados contra el control de salida del día.',
      rutaSalida: path.join(OUTPUT, 'ejemplo-devolucion.pdf'),
    })
  );

  resultados.push(
    await generarReporteExpedientes({
      ...base,
      tipo: 'salida',
      origen: 'Archivo / Registro Médico',
      destino: 'Consulta Externa (COEX)',
      responsableEntrega: 'Encargado de Archivo',
      responsableRecibe: 'Enfermería COEX',
      logoIzquierdo: LOGO_INSTITUCIONAL,
      expedientes: construirExpedientes(30),
      observaciones: 'Ejemplo con override explícito de logoIzquierdo.',
      rutaSalida: path.join(OUTPUT, 'ejemplo-salida-logo-personalizado.pdf'),
    })
  );

  const tamanos = [1, 22, 50];
  for (const cantidad of tamanos) {
    const numero = String(cantidad).padStart(2, '0');
    resultados.push(
      await generarReporteExpedientes({
        ...base,
        tipo: 'salida',
        origen: 'Archivo / Registro Médico',
        destino: 'Consulta Externa (COEX)',
        responsableEntrega: 'Encargado de Archivo',
        responsableRecibe: 'Enfermería COEX',
        expedientes: construirExpedientes(cantidad),
        observaciones: '',
        rutaSalida: path.join(
          OUTPUT,
          `paginacion-${numero}-salida.pdf`
        ),
      })
    );
  }

  for (const resultado of resultados) {
    console.log(
      `OK  ${resultado.tipo.padEnd(10)} ` +
        `${String(resultado.totalExpedientes).padStart(3)} expedientes  ` +
        `${resultado.idDocumento}  ${resultado.rutaArchivo}`
    );
  }
}

generar().catch((error) => {
  console.error('Error generando ejemplos:', error.message);
  process.exitCode = 1;
});
