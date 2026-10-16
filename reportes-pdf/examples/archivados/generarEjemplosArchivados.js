'use strict';

const path = require('node:path');
const { generarReporteExpedientesArchivados } = require('../../src');

const OUTPUT = path.join(__dirname, '..', '..', 'output');

function construirExpedientes(cantidad, base = 800000, fecha = '2026-10-13') {
  return Array.from({ length: cantidad }, (_, i) => ({
    numero: i + 1,
    numeroExpediente: String(base + i),
    fecha,
  }));
}

const FIRMANTES = [
  { nombre: 'Encargado de Archivo', cargo: 'Archivo / Registro Médico' },
  { nombre: 'Jefe de Registro Médico', cargo: 'Registro Médico' },
];

async function generar() {
  const resultados = [];
  const tamanos = [1, 10, 30, 50, 100, 200];

  for (const cantidad of tamanos) {
    const numero = String(cantidad).padStart(3, '0');
    resultados.push(
      await generarReporteExpedientesArchivados({
        titulo: 'EXPEDIENTES ARCHIVADOS',
        fecha: '2026-10-13',
        expedientes: construirExpedientes(cantidad),
        firmantes: FIRMANTES,
        rutaSalida: path.join(OUTPUT, `archivados-${numero}.pdf`),
      })
    );
  }

  resultados.push(
    await generarReporteExpedientesArchivados({
      titulo: 'CONTROL DE EXPEDIENTES ARCHIVADOS',
      fecha: '2026-10-13',
      expedientes: construirExpedientes(50),
      firmantes: [{ nombre: 'Único Firmante' }],
      rutaSalida: path.join(OUTPUT, 'archivados-titulo-alterno.pdf'),
    })
  );

  for (const resultado of resultados) {
    console.log(
      `OK  ${String(resultado.totalExpedientes).padStart(3)} expedientes  ` +
        `${String(resultado.paginas).padStart(2)} pág.  ` +
        `"${resultado.titulo}"  ${resultado.rutaArchivo}`
    );
  }
}

generar().catch((error) => {
  console.error('Error generando ejemplos:', error.message);
  process.exitCode = 1;
});
