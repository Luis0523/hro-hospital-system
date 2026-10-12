# reportes-pdf

Utilidad Node.js independiente para generar **reportes PDF formales** de
movimientos de expedientes médicos del Hospital Regional de Occidente (HRO).

Genera dos tipos de documento con el **mismo motor**:

| Tipo        | Documento                                   | Flujo                                            |
| ----------- | ------------------------------------------- | ------------------------------------------------ |
| `salida`    | CONTROL DE SALIDA DE EXPEDIENTES            | Archivo / Registro Médico → Consulta Externa     |
| `devolucion`| CONTROL DE DEVOLUCIÓN DE EXPEDIENTES        | Consulta Externa (COEX) → Archivo / Registro Médico |

## Características

- PDF A4 **landscape** con encabezado institucional, tabla paginada, firmas y observaciones.
- Tabla con encabezado repetido en cada página, filas alternadas y filas que no se cortan.
- La última página reserva espacio para observaciones y firmas; si no caben, se reubican filas finales para evitar una página dedicada solo a las firmas.
- Casillas imprimibles `[ ]` para marcar (`ENVIADO`/`RECIBIDO` o `DEVUELTO`/`RECIBIDO`).
- Pie de página con numeración `Página X de Y`.
- Incluye el **logo institucional HRO** por defecto (`assets/logo-hro.jpg`).
- Logo izquierdo **personalizable** y logo derecho **opcional** (si no se indican, se omite el derecho).
- Sin dependencias de red, sin `eval`, sin ejecutar comandos del sistema.
- No depende de `frontend/`, `backend/` ni `database/`.

## Requisitos

