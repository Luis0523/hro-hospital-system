# SCRUM-260 — Frontend: generador de ticket de impresión 58 mm

- **Jira:** SCRUM-260
- **Responsable:** Luis Rolando Colop Tzoc
- **Vencimiento:** 2026-10-21
- **Prioridad:** Medium
- **Sprint:** Sprint 3 - Archivo
- **Épica padre:** SCRUM-155
- **Rama sugerida:** `frontend-ticket-impresion`

## Contexto

En esta etapa solo se necesita la **utilidad** que genera e imprime un ticket de 58 mm.
No se integra todavía a `ConfirmacionCita` ni a Seguimiento.

## Objetivo

Crear `frontend/src/shared/utils/ticketImpresion.js` con una función reutilizable que genere
el HTML del ticket y dispare la impresión del navegador.

## API propuesta

```js
export function generarTicketImpresion({
  titulo = 'Comprobante de cita',
  turno,
  especialidad,
  clinica,
  observacion,
  fecha,
  paciente,
  expediente,
  recomendacion,
  abrirVentana = true,
}) {
  // devuelve el HTML generado
}
```

Reglas:

- `turno` y `especialidad` son obligatorios; si faltan, lanzar error claro.
- El resto de campos son opcionales y se omiten si vienen vacíos.
- Escapar todo texto interpolado (nombres, observaciones, recomendación).
- Si `abrirVentana` es `true`, abrir la ventana de impresión.
- Exponer también una función de apoyo para tests:

```js
export function construirHtmlTicket(datos)
```

## Contenido del ticket

- Título.
- Turno / correlativo en tamaño grande.
- Especialidad.
- Clínica u observación.
- Fecha y hora.
- Paciente y expediente (si existen).
- Recomendación breve.
- Pie: “Hospital Regional de Occidente — SIGHO”.

## Estilos de impresión

- Ancho de papel: 58 mm.
- Fuente monoespaciada legible (por ejemplo `ui-monospace, "Courier New", monospace`).
- Sin márgenes grandes.
- `@media print` con `@page { margin: 0; }` y ancho fijo.
- Evitar colores dependientes de tema claro/oscuro.
- Separadores simples para ahorrar tinta.

## Estructura propuesta

```text
frontend/src/shared/utils/
├── ticketImpresion.js
└── ticketImpresion.test.js
```

## Fuera de alcance

- Integración en `ConfirmacionCita`.
- Integración en Seguimiento.
- Impresión ESC/POS directa.
- Backend o endpoints.
- Diseño gráfico avanzado.

## Criterios de aceptación

- [ ] La utilidad genera un ticket con todos los campos presentes.
- [ ] Los valores se escapan correctamente.
- [ ] El HTML define ancho de 58 mm y estilos `@media print`.
- [ ] Si falta `turno` o `especialidad`, lanza error y no imprime.
- [ ] Los campos opcionales vacíos no generan filas vacías.
- [ ] Existe prueba unitaria de generación y escape.
- [ ] `npm run lint`, `npm run test:run` y `npm run build` pasan sin errores nuevos.

## Pruebas sugeridas

- `construirHtmlTicket` con datos completos contiene turno, especialidad y clínica.
- `construirHtmlTicket` con `<script>` en un nombre lo escapa.
- `generarTicketImpresion` sin `turno` lanza error.
- Opcionales vacíos no aparecen en el HTML.

## Validación

Desde `frontend/`:

```bash
npm run lint
npm run test:run
npm run build
```

## Referencias

- `frontend/src/shared/utils/`
- `frontend/src/modules/enfermeria/components/ConfirmacionCita.jsx` (integración futura)
- `frontend/src/shared/components/ui/`
