// Secciones de la estación de enfermería (submenú). El registro de carnets y la
// recepción/devolución de expedientes (Mesa COEX) conviven con el calendario.
export const SECCIONES_ENFERMERIA = [
  { to: '/enfermeria', etiqueta: 'Calendario y citas', icono: 'calendar_month', exacto: true },
  { to: '/enfermeria/carnets', etiqueta: 'Registro de carnets', icono: 'badge' },
  { to: '/coex', etiqueta: 'Expedientes (COEX)', icono: 'inventory_2' },
]