- Node.js 18+ (probado en Node 24).
- Dependencia única: [`pdfkit`](https://www.npmjs.com/package/pdfkit).

## Instalación

```bash
cd reportes-pdf
npm install
```

## Estructura

```
reportes-pdf/
├── src/
│   ├── index.js                      # API pública
│   ├── generarReporteExpedientes.js  # orquestador (valida → normaliza → PDF)
│   ├── validarReporte.js             # validación de entrada
│   ├── normalizarReporte.js          # normalización y valores por defecto
│   └── pdf/
│       ├── constantes.js             # A4 landscape, colores, columnas, textos
│       ├── helpers.js                # utilidades de texto y layout
│       ├── dibujarEncabezado.js
│       ├── dibujarTabla.js
│       ├── dibujarObservaciones.js
│       ├── dibujarFirmas.js
│       └── dibujarPiePagina.js
├── examples/
│   ├── generarEjemplos.js
│   └── data/expedientesEjemplo.js
├── assets/
│   └── logo-hro.jpg                  # logo institucional por defecto
├── tests/
│   ├── generarReporteExpedientes.test.js
│   ├── validarReporte.test.js
│   └── normalizarReporte.test.js
└── output/                           # PDFs generados (ignorados por Git salvo .gitkeep)
```

## API

```js
const { generarReporteExpedientes } = require('./src');

const resultado = await generarReporteExpedientes({ /* config */ });
// { rutaArchivo, totalExpedientes, tipo, fecha, idDocumento }
```

### Ejemplo — SALIDA

```js
const path = require('node:path');
const { generarReporteExpedientes } = require('./src');

await generarReporteExpedientes({
  tipo: 'salida',
  fecha: '2026-10-05',

  origen: 'Archivo / Registro Médico',
  destino: 'Consulta Externa (COEX)',

  generadoPor: 'Administrador del Sistema HRO',
  responsableEntrega: 'Encargado de Archivo',
  responsableRecibe: 'Enfermería COEX',

  expedientes: [
    {
      numeroExpediente: '101011',
      pacienteNombre: 'MARTA MENDOZA ALVAREZ',
      subespecialidadNombre: 'Cirugía General',
      horaEstimada: '11:40',
      estadoActual: 'en_transito_entrega',
    },
  ],

  observaciones: '',
  rutaSalida: path.join(__dirname, 'output', 'salida-2026-10-05.pdf'),
});
```

### Ejemplo — DEVOLUCIÓN

```js
await generarReporteExpedientes({
  tipo: 'devolucion',
  fecha: '2026-10-05',
  origen: 'Consulta Externa (COEX)',
  destino: 'Archivo / Registro Médico',
  responsableEntrega: 'Enfermería COEX',
  responsableRecibe: 'Encargado de Archivo',
  expedientes: [
    /* mismos campos que en salida */
  ],
  observaciones: 'Expedientes verificados sin novedad.',
  rutaSalida: './output/devolucion-2026-10-05.pdf',
});
```

## Formato de datos

| Campo                 | Obligatorio | Descripción                                                        |
| --------------------- | :---------: | ------------------------------------------------------------------ |
| `tipo`                |     sí      | `salida` o `devolucion`.                                           |
| `fecha`               |     sí      | `YYYY-MM-DD` (se valida que exista).                               |
| `expedientes`         |     sí      | Arreglo (puede estar vacío).                                        |
| `rutaSalida`          |     sí      | Ruta del PDF. Se crea el directorio si no existe.                  |
| `origen` / `destino`  |     no      | Por defecto según `tipo`.                                          |
| `generadoPor`         |     no      | Por defecto `Sistema HRO`.                                         |
| `responsableEntrega`  |     no      | Nombre que aparecerá sobre la firma.                               |
| `responsableRecibe`   |     no      | Nombre que aparecerá sobre la firma.                               |
| `observaciones`       |     no      | Si está vacío, se dejan líneas para anotación manual.              |
| `logoIzquierdo`       |     no      | Logo izquierdo. Si se omite, usa `assets/logo-hro.jpg`.            |
| `logoDerecho`         |     no      | Logo derecho. Si falta, no se dibuja.                              |
| `expedientes[].numeroExpediente` | sí | Identificador del expediente.                          |
| `expedientes[].pacienteNombre`   | sí | Nombre del paciente.                                   |
| `expedientes[].subespecialidadNombre` | no | Si falta, se usa `—`.                          |
| `expedientes[].horaEstimada`          | no | Si falta, se usa `—`.                          |
| `expedientes[].estadoActual`          | no | Si falta, se usa `—`.                          |

El identificador documental es determinista: `SAL-YYYYMMDD` / `DEV-YYYYMMDD`.

## Logo institucional

El módulo incluye el logo oficial del Hospital Regional de Occidente en:

```
assets/logo-hro.jpg
```

Comportamiento:

- Si no se especifica `logoIzquierdo`, se usa **automáticamente** el logo institucional incluido (la ruta se resuelve con `__dirname`, no depende del directorio de trabajo).
- Para reemplazarlo por otro logo, basta indicarlo (se conserva la proporción):

```js
await generarReporteExpedientes({
  // ...
  logoIzquierdo: '/ruta/a/otro-logo.png',
});
```

- Si el logo personalizado no existe o no puede leerse, se usa el logo institucional por defecto.
- Si el logo por defecto tampoco estuviera disponible, el PDF se genera igual, omitiendo la imagen (no se lanza error).

El logo derecho es opcional (`logoDerecho`) y no tiene valor por defecto: si no se indica, ese espacio queda vacío.

## Generar ejemplos

```bash
npm run example
```

Genera en `output/`:

- `ejemplo-salida.pdf` (30 expedientes)
- `ejemplo-devolucion.pdf` (30 expedientes)
- `paginacion-01-salida.pdf` (1 expediente)
- `paginacion-22-salida.pdf` (22 expedientes)
- `paginacion-50-salida.pdf` (50 expedientes, varias páginas)

## Tests

```bash
npm test
```

Usa el runner nativo `node --test` (sin Jest/Mocha/Vitest).

## Integración futura

Es una librería pura de Node.js: puede invocarse desde un script, un job o
un servicio backend (`main: src/index.js`). Solo necesita los datos ya
preparados; no realiza peticiones HTTP ni accede a la base de datos.
