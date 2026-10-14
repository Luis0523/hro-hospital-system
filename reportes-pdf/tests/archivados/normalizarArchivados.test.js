'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const {
  normalizarArchivados,
} = require('../../src/normalizarArchivados');
const {
  LOGO_HRO_POR_DEFECTO,
  TITULO_POR_DEFECTO,
} = require('../../src/pdf/archivados/constantes');

function base(extra = {}) {
  return {
    expedientes: [
      { numeroExpediente: '837871', fecha: '2026-10-13' },
      { numeroExpediente: '837872', fecha: '2026-10-14' },
    ],
    rutaSalida: './out/x.pdf',
    ...extra,
  };
}

test('usa el título por defecto cuando no se envía', () => {
  assert.equal(normalizarArchivados(base()).titulo, TITULO_POR_DEFECTO);
});

test('respeta el título enviado', () => {
  const datos = normalizarArchivados(base({ titulo: 'CONTROL X' }));
  assert.equal(datos.titulo, 'CONTROL X');
});

test('autonumera si el backend no envía numero', () => {
  const datos = normalizarArchivados(base());
  assert.deepEqual(
    datos.expedientes.map((e) => e.numero),
    [1, 2]
  );
});

test('respeta el numero enviado por el backend', () => {
  const datos = normalizarArchivados(
    base({
      expedientes: [
        { numero: 10, numeroExpediente: 'A', fecha: '2026-10-13' },
        { numero: 11, numeroExpediente: 'B', fecha: '2026-10-13' },
      ],
    })
  );
  assert.deepEqual(
    datos.expedientes.map((e) => e.numero),
    [10, 11]
  );
});

test('formatea la fecha para presentación sin cambiar el valor lógico', () => {
  const datos = normalizarArchivados(base());
  assert.equal(datos.expedientes[0].fechaISO, '2026-10-13');
  assert.equal(datos.expedientes[0].fechaTexto, '13/10/2026');
});

test('normaliza firmantes y aplica etiqueta por defecto', () => {
  const datos = normalizarArchivados(
    base({ firmantes: [{ nombre: 'Uno' }] })
  );
  assert.equal(datos.firmantes.length, 1);
  assert.equal(datos.firmantes[0].etiqueta, 'Nombre y firma');
});

test('usa el logo institucional por defecto', () => {
  const datos = normalizarArchivados(base());
  assert.equal(datos.logo, LOGO_HRO_POR_DEFECTO);
  assert.equal(datos.logoFallback, LOGO_HRO_POR_DEFECTO);
});

test('lista vacía se normaliza a cero expedientes', () => {
  const datos = normalizarArchivados(base({ expedientes: [] }));
  assert.equal(datos.totalExpedientes, 0);
});
